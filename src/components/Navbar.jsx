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
                <Link to="/" className="nav-logo">Supagram</Link>
                <div className="nav-links">
                    {user ? (
                        <>
                            <Link to="/" className="nav-link">Feed</Link>
                            <Link to="/create" className="nav-link">Create Post</Link>
                            <button onClick={handleLogout} className="btn-logout">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/signup" className="nav-link">Signup</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
