import { useState } from 'react';
import supabase from '../services/supabaseClient';

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage('Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Wrong email or password');
      } else if (err.message.includes('User already registered')) {
        setError('This email is already registered');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Focus Pet</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Welcome back!' : 'Create your account'}
        </p>

        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
          >
            Log In
          </button>
          <button
            className={`auth-toggle-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
          >
            Sign Up
          </button>
        </div>

        <label className="auth-label">Email</label>
        <input
          type="email"
          className="input-field"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        <label className="auth-label">Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />

        {error && <div className="auth-error">{error}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        <button
          className="button auth-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '...' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;