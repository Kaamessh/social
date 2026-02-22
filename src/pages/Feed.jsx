import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

const Feed = ({ type = 'all' }) => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        fetchPosts()
    }, [type])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('posts')
                .select('*, profiles:user_id(username)')
                .order('created_at', { ascending: false })

            if (type === 'photos') query = query.eq('media_type', 'image')
            if (type === 'videos') query = query.eq('media_type', 'video')

            const { data, error } = await query

            if (data) setPosts(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div className="feed-header">
                <h1 className="feed-title">{type.toUpperCase()}</h1>
            </div>

            {loading ? (
                <p>ACCESSING CRYPTOGRAPHIC FEED...</p>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                    />
                ))
            )}

            {!loading && posts.length === 0 && (
                <div style={{ padding: '4rem 0', textAlign: 'center', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>NO DATA FOUND IN THIS SECTION</p>
                </div>
            )}
        </div>
    )
}

export default Feed
