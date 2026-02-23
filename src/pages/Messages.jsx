import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const Messages = () => {
    const { user } = useAuth()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchConversations()

            // Real-time inbox listener
            const channel = supabase
                .channel('global_inbox')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                }, () => {
                    fetchConversations() // Refresh list on new message
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])


    const fetchConversations = async () => {
        try {
            setLoading(true)
            // Fetch all messages where user is sender or receiver
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(username, avatar_url),
                    receiver:receiver_id(username, avatar_url)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Group by the "other" user
            const groups = {}
            data.forEach(msg => {
                const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
                const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id

                if (!groups[otherUserId]) {
                    groups[otherUserId] = {
                        user: otherUser,
                        lastMessage: msg,
                        unreadCount: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0
                    }
                } else if (!msg.is_read && msg.receiver_id === user.id) {
                    groups[otherUserId].unreadCount++
                }
            })

            setConversations(Object.values(groups))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="container">SYNCING COMMUNICATIONS...</div>

    return (
        <div className="container">
            <div className="feed-header">
                <h1 className="feed-title">SECURE INBOX</h1>
            </div>

            <div style={{ marginTop: '2rem' }}>
                {conversations.length > 0 ? (
                    conversations.map(conv => (
                        <Link
                            to={`/profile/${conv.lastMessage.sender_id === user.id ? conv.lastMessage.receiver_id : conv.lastMessage.sender_id}?view=messaging`}
                            key={conv.lastMessage.id}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="card" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1rem',
                                border: conv.unreadCount > 0 ? '1px solid var(--primary)' : '1px solid var(--border)',
                                padding: '1.5rem'
                            }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '0', background: 'var(--border)', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                                    {conv.user?.avatar_url ? (
                                        <img src={conv.user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '10px', fontSize: '1.2rem' }}>👤</div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                                            {conv.user?.username ? conv.user.username.toUpperCase() : `USER_${conv.userId.substring(0, 5).toUpperCase()}`}
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(conv.lastMessage.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.8rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv.lastMessage.content}
                                    </p>
                                </div>

                                {conv.unreadCount > 0 && (
                                    <div style={{ background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '2px 8px', fontWeight: 900 }}>
                                        NEW
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '5rem 0', opacity: 0.5 }}>
                        <p>NO ACTIVE SECURE CHANNELS</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Messages
