import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

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

    if (loading) return <div className="container">LOADING SECURE DATA...</div>

    return (
        <div className="container">
            <div className="profile-hero">
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
                        <p style={{ color: 'var(--primary)' }}>ACTIVE / SECURE</p>
                    </div>
                </div>
            </div>

            <h2 className="feed-title" style={{ fontSize: '1rem', marginBottom: '2rem' }}>YOUR ACTIVITY</h2>
            {/* User's posts could go here */}
            <p style={{ color: 'var(--text-muted)' }}>All your shared media will appear here.</p>
        </div>
    )
}

export default Profile
