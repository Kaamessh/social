import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CommentSection = ({ postId, user }) => {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchComments()
    }, [postId])

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id (username)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (data) setComments(data)
    }

    const handleAddComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return
        setLoading(true)

        try {
            const { error } = await supabase
                .from('comments')
                .insert([
                    {
                        post_id: postId,
                        user_id: user.id,
                        user_email: user.email,
                        content: newComment
                    }
                ])
            if (error) throw error
            setNewComment('')
            fetchComments()
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="comment-section">
            <div className="comment-list">
                {comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                        <p>
                            <strong>{comment.profiles?.username || comment.user_email.split('@')[0]}</strong> {comment.content}
                        </p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddComment} className="comment-form">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={loading}>Post</button>
            </form>
        </div>
    )
}

export default CommentSection
