import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const [profile, setProfile] = useState(null)
    const [unreadCount, setUnreadCount] = useState(0)
    const navigate = useNavigate()


    useEffect(() => {
        if (user) {
            fetchProfile()
            fetchUnreadCount()

            // Real-time unread listener
            const channel = supabase
                .channel('navbar_notifications')
                .on('postgres_changes', {
                    event: '*', // Listen for inserts (new messages) and updates (marking as read)
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                }, () => {
                    fetchUnreadCount()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        } else {
            setProfile(null)
            setUnreadCount(0)
        }
    }, [user])


    const fetchProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
        if (data) setProfile(data)
    }

    const fetchUnreadCount = async () => {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false)

        if (!error) setUnreadCount(count || 0)
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

                            <Link to="/messages" className="nav-link" title="INBOX" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    <path d="M8 9a2 2 0 0 0 2 2h8l4 4V7a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2z"></path>
                                </svg>
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        fontWeight: 900,
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        border: '2px solid var(--bg)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                        {(unreadCount || 0) > 9 ? '9+' : (unreadCount || 0)}
                                    </span>
                                )}
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
