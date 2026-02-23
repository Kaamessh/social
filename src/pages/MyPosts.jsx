import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

const MyPosts = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        if (user) fetchMyPosts()
    }, [user])

    const fetchMyPosts = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles:user_id(username, avatar_url)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setPosts(data)
        } catch (err) {
            console.error(err)
            alert('Error fetching your posts: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteSuccess = (postId) => {
        setPosts(posts.filter(p => p.id !== postId))
    }

    return (
        <div className="container">
            <div className="feed-header">
                <h1 className="feed-title">MY POSTS</h1>
            </div>

            {loading ? (
                <p>ACCESSING YOUR SECURE DATA...</p>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                        onDeleteSuccess={handleDeleteSuccess}
                    />
                ))
            )}

            {!loading && posts.length === 0 && (
                <div style={{ padding: '4rem 0', textAlign: 'center', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>YOU HAVEN'T SHARED ANY STORIES YET</p>
                </div>
            )}
        </div>
    )
}

export default MyPosts
