import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">LOCKWIDE</Link>

                <div className="nav-links">
                    {user ? (
                        <>
                            <Link to="/" className="nav-link">ALL</Link>
                            <Link to="/photos" className="nav-link">PHOTOS</Link>
                            <Link to="/videos" className="nav-link">VIDEOS</Link>
                            <Link to="/create" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>+ POST</Link>
                            <Link to="/profile" className="profile-icon" title="USER PROFILE">
                                👤
                            </Link>
                            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>EXIT</button>
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
