import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

const Profile = () => {
    const { user } = useAuth()
    const { userId } = useParams()
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // Determine if browsing own profile
    const targetUserId = userId || user?.id
    const isOwnProfile = !userId || userId === user?.id

    // View States: 'profile', 'account', 'edit-username', 'edit-phone', 'edit-email'
    const [view, setView] = useState('profile')

    // Form States
    const [tempValue, setTempValue] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (targetUserId) {
            fetchProfile()
            fetchMyPosts()
        }
    }, [targetUserId])

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

    // Real-time username check logic
    useEffect(() => {
        if (view !== 'edit-username' || tempValue === profile?.username) {
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
            if (field === 'email') {
                const { error } = await supabase.auth.updateUser({ email: value })
                if (error) throw error
                alert('VERIFICATION EMAIL SENT')
            } else {
                const update = field === 'username' ? { username: value } : { phone_number: value }
                const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
                if (error) throw error
                setProfile({ ...profile, ...update })
                alert('IDENTITY UPDATED')
            }
            setView('account')
        } catch (err) {
            alert('FAIL: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>INITIALIZING SECURE LINK...</div>

    // Sub-view: Edit Identity
    if (view.startsWith('edit-')) {
        const type = view.split('-')[1]
        return (
            <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
                <button onClick={() => setView('account')} className="nav-link" style={{ marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>← BACK TO ACCOUNT</button>
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase' }}>UPDATE {type}</h2>
                    <div className="form-group" style={{ marginTop: '2rem' }}>
                        <label className="form-label">NEW {type}</label>
                        <input
                            type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text'}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            style={{ borderColor: usernameError ? 'var(--primary)' : '' }}
                        />
                        {checkingUsername && <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>VERIFYING...</p>}
                        {usernameError && <p style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>{usernameError.toUpperCase()}</p>}
                    </div>
                    <button
                        onClick={() => saveIdentity(type, tempValue)}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={isSaving || (type === 'username' && (!!usernameError || checkingUsername))}
                    >
                        {isSaving ? 'SECURING...' : 'CONFIRM CHANGE'}
                    </button>
                </div>
            </div>
        )
    }

    // Sub-view: Account Control Center
    if (view === 'account') {
        return (
            <div className="container" style={{ maxWidth: '500px', marginTop: '4rem' }}>
                <button onClick={() => setView('profile')} className="nav-link" style={{ marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>← BACK TO PROFILE</button>
                <div className="card">
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem' }}>ACCOUNT CONTROL</h2>

                    <div className="setting-item" onClick={() => { setView('edit-username'); setTempValue(profile.username); }} style={{ borderBottom: '1px solid var(--border)', padding: '1.5rem 0', cursor: 'pointer' }}>
                        <label className="form-label" style={{ margin: 0 }}>USERNAME</label>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>{profile.username}</span>
                            <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800 }}>CHANGE →</span>
                        </div>
                    </div>

                    <div className="setting-item" onClick={() => { setView('edit-phone'); setTempValue(profile.phone_number || ''); }} style={{ borderBottom: '1px solid var(--border)', padding: '1.5rem 0', cursor: 'pointer' }}>
                        <label className="form-label" style={{ margin: 0 }}>PHONE NUMBER</label>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>{profile.phone_number || 'NOT SET'}</span>
                            <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800 }}>CHANGE →</span>
                        </div>
                    </div>

                    <div className="setting-item" onClick={() => { setView('edit-email'); setTempValue(user.email); }} style={{ borderBottom: '1px solid var(--border)', padding: '1.5rem 0', cursor: 'pointer' }}>
                        <label className="form-label" style={{ margin: 0 }}>EMAIL ADDRESS</label>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>{user.email}</span>
                            <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800 }}>CHANGE →</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}
                        className="btn btn-outline"
                        style={{ width: '100%', marginTop: '2rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                        LOGOUT FROM HELLOALL
                    </button>
                </div>
            </div>
        )
    }

    // Main Profile View
    return (
        <div className="container" style={{ position: 'relative' }}>
            <div className="profile-hero" style={{ border: 'none', background: 'none' }}>
                <div style={{
                    width: '130px',
                    height: '130px',
                    margin: '0 auto',
                    background: 'var(--surface)',
                    border: '3px solid var(--primary)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                    ) : (
                        <div style={{ padding: '2.5rem', fontSize: '2.5rem' }}>👤</div>
                    )}
                    {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>SYNCING...</div>}
                </div>

                <h1 className="profile-name" style={{ marginTop: '1rem', fontSize: '2.5rem' }}>{profile?.username.toUpperCase()}</h1>

                {isOwnProfile ? (
                    <label className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.6rem', padding: '0.4rem 1rem' }}>
                        {uploading ? 'UPLOADING...' : 'CHANGE PHOTO'}
                        <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                ) : (
                    <Link
                        to={`/chat/${targetUserId}`}
                        className="btn btn-primary"
                        style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.6rem', padding: '0.4rem 1rem', textDecoration: 'none' }}
                    >
                        📩 SEND MESSAGE
                    </Link>
                )}

            </div>

            <div style={{ marginTop: '4rem' }}>
                <h2 className="feed-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    {isOwnProfile ? 'YOUR STORIES' : `${profile?.username.toUpperCase()}'S STORIES`}
                </h2>
                {posts.length > 0 ? (
                    <div style={{ marginTop: '2rem' }}>
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                user={user}
                                onDeleteSuccess={handleDeleteSuccess}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
                        <p>NO SECURE BROADCASTS FOUND</p>
                    </div>
                )}
            </div>

            {/* Floating Account Button - Only for owner */}
            {isOwnProfile && (
                <button
                    onClick={() => setView('account')}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '0',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.4rem',
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(255, 30, 30, 0.4)',
                        zIndex: 1001,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                    ACCOUNT
                </button>
            )}

        </div>
    )
}

export default Profile
