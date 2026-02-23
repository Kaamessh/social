import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommentSection from './CommentSection'


const PostCard = ({ post, user, onDeleteSuccess }) => {
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

    const handleDelete = async () => {
        if (!window.confirm('ARE YOU SURE YOU WANT TO DELETE THIS STORY?')) return

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id)

            if (error) throw error

            if (onDeleteSuccess) {
                onDeleteSuccess(post.id)
            } else {
                window.location.reload()
            }
        } catch (err) {
            alert('DELETE FAIL: ' + err.message)
        }
    }

    return (
        <div className="post-card">
            <div className="post-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to={`/profile/${post.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border)', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                        {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4px', fontSize: '0.8rem' }}>👤</div>
                        )}
                    </div>
                    <span className="username-tag">
                        {post.profiles?.username || post.user_id.substring(0, 8)}
                    </span>
                </Link>

                {user?.id === post.user_id && (
                    <button
                        onClick={handleDelete}
                        style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.6rem', padding: '4px 8px', cursor: 'pointer', fontWeight: 800 }}
                    >
                        DELETE
                    </button>
                )}
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
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    {isLiked ? '❤️' : '🤍'} <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{likes.length}</span>
                </button>
                <button
                    className="btn-action"
                    onClick={() => setShowComments(!showComments)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}
                >
                    💬 COMMENTS
                </button>
            </div>

            <div className="post-content" style={{ padding: '0 1.5rem 1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 800, marginRight: '8px' }}>{post.profiles?.username || 'USER'}</span>
                    {post.caption}
                </p>
                <p className="post-date" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                </p>
            </div>

            {showComments && <CommentSection postId={post.id} user={user} />}
        </div>
    )
}

export default PostCard
