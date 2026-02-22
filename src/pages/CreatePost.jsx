import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CreatePost = () => {
    const [caption, setCaption] = useState('')
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let image_url = null

            if (image) {
                // Upload image to storage
                const fileExt = image.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(filePath, image)

                if (uploadError) throw uploadError

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('posts')
                    .getPublicUrl(filePath)

                image_url = publicUrl
            }

            // Insert post into table
            const { error: insertError } = await supabase
                .from('posts')
                .insert([
                    { user_id: user.id, caption, image_url }
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
            <h1 className="category-title">Share a Story</h1>
            <div className="card">

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows="4"
                            placeholder="What's on your mind?"
                        />
                    </div>
                    <div className="form-group">
                        <label>Image (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Post'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreatePost
