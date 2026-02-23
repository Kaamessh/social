import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const Chat = () => {
    const { receiverId } = useParams()
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [otherUser, setOtherUser] = useState(null)
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef()

    useEffect(() => {
        if (user && receiverId) {
            fetchOtherUser()
            fetchMessages()
            markAsRead()

            // Real-time subscription for new messages
            const channel = supabase.channel(`chat_${receiverId}`)

            channel
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                }, (payload) => {
                    // Only add if it's from the person we are currently chatting with
                    if (payload.new.sender_id === receiverId) {
                        setMessages(prev => {
                            // Prevent duplicate entries
                            if (prev.find(m => m.id === payload.new.id)) return prev
                            return [...prev, payload.new]
                        })
                        markAsRead()
                    }
                })
                .subscribe((status) => {
                    console.log('REALTIME STATUS:', status)
                })

            return () => {
                supabase.removeChannel(channel)
            }

        }
    }, [user, receiverId])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchOtherUser = async () => {
        const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', receiverId).single()
        if (data) setOtherUser(data)
    }

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })
        if (data) setMessages(data)
        setLoading(false)
    }

    const markAsRead = async () => {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', receiverId)
            .eq('receiver_id', user.id)
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const messageData = {
            sender_id: user.id,
            receiver_id: receiverId,
            content: newMessage.trim()
        }

        const { data, error } = await supabase.from('messages').insert([messageData]).select()
        if (error) {
            alert('SEND FAIL: ' + error.message)
        } else {
            setMessages([...messages, data[0]])
            setNewMessage('')
        }
    }

    if (loading) return <div className="container">ENCRYPTING CONNECTION...</div>

    return (
        <div className="container" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--border)', border: '1px solid var(--primary)' }}>
                    {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '8px' }}>👤</div>
                    )}
                </div>
                <div>
                    <h1 className="feed-title" style={{ fontSize: '1rem', margin: 0 }}>{otherUser?.username.toUpperCase()}</h1>
                    <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>SECURE LINE ACTIVE</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                            maxWidth: '70%',
                            background: msg.sender_id === user.id ? 'var(--primary)' : 'var(--surface)',
                            color: msg.sender_id === user.id ? 'white' : 'var(--text)',
                            padding: '0.8rem 1.2rem',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem'
                        }}
                    >
                        {msg.content}
                        <div style={{ fontSize: '0.5rem', marginTop: '5px', opacity: 0.6, textAlign: 'right' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} style={{ padding: '2rem 0', display: 'flex', gap: '1rem' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="TYPE SECURE MESSAGE..."
                    style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '1rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>SEND</button>
            </form>
        </div>
    )
}

export default Chat
