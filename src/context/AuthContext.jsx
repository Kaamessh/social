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

                // Add a specific timeout for the session fetch itself
                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('NETWORK TIMEOUT: Secure channel negotiation failed.')), 6000)
                )

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])

                setUser(session?.user ?? null)
                setStatus('CONNECTION ESTABLISHED')
            } catch (err) {
                console.error('Error getting session:', err)
                setInitError(err.message + ' (Check Vercel Env Vars)')
                // If negotiation fails, we must stop loading to show the error
                setLoading(false)
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

    // Immediate check for missing Supabase to prevent blank screen
    const mask = (str) => str ? str.slice(0, 12) + '...' + str.slice(-4) : 'MISSING';

    if (!supabase) {

        const urlParam = import.meta.env.VITE_SUPABASE_URL;
        const keyParam = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const isUrlMissing = !urlParam || urlParam.includes('your_');
        const isKeyMissing = !keyParam || keyParam.includes('your_');
        const isUrlMalformed = urlParam && !urlParam.startsWith('http');

        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
                <div className="card" style={{ border: '4px solid var(--danger)', padding: '3rem' }}>
                    <h1 style={{ color: 'var(--danger)', fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>CONFIGURATION REQUIRED</h1>
                    <div style={{ background: '#fffafa', padding: '1.5rem', border: '1px solid var(--danger)', textAlign: 'left' }}>
                        <p style={{ fontWeight: 800, color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ DEPLOYMENT ERROR: Supabase Keys Not Detected</p>

                        <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: '#666' }}>
                            {isUrlMissing && <p>❌ <strong>VITE_SUPABASE_URL</strong> is missing or is still a placeholder.</p>}
                            {!isUrlMissing && <p>✅ <strong>URL DETECTED:</strong> <code>{mask(urlParam)}</code></p>}
                            {isKeyMissing && <p>❌ <strong>VITE_SUPABASE_ANON_KEY</strong> is missing.</p>}
                            {!isKeyMissing && <p>✅ <strong>KEY DETECTED:</strong> <code>{mask(keyParam)}</code></p>}
                            {isUrlMalformed && <p>❌ <strong>VITE_SUPABASE_URL</strong> is malformed (must start with <code>https://</code>).</p>}
                        </div>


                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                            Your application is unable to connect to the backend. If you are on <strong>Vercel</strong>, please ensure:
                        </p>
                        <ul style={{ fontSize: '0.85rem', marginTop: '1rem', lineHeight: '2' }}>
                            <li>Add <code>VITE_SUPABASE_URL</code> to Environment Variables</li>
                            <li>Add <code>VITE_SUPABASE_ANON_KEY</code> to Environment Variables</li>
                            <li><strong>CRITICAL:</strong> Variables MUST start with the <code>VITE_</code> prefix</li>
                        </ul>
                        <p style={{ fontSize: '0.8rem', marginTop: '1.5rem', opacity: 0.7 }}>Redeploy the application after adding these variables in the Vercel Dashboard.</p>
                    </div>
                </div>
                <div style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.5 }}>HELLOALL SECURE ARCHITECTURE</div>
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
