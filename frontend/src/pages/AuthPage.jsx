import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f0f17'
    }}>
      <div style={{
        background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 40, width: 380
      }}>
        <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 24 }}>
          {isLogin ? '👋 Welcome Back' : '🚀 Create Account'}
        </h2>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
          {isLogin ? 'ClipAI mein login karo' : 'Free mein shuru karo — no credit card'}
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            display: 'block', width: '100%', marginBottom: 12, padding: '12px 16px',
            background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            display: 'block', width: '100%', marginBottom: 16, padding: '12px 16px',
            background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#fff', fontSize: 14, boxSizing: 'border-box'
          }}
        />

        {error && (
          <p style={{ color: '#f43f5e', marginBottom: 12, fontSize: 13 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', background: '#f43f5e',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer'
          }}
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          style={{ color: '#888', textAlign: 'center', marginTop: 16,
            fontSize: 13, cursor: 'pointer' }}
        >
          {isLogin ? "Account nahi hai? " : "Already account hai? "}
          <span style={{ color: '#f43f5e' }}>{isLogin ? 'Sign Up' : 'Login'}</span>
        </p>
      </div>
    </div>
  )
}
