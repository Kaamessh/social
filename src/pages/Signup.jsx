import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [phone, setPhone] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            // Pass username and phone as user metadata
            const { error } = await signUp(email, password, { username, phone })
            if (error) throw error
            navigate('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ maxWidth: '400px' }}>
            <div className="card">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>CREATE ACCOUNT</h1>
                {error && <p style={{ color: 'var(--primary)', fontWeight: 700 }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username (Unique)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="CHOOSE USERNAME"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            placeholder="YOUR PHONE"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'SECURING...' : 'REGISTER'}
                    </button>
                </form>
                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem' }}>
                    ALREADY REGISTERED? <Link to="/login" style={{ color: 'var(--primary)' }}>LOGIN</Link>
                </p>
            </div>
        </div>
    )
}

export default Signup
