import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const Chat = () => {
    const { receiverId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (receiverId) {
            // Redirect to the new integrated profile chat flow
            navigate(`/profile/${receiverId}?view=messaging`, { replace: true })
        }
    }, [receiverId, navigate])

    return <div className="container">REDIRECTING TO SECURE PROFILE CHAT...</div>
}

export default Chat
