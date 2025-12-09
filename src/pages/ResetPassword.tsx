import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true); // Start as loading
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionSet, setSessionSet] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
    setIsResetting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsResetting(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      // Sign out the user and redirect to login after a short delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6 sm:p-8">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h2 className="text-2xl font-bold mb-2 text-center text-slate-100">Reset Your Password</h2>
          <p className="text-sm text-slate-400 text-center mb-6">
            Enter your new password below
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Verifying reset link...</p>
            </div>
          ) : error && !sessionSet ? (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold mb-1">Invalid Reset Link</p>
                  <p className="text-red-200 text-sm">{error}</p>
                  <Link
                    to="/"
                    className="inline-block mt-3 text-sm text-red-300 hover:text-red-200 underline"
                  >
                    Return to home page
                  </Link>
                </div>
              </div>
            </div>
          ) : success ? (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-300 font-semibold mb-2 text-lg">Password Reset Successful!</p>
              <p className="text-green-200 text-sm mb-4">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <p className="text-green-200 text-xs">
                Redirecting to home page...
              </p>
            </div>
          ) : sessionSet ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-slate-600 rounded-lg px-4 py-3 text-sm bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all"
                  placeholder="Enter new password (min. 6 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-slate-600 rounded-lg px-4 py-3 text-sm bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-lg px-4 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary hover:opacity-90 text-slate-900 rounded-lg px-4 py-3 font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword; 