import { useState } from 'react';
import supabase from '../services/supabaseClient';

function AuthModal() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.js onAuthStateChange will handle the rest
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <div className="modal" style={{ position: 'static', width: '100%', maxWidth: '360px' }}>
        <h2 className="modal-header">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>

        <label className="input-label">Email</label>
        <input
          type="email"
          className="input-field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        <label className="input-label">Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />

        {error && (
          <div className="validation-error" style={{ marginBottom: '8px' }}>
            {error}
          </div>
        )}
        {message && (
          <div
            style={{ color: 'green', fontSize: '14px', marginBottom: '8px', textAlign: 'center' }}
          >
            {message}
          </div>
        )}

        <button
          className="button save-button"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: '8px' }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>

        <button
          className="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setMessage('');
          }}
          style={{
            marginTop: '8px',
            background: 'transparent',
            color: 'var(--color-text, #333)',
            textDecoration: 'underline',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
