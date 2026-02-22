import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'

const Feed = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
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

            if (error) throw error
            setPosts(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)

            if (error) throw error
            setPosts(posts.filter(post => post.id !== postId))
        } catch (err) {
            alert('Error deleting post: ' + err.message)
        }
    }

    if (loading) return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Fetching the latest stories...</p>
        </div>
    )

    if (error) return <div className="container">Error: {error}</div>

    return (
        <div className="container">
            <h1 className="category-title">Feed</h1>

            {posts.length === 0 ? (
                <p>No posts yet. Why not create one?</p>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onDelete={handleDelete}
                        currentUserId={user?.id}
                    />
                ))
            )}
        </div>
    )
}

export default Feed
