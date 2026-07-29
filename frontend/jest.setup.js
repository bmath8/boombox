import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.NEXT_PUBLIC_WS_URL = 'wss://example.com'
process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID = 'test-spotify-client-id'
process.env.SPOTIFY_CLIENT_SECRET = 'test-spotify-client-secret'
process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI = 'http://localhost:3000/api/auth/callback/spotify'
process.env.NODE_ENV = 'test'
