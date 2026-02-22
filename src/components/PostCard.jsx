import React from 'react'

const PostCard = ({ post, onDelete, currentUserId }) => {
    const isOwner = currentUserId === post.user_id

    return (
        <div className="post-card">
            {post.image_url && (
                <div className="post-image-container">
                    <img src={post.image_url} alt="Post" className="post-image" />
                </div>
            )}
            <div className="post-content">
                <p className="post-caption">{post.caption}</p>
                <div className="post-footer">
                    <span className="post-date">
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {isOwner && (
                        <button
                            onClick={() => onDelete(post.id)}
                            className="btn-delete"
                            aria-label="Delete post"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PostCard
