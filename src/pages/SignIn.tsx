import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const SignIn = () => {
  const { loginWithGoogle, loginWithPassword, user, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/profile');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await loginWithPassword(email, password);
        navigate('/profile');
      } else {
        // Supabase sign up
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="max-w-md w-full p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
        <div className="text-gray-600 mb-6 text-center">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button className="text-blue-600 font-semibold hover:underline" onClick={() => setMode('signup')}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="text-blue-600 font-semibold hover:underline" onClick={() => setMode('signin')}>Sign in</button>
            </>
          )}
        </div>
        <div className="flex gap-3 w-full mb-4">
          <button
            onClick={loginWithGoogle}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
            disabled={loading || submitting}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.8v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.6-5.6-5.7s2.5-5.7 5.6-5.7c1.8 0 3 .7 3.7 1.4l2.5-2.4C17.1 4.6 14.8 3.5 12 3.5 6.8 3.5 2.5 7.8 2.5 13s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>
            Login with Google
          </button>
          <button
            onClick={() => alert('GitHub login not implemented')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
            disabled={loading || submitting}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#333" d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.1 6.8 9.4.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2.2-.2-4.5-1.1-4.5-4.8 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.7 1 .8-.2 1.7-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.7 0 3.7-2.3 4.6-4.5 4.8.3.3.6.8.6 1.7v2.5c0 .3.2.6.7.5C19.1 20.1 22 16.4 22 12c0-5.5-4.5-10-10-10z"/></svg>
            Login with GitHub
          </button>
        </div>
        <div className="flex items-center w-full mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-2 text-gray-400 text-xs">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          <button
            type="submit"
            className="w-full mt-2 py-2 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-base shadow-sm"
            disabled={loading || submitting}
          >
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <div className="w-full flex flex-row justify-between mt-4 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-900 font-medium">Go to Home</Link>
          <button className="text-blue-600 font-medium hover:underline" onClick={() => alert('Password reset not implemented')}>Reset password</button>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 