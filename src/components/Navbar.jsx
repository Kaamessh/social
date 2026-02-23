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
                    <span style={{ color: 'var(--text)', fontWeight: 900, letterSpacing: '2px', fontSize: '1.2rem' }}>HELLOALL</span>
                </Link>


                <div className="nav-links">
                    {user ? (
                        <>
                            <Link to="/" className="nav-link">FEED</Link>
                            <Link to="/photos" className="nav-link">PHOTOS</Link>
                            <Link to="/videos" className="nav-link">VIDEOS</Link>
                            <Link to="/create" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>+ POST</Link>

                            <Link to="/messages" className="nav-link" title="INBOX" style={{ display: 'flex', alignItems: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    <path d="M10 8l-4 4 4 4" style={{ opacity: 0.5 }} />
                                </svg>
                            </Link>

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
