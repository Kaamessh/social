import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

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

            if (data) setProfile(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
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

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('posts') // Using existing 'posts' bucket for simplicity, or create 'avatars'
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath)

            // Update profile
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
            </div>

            <h2 className="feed-title" style={{ fontSize: '1rem', marginBottom: '2rem' }}>DATA FOOTPRINT</h2>
            <p style={{ color: 'var(--text-muted)' }}>All your shared media and interactions are encrypted and stored in the LockWide network.</p>
        </div>
    )
}

export default Profile
