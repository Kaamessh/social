import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!supabase) {
            setLoading(false)
            return
        }

        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
            } catch (err) {
                console.error('Error getting session:', err)
            } finally {
                setLoading(false)
            }
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])


    const signUp = (email, password) => supabase?.auth.signUp({ email, password })
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
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
