import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // Settings States
    const [showSettings, setShowSettings] = useState(false)
    const [newUsername, setNewUsername] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (user) fetchProfile()
    }, [user])

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile(data)
                setNewUsername(data.username)
                setNewPhone(data.phone_number || '')
                setNewEmail(user.email)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Real-time username check for Settings
    useEffect(() => {
        if (!showSettings || newUsername === profile?.username) {
            setUsernameError('')
            return
        }

        const checkAvailability = async () => {
            if (newUsername.length < 3) {
                setUsernameError('')
                return
            }

            setCheckingUsername(true)
            setUsernameError('')

            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('username')
                    .ilike('username', newUsername)
                    .single()

                if (data) {
                    setUsernameError('username was not available')
                }
            } catch (err) {
                // Not found = available
            } finally {
                setCheckingUsername(false)
            }
        }

        const timeoutId = setTimeout(checkAvailability, 500)
        return () => clearTimeout(timeoutId)
    }, [newUsername, showSettings, profile])

    const handleUpdateSettings = async (e) => {
        e.preventDefault()
        if (usernameError || checkingUsername) return
        setIsSaving(true)

        try {
            // 1. Update Profile (Username/Phone)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: newUsername,
                    phone_number: newPhone
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            // 2. Update Auth Email if changed
            if (newEmail !== user.email) {
                const { error: authError } = await supabase.auth.updateUser({ email: newEmail })
                if (authError) throw authError
                alert('CONFIRMATION EMAIL SENT TO NEW ADDRESS')
            }

            setProfile({ ...profile, username: newUsername, phone_number: newPhone })
            setShowSettings(false)
            alert('IDENTITY SETTINGS UPDATED SECURELY')
        } catch (err) {
            alert('UPDATE FAIL: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAvatarUpload = async (e) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return
            setUploading(true)
            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setProfile({ ...profile, avatar_url: publicUrl })
            alert('IDENTITY PHOTO UPDATED SECURELY')
        } catch (err) {
            alert('UPLOAD FAIL: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="container">LOADING SECURE DATA...</div>

    return (
        <div className="container">
            <div className="profile-hero">
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto',
                        background: 'var(--border)',
                        border: '2px solid var(--primary)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                        ) : (
                            <div style={{ padding: '2rem', fontSize: '2rem' }}>👤</div>
                        )}
                        {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>SYNCING...</div>}
                    </div>
                    <label className="btn btn-outline" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.7rem', padding: '0.5rem 1rem' }}>
                        {uploading ? 'WAIT...' : 'UPDATE PHOTO'}
                        <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="profile-name">{profile?.username || 'USER'}</div>

                <div style={{ marginTop: '2rem' }}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.7rem', padding: '0.5rem 1.5rem' }}
                    >
                        {showSettings ? 'EXIT SETTINGS' : 'IDENTITY SETTINGS'}
                    </button>
                    {!showSettings && (
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut()
                                window.location.href = '/login'
                            }}
                            className="btn btn-outline"
                            style={{ fontSize: '0.7rem', padding: '0.5rem 1.5rem', marginLeft: '1rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        >
                            LOGOUT
                        </button>
                    )}
                </div>

                {showSettings ? (
                    <div className="card" style={{ marginTop: '2rem', textAlign: 'left', border: '1px solid var(--border)' }}>
                        <form onSubmit={handleUpdateSettings}>
                            <div className="form-group">
                                <label className="form-label">Change Username</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value.trim())}
                                    required
                                    style={{ borderColor: usernameError ? 'var(--primary)' : '' }}
                                />
                                {checkingUsername && <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Security Check...</p>}
                                {usernameError && <p style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>{usernameError.toUpperCase()}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Update Phone Number</label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Update Email Address</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>*Email updates require verification login</p>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                disabled={isSaving || checkingUsername || !!usernameError}
                            >
                                {isSaving ? 'SECURING...' : 'SAVE SETTINGS'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="profile-info-grid">
                        <div className="info-item">
                            <label>Verified Email</label>
                            <p>{user.email}</p>
                        </div>
                        <div className="info-item">
                            <label>Phone Identity</label>
                            <p>{profile?.phone_number || 'NOT SET'}</p>
                        </div>
                        <div className="info-item">
                            <label>User ID</label>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.id}</p>
                        </div>
                        <div className="info-item">
                            <label>Account Status</label>
                            <p style={{ color: 'var(--primary)', fontWeight: 800 }}>ACTIVE / SECURE</p>
                        </div>
                    </div>
                )}
            </div>

            <h2 className="feed-title" style={{ fontSize: '1rem', marginBottom: '2rem' }}>DATA FOOTPRINT</h2>
            <p style={{ color: 'var(--text-muted)' }}>All your shared media and interactions are encrypted and stored in the Helloall network.</p>
        </div>
    )
}

export default Profile
