import { useNavigate } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { Link } from 'react-router-dom'


const Feed = ({ type = 'all' }) => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const { user } = useAuth()
    const navigate = useNavigate()


    useEffect(() => {
        fetchPosts()
    }, [type])

    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.length < 1) {
                setSuggestions([])
                return
            }
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .ilike('username', `${searchQuery}%`)
                .limit(5)

            if (data) setSuggestions(data)
        }

        const timer = setTimeout(searchUsers, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])


    const fetchPosts = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('posts')
                .select('*, profiles:user_id(username, avatar_url)')
                .order('created_at', { ascending: false })

            // Hide the current user's own posts from the main discovery feed
            if (user) {
                query = query.neq('user_id', user.id)
            }

            if (type === 'photos') query = query.eq('media_type', 'image')
            if (type === 'videos') query = query.eq('media_type', 'video')


            const { data, error } = await query

            if (error) {
                console.error(error)
                alert('Database Error: ' + error.message)
                return
            }

            if (data) setPosts(data)

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div className="feed-header" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="feed-title">{type.toUpperCase()}</h1>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH FOR USERS..."
                        style={{
                            padding: '0.8rem 1rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            letterSpacing: '1px'
                        }}
                    />

                    {suggestions.length > 0 && (
                        <div className="search-dropdown">
                            {suggestions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => navigate(`/profile/${s.id}`)}
                                    className="search-item"
                                >
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--border)', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                                        {s.avatar_url ? (
                                            <img src={s.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '5px', fontSize: '0.8rem' }}>👤</div>
                                        )}
                                    </div>
                                    <span style={{ fontWeight: 800 }}>{s.username.toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {loading ? (
                <p>ACCESSING CRYPTOGRAPHIC FEED...</p>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                    />
                ))
            )}

            {!loading && posts.length === 0 && (
                <div style={{ padding: '4rem 0', textAlign: 'center', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>NO DATA FOUND IN THIS SECTION</p>
                </div>
            )}
        </div>
    )
}

export default Feed
