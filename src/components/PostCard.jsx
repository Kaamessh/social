import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CommentSection from './CommentSection'

const PostCard = ({ post, user }) => {
    const [likes, setLikes] = useState([])
    const [isLiked, setIsLiked] = useState(false)
    const [showComments, setShowComments] = useState(false)

    useEffect(() => {
        fetchLikes()
    }, [post.id])

    const fetchLikes = async () => {
        const { data, error } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id)

        if (data) {
            setLikes(data)
            setIsLiked(data.some(like => like.user_id === user?.id))
        }
    }

    const toggleLike = async () => {
        if (!user) return alert('Please login to like')

        if (isLiked) {
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', post.id)
                .eq('user_id', user.id)

            if (!error) {
                setLikes(likes.filter(l => l.user_id !== user.id))
                setIsLiked(false)
            }
        } else {
            const { error } = await supabase
                .from('likes')
                .insert([{ post_id: post.id, user_id: user.id }])

            if (!error) {
                setLikes([...likes, { user_id: user.id }])
                setIsLiked(true)
            }
        }
    }

    return (
        <div className="post-card">
            <div className="post-header">
                <span className="post-user">
                    {post.profiles?.username || post.user_id.substring(0, 8)}
                </span>
            </div>


            <div className="post-media">
                {post.media_type === 'video' ? (
                    <video controls className="post-video" src={post.image_url} />
                ) : (
                    <img className="post-image" src={post.image_url} alt="Post content" />
                )}
            </div>

            <div className="post-actions">
                <button
                    className={`btn-action like-btn ${isLiked ? 'active' : ''}`}
                    onClick={toggleLike}
                >
                    {isLiked ? '❤️' : '🤍'} {likes.length}
                </button>
                <button className="btn-action" onClick={() => setShowComments(!showComments)}>
                    💬 Comment
                </button>
            </div>

            <div className="post-content">
                <p><strong>{post.user_id.substring(0, 8)}</strong> {post.caption}</p>
                <p className="post-date">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>

            {showComments && <CommentSection postId={post.id} user={user} />}
        </div>
    )
}

export default PostCard
