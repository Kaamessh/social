import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (!signIn) {
                throw new Error('SYSTEM ERROR: Secure channel uninitialized. Check Vercel Env Vars.')
            }
            const { error } = await signIn(email, password)
            if (error) throw error
            navigate('/')
        } catch (err) {
            console.error('Login Failure Detail:', err)
            setError(`CONNECTION FAILED: ${err.message}. If you see "Failed to fetch", go to Supabase -> URL Configuration and add your Vercel URL.`)
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="container">
            <h1 className="category-title">Welcome Back</h1>
            <div className="card">

                {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Signup</Link>
                </div>
            </div>
        </div>
    )
}

export default Login
