import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CreatePost = () => {
    const [caption, setCaption] = useState('')
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!file) return alert('Please select an image or video')
        setLoading(true)

        try {
            const fileExt = file.name.split('.').pop().toLowerCase()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Determine media type
            const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExt)
            const media_type = isVideo ? 'video' : 'image'

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath)

            // Insert post
            const { error: insertError } = await supabase
                .from('posts')
                .insert([
                    {
                        user_id: user.id,
                        caption,
                        image_url: publicUrl,
                        media_type
                    }
                ])

            if (insertError) throw insertError

            navigate('/')
        } catch (err) {
            alert('Error creating post: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <h1 className="category-title">New Story</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Media (Image or Video)</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows="3"
                            placeholder="Write a caption..."
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Sharing...' : 'Share Post'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreatePost
