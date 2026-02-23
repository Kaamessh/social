import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const [profile, setProfile] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) fetchProfile()
        else setProfile(null)
    }, [user])

    const fetchProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
        if (data) setProfile(data)
    }

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <img src="/favicon.svg" alt="Logo" />
                    HELLOALL
                </Link>

                <div className="nav-links">
                    {user ? (
                        <>
                            <Link to="/" className="nav-link">FEED</Link>
                            <Link to="/photos" className="nav-link">PHOTOS</Link>
                            <Link to="/videos" className="nav-link">VIDEOS</Link>
                            <Link to="/my-posts" className="nav-link" style={{ color: 'var(--primary)' }}>MY POSTS</Link>
                            <Link to="/create" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>+ POST</Link>

                            <Link to="/profile" className="profile-icon" title="SECURE PROFILE">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    '👤'
                                )}
                            </Link>
                        </>
                    ) : (

                        <>
                            <Link to="/login" className="nav-link">LOGIN</Link>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>JOIN</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
