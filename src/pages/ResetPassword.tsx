import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true); // Start as loading
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionSet, setSessionSet] = useState(false);

  // Extract tokens from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError('Invalid or expired password reset link.');
      setLoading(false);
      return;
    }
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) {
      setError('Invalid or expired password reset link.');
      setLoading(false);
      return;
    }
    // Set Supabase session
    supabase.auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          setError('Session error: ' + error.message);
        } else {
          setSessionSet(true);
        }
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Your Password</h2>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : success ? (
          <div className="text-green-600 text-center">Password reset successful! Redirecting...</div>
        ) : sessionSet ? (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 font-medium">New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <label className="block mb-2 font-medium">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded font-semibold hover:bg-gray-800 transition"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default ResetPassword; 