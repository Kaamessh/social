import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

const Feed = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setPosts(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <p>Loading Feed...</p>
        </div>
    )

    return (
        <div className="container">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                />
            ))}
            {posts.length === 0 && <p style={{ textAlign: 'center' }}>No posts yet.</p>}
        </div>
    )
}

export default Feed
