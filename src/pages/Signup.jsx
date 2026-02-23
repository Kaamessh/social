import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Signup = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [phone, setPhone] = useState('')
    const [error, setError] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    // Real-time username check
    useEffect(() => {
        const checkAvailability = async () => {
            if (username.length < 3) {
                setUsernameError('')
                return
            }

            setCheckingUsername(true)
            setUsernameError('')

            try {
                // Case-insensitive check using lower()
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username')
                    .ilike('username', username)
                    .single()

                if (data) {
                    setUsernameError('username was not available')
                }
            } catch (err) {
                // single() throws error if no rows found, which means it IS available
            } finally {
                setCheckingUsername(false)
            }
        }

        const timeoutId = setTimeout(checkAvailability, 500)
        return () => clearTimeout(timeoutId)
    }, [username])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (usernameError) return

        setError('')
        setLoading(true)
        try {
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
                {error && <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username (Unique)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.trim())}
                            required
                            placeholder="CHOOSE USERNAME"
                            style={{ borderColor: usernameError ? 'var(--primary)' : '' }}
                        />
                        {checkingUsername && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Checking security credentials...</p>}
                        {usernameError && <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, marginTop: '4px' }}>{usernameError.toUpperCase()}</p>}
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

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading || checkingUsername || !!usernameError}
                    >
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
