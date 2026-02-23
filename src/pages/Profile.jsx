import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link as RouterLink, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

const Profile = () => {
    const { user } = useAuth()
    const { userId } = useParams()
    const [searchParams] = useSearchParams()
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // View States: 'profile', 'account', 'edit-*', 'chat-setup', 'messaging'
    const [view, setView] = useState(searchParams.get('view') || 'profile')

    // Form & Chat States
    const [tempValue, setTempValue] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Chat Specific States
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const scrollRef = useRef()

    const targetUserId = userId || user?.id
    const isOwnProfile = !userId || userId === user?.id

    useEffect(() => {
        if (targetUserId) {
            fetchProfile()
            fetchMyPosts()
        }
    }, [targetUserId])

    // Real-time Chat Subscription in Profile
    useEffect(() => {
        if (view === 'messaging' && !isOwnProfile && targetUserId) {
            fetchMessages()
            markAsRead()

            const channel = supabase.channel(`profile_chat_${targetUserId}`)
            channel
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                }, (payload) => {
                    if (payload.new.sender_id === targetUserId) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === payload.new.id)) return prev
                            return [...prev, payload.new]
                        })
                        markAsRead()
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [view, targetUserId, isOwnProfile])

    useEffect(() => {
        if (view === 'messaging') {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, view])

    const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single()
        if (data) setProfile(data)
    }

    const fetchMyPosts = async () => {
        const { data } = await supabase
            .from('posts')
            .select('*, profiles:user_id(username, avatar_url)')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
        if (data) setPosts(data)
        setLoading(false)
    }

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })
        if (data) setMessages(data)
    }

    const markAsRead = async () => {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', targetUserId)
            .eq('receiver_id', user.id)
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return
        const { data, error } = await supabase.from('messages').insert([{
            sender_id: user.id,
            receiver_id: targetUserId,
            content: newMessage.trim()
        }]).select()
        if (!error) {
            setMessages([...messages, data[0]])
            setNewMessage('')
        }
    }

    const handleAvatarUpload = async (e) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return
            setUploading(true)
            const file = e.target.files[0]
            const filePath = `avatars/${user.id}.${file.name.split('.').pop()}`
            const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath)
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
            setProfile({ ...profile, avatar_url: publicUrl })
            alert('IDENTITY PHOTO UPDATED')
        } catch (err) {
            alert('UPLOAD FAIL: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteSuccess = (postId) => {
        setPosts(posts.filter(p => p.id !== postId))
    }

    // Settings Validation Port
    useEffect(() => {
        if (!view.startsWith('edit-') || tempValue === profile?.username) {
            setUsernameError('')
            return
        }
        const check = async () => {
            if (tempValue.length < 3) return setUsernameError('')
            setCheckingUsername(true)
            const { data } = await supabase.from('profiles').select('username').ilike('username', tempValue).single()
            setUsernameError(data ? 'username not available' : '')
            setCheckingUsername(false)
        }
        const timer = setTimeout(check, 500)
        return () => clearTimeout(timer)
    }, [tempValue, view, profile])

    const saveIdentity = async (field, value) => {
        if (usernameError || checkingUsername) return
        setIsSaving(true)
        try {
            const update = field === 'username' ? { username: value } : { phone_number: value }
            const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
            if (error) throw error
            setProfile({ ...profile, ...update })
            setView('account')
            alert('IDENTITY UPDATED')
        } catch (err) {
            alert('FAIL: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>INITIALIZING SECURE LINK...</div>

    // Sub-view: Identity Edit
    if (view.startsWith('edit-')) {
        const type = view.split('-')[1]
        return (
            <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
                <button onClick={() => setView('account')} className="nav-link" style={{ marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>← CANCEL</button>
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 900 }}>UPDATE {type.toUpperCase()}</h2>
                    <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        style={{ marginTop: '1rem', borderColor: usernameError ? 'var(--primary)' : '' }}
                    />
                    {usernameError && <p style={{ color: 'var(--primary)', fontSize: '0.6rem', marginTop: '5px' }}>{usernameError.toUpperCase()}</p>}
                    <button onClick={() => saveIdentity(type, tempValue)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSaving || (type === 'username' && (!!usernameError || checkingUsername))}>
                        SAVE CHANGES
                    </button>
                </div>
            </div>
        )
    }

    // Sub-view: Social Identity Card (Chat Setup)
    if (view === 'chat-setup') {
        return (
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem' }}>
                    <div style={{ width: '120px', height: '120px', margin: '0 auto', border: '2px solid var(--primary)', overflow: 'hidden' }}>
                        {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '3rem', padding: '1.5rem' }}>👤</div>}
                    </div>
                    <h2 style={{ marginTop: '2rem', fontSize: '1.5rem', fontWeight: 900 }}>{profile?.username.toUpperCase()}</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>ESTABLISHING ENCRYPTED CONNECTION</p>
                    <button onClick={() => setView('messaging')} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>START SECURE CHAT</button>
                    <button onClick={() => setView('profile')} className="nav-link" style={{ marginTop: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}>CANCEL</button>
                </div>
            </div>
        )
    }

    // Sub-view: Active Messaging
    if (view === 'messaging') {
        return (
            <div className="container" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                <div className="post-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <button onClick={() => setView('profile')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
                    <div style={{ width: '40px', height: '40px', border: '1px solid var(--primary)' }}>
                        {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', padding: '8px' }}>👤</div>}
                    </div>
                    <div>
                        <span style={{ fontWeight: 900, display: 'block' }}>{profile?.username.toUpperCase()}</span>
                        <span style={{ fontSize: '0.5rem', color: 'var(--primary)', fontWeight: 800 }}>MESSAGING ACTIVE</span>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            background: msg.sender_id === user.id ? 'var(--primary)' : 'var(--surface)',
                            color: msg.sender_id === user.id ? 'white' : 'var(--text)',
                            padding: '0.8rem 1.2rem',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem',
                            boxShadow: 'var(--card-shadow)'
                        }}>

                            {msg.content}
                            <div style={{ fontSize: '0.5rem', marginTop: '5px', opacity: 0.6 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>

                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="ENTER SECURE TRANSMISSION..." style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', padding: '1rem' }} />
                    <button type="submit" className="btn btn-primary">SEND</button>
                </form>
            </div>
        )
    }

    // Sub-view: Account Control
    if (view === 'account') {
        return (
            <div className="container" style={{ maxWidth: '500px', marginTop: '4rem' }}>
                <button onClick={() => setView('profile')} className="nav-link" style={{ marginBottom: '2rem', border: 'none', background: 'none', cursor: 'pointer' }}>← PROFILE</button>
                <div className="card">
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem' }}>ACCOUNT CONTROL</h2>
                    <div onClick={() => { setView('edit-username'); setTempValue(profile.username); }} style={{ borderBottom: '1px solid var(--border)', padding: '1rem 0', cursor: 'pointer' }}>
                        <label className="form-label">USERNAME</label>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{profile.username}</span> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>EDIT →</span>
                        </div>
                    </div>
                    <div onClick={() => { setView('edit-phone'); setTempValue(profile.phone_number || ''); }} style={{ borderBottom: '1px solid var(--border)', padding: '1rem 0', cursor: 'pointer', marginTop: '1rem' }}>
                        <label className="form-label">PHONE</label>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{profile.phone_number || 'NOT SET'}</span> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>EDIT →</span>
                        </div>
                    </div>
                    <button onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }} className="btn btn-outline" style={{ width: '100%', marginTop: '2rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}>LOGOUT</button>
                </div>
            </div>
        )
    }

    // Default: Main Profile View
    return (
        <div className="container">
            <div className="profile-hero" style={{ border: 'none', background: 'none', textAlign: 'center' }}>
                <div style={{ width: '130px', height: '130px', margin: '0 auto', border: '3px solid var(--primary)', overflow: 'hidden' }}>
                    {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '2.5rem', padding: '2.5rem' }}>👤</div>}
                </div>
                <h1 style={{ marginTop: '1.5rem', fontSize: '2.5rem', fontWeight: 900 }}>{profile?.username.toUpperCase()}</h1>

                <div style={{ marginTop: '1.5rem' }}>
                    {isOwnProfile ? (
                        <label className="btn btn-primary" style={{ padding: '0.5rem 2rem', fontSize: '0.7rem' }}>
                            {uploading ? 'SYNCING...' : 'CHANGE PHOTO'}
                            <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                    ) : (
                        <button onClick={() => setView('chat-setup')} className="btn btn-primary" style={{ padding: '0.5rem 2rem', fontSize: '0.7rem' }}>
                            📩 MESSAGE
                        </button>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '4rem' }}>
                <h2 className="feed-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    {isOwnProfile ? 'YOUR STORIES' : `${profile?.username.toUpperCase()}'S STORIES`}
                </h2>
                {posts.length > 0 ? (
                    <div style={{ marginTop: '2rem' }}>
                        {posts.map(post => <PostCard key={post.id} post={post} user={user} onDeleteSuccess={handleDeleteSuccess} />)}
                    </div>
                ) : (
                    <div style={{ padding: '5rem 0', textAlign: 'center', opacity: 0.5 }}><p>NO STORIES BROADCASTED</p></div>
                )}
            </div>

            {isOwnProfile && (
                <button onClick={() => setView('account')} style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 900, fontSize: '0.5rem', cursor: 'pointer', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚙️</span>ACCOUNT
                </button>
            )}
        </div>
    )
}

export default Profile
