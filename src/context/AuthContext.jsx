import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('INITIALIZING SECURE CHANNEL...')
    const [initError, setInitError] = useState(null)


    useEffect(() => {
        if (!supabase) {
            setLoading(false)
            return
        }

        const getSession = async () => {
            try {
                setStatus('NEGOTIATING SESSION...')
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
                setStatus('CONNECTION ESTABLISHED')
            } catch (err) {
                console.error('Error getting session:', err)
                setInitError(err.message)
            } finally {
                setLoading(false)
            }
        }

        getSession()

        // Safety timeout to prevent permanent white screen
        const loadingTimeout = setTimeout(() => {
            if (loading) {
                setStatus('TIMEOUT: PROCEEDING WITH CAUTION...')
                setLoading(false)
            }
        }, 8000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)
                setStatus('AUTH STATE UPDATED')
                clearTimeout(loadingTimeout)
            }
        )

        return () => {
            subscription.unsubscribe()
            clearTimeout(loadingTimeout)
        }
    }, [])



    const signUp = (email, password, metadata) => supabase?.auth.signUp({
        email,
        password,
        options: {
            data: metadata
        }
    })

    const signIn = (email, password) => supabase?.auth.signInWithPassword({ email, password })
    const signOut = () => supabase?.auth.signOut()


    const value = {
        signUp,
        signIn,
        signOut,
        user,
    }

    if (!supabase) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
                <div className="card">
                    <h1 style={{ color: 'var(--danger)' }}>Configuration Required</h1>
                    <p>It looks like your Supabase keys are missing in the <code>.env</code> file.</p>
                    <p>Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables and restart the server.</p>
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginTop: '1rem' }}>
                        <code>
                            VITE_SUPABASE_URL=your_url<br />
                            VITE_SUPABASE_ANON_KEY=your_key
                        </code>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 900, letterSpacing: '2px', fontSize: '0.8rem' }}>
                        {status}
                    </div>
                    {initError && <div style={{ color: 'var(--danger)', marginTop: '1rem' }}>ERROR: {initError}</div>}
                    <div style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.5 }}>HELLOALL SECURE ARCHITECTURE</div>
                </div>
            ) : children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext)
