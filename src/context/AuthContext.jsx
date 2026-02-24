import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('INITIALIZING SECURE CHANNEL...')
    const [initError, setInitError] = useState(null)
    const [showDebug, setShowDebug] = useState(false)
    const [probeResult, setProbeResult] = useState('PENDING')



    useEffect(() => {
        if (!supabase) {
            setLoading(false)
            return
        }

        const getSession = async () => {
            try {
                setStatus('NEGOTIATING SESSION...')

                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('NETWORK TIMEOUT: Secure channel negotiation failed after 12s.')), 12000)
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
        }, 15000)


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

    useEffect(() => {
        if (initError && supabase) {
            const probe = async () => {
                setProbeResult('PROBING...')
                try {
                    const sanitizedUrl = import.meta.env.VITE_SUPABASE_URL.trim().replace(/\/$/, '')

                    // Add a timeout to the probe itself
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    await fetch(sanitizedUrl, { method: 'GET', mode: 'no-cors', signal: controller.signal })
                    clearTimeout(timeoutId);
                    setProbeResult('REACHABLE (200-ish)')
                } catch (e) {
                    setProbeResult('UNREACHABLE: ' + (e.name === 'AbortError' ? 'Probe Timeout (Server Not Responding)' : e.message))
                }

            }
            probe()
        }
    }, [initError])




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
    const urlParam = import.meta.env.VITE_SUPABASE_URL;
    const keyParam = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const mask = (str) => str ? str.slice(0, 12) + '...' + str.slice(-4) : 'MISSING';

    // Immediate check for missing Supabase to prevent blank screen
    if (!supabase) {
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
            {initError ? (
                <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
                    <div className="card" style={{ border: '4px solid var(--danger)', padding: '3rem' }}>
                        <h1 style={{ color: 'var(--danger)', fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>CONNECTIVITY FAILURE</h1>
                        <div style={{ background: '#fffafa', padding: '1.5rem', border: '1px solid var(--danger)', textAlign: 'left' }}>
                            <p style={{ fontWeight: 800, color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ SERVER SIDE FAILURE: {initError.includes('LockManager') ? 'Database Gateway Stalled' : initError}</p>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Your project URL is active in the dashboard but <strong>refusing all connections</strong>. This is common when a project is stuck in "Waking Up" mode.
                            </p>
                            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--danger)' }}>🚨 CRITICAL FIX STEPS:</p>
                                <ol style={{ fontSize: '0.8rem', marginTop: '0.5rem', paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                                    <li><strong>Supabase Dashboard:</strong> Click <strong>"Pause Project"</strong> then <strong>"Restore"</strong> to restart the server.</li>
                                    <li><strong>Fallback:</strong> Use your other project <strong>"Kaamesh"</strong> if this one stays unreachable.</li>
                                    <li><strong>Check DNS:</strong> Ensure you don't have a VPN or Firewall blocking <code>supabase.co</code>.</li>
                                </ol>
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                                style={{ marginTop: '2rem', width: '100%' }}
                            >
                                RETRY CONNECTION
                            </button>

                            <div style={{ marginTop: '2rem', borderTop: '1px dashed #ccc', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>REACHABILITY PROBE:</span>
                                    <span style={{ fontSize: '0.75rem', color: probeResult.includes('REACHABLE') ? 'green' : 'var(--danger)', fontWeight: 900 }}>{probeResult}</span>
                                </div>

                                <button
                                    onClick={() => setShowDebug(!showDebug)}
                                    style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '1rem', padding: 0 }}
                                >
                                    {showDebug ? 'HIDE' : 'SHOW'} FULL DEBUG INFO (USE CAUTION)
                                </button>

                                {showDebug && (
                                    <div style={{ background: '#f8f8f8', padding: '1rem', marginTop: '1rem', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'left', wordBreak: 'break-all', fontSize: '0.7rem' }}>
                                        <p style={{ marginBottom: '0.5rem' }}><strong>FULL URL:</strong> <code>{urlParam}</code></p>
                                        <p style={{ marginBottom: '0.5rem' }}><strong>FULL KEY:</strong> <code>{keyParam}</code></p>
                                        <p style={{ marginTop: '1rem', fontWeight: 800, color: 'var(--danger)' }}>💡 HINT: Compare these EXACT strings with your Supabase Settings → API Dashboard.</p>

                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.5 }}>HELLOALL SECURE ARCHITECTURE - STABILITY_LAYER_V4 - DETECTED URL: {mask(urlParam)}</div>

                </div>

            ) : loading ? (
                <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 900, letterSpacing: '2px', fontSize: '0.8rem' }}>
                        {status}
                    </div>
                    <div style={{ marginTop: '2rem', fontSize: '0.6rem', opacity: 0.5 }}>HELLOALL SECURE ARCHITECTURE</div>
                </div>
            ) : children}
        </AuthContext.Provider>
    )


}

export const useAuth = () => useContext(AuthContext)
