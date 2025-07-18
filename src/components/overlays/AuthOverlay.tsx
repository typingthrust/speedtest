import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { useOverlay } from '../OverlayProvider';
import { useAuth } from '../AuthProvider';
import React, { useState, useEffect } from 'react';
import { usePersonalization } from '../PersonalizationProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function AuthOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { loginWithGoogle, loginWithPassword, signUpWithPassword, loginAsGuest, logout, user, loading } = useAuth();
  const { state } = usePersonalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupExists, setSignupExists] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && open === 'auth') {
      closeOverlay();
      navigate('/profile');
    }
  }, [user, open, closeOverlay, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithPassword(email, password);
      setLoginAttempts(0); // reset on success
    } catch (err: any) {
      setLoginAttempts(prev => prev + 1);
      setError(err.message || 'Login failed');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignupExists(false);
    try {
      await signUpWithPassword(email, password);
      setSignupSuccess(true);
    } catch (err: any) {
      // Supabase error for existing user
      if (err.message && err.message.toLowerCase().includes('user already registered')) {
        setSignupExists(true);
        setError('Account already exists. Please sign in.');
      } else {
        setError(err.message || 'Signup failed');
      }
    }
  };

  const handleForgotPassword = async () => {
    setResetError('');
    setResetSent(false);
    if (!email) {
      setResetError('Enter your email above first.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://typing-thrust.vercel.app/reset-password', // <-- set to your real prod URL
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email');
    }
  };

  // User stats
  const wpm = state?.stats?.wpm ?? 0;
  const accuracy = state?.stats?.accuracy ?? 100;
  const testsTaken = state?.stats?.history?.length ?? 0;

  return (
    <Dialog open={open === 'auth'} onOpenChange={closeOverlay}>
      <DialogContent className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-0">
        <DialogHeader>
          <DialogTitle className="text-black font-bold text-xl text-center pt-6 pb-2">{user ? 'Profile' : signup ? 'Sign Up for ProType' : 'Sign In to ProType'}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6 px-6">
          {user ? (
            <div className="flex flex-col items-center gap-4">
              {/* Avatar */}
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-full border border-gray-200 shadow" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400">
                  {user.username ? user.username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
                </div>
              )}
              {/* Username/email */}
              <div className="text-xl font-bold text-black">{user.username || user.email || 'User'}</div>
              {/* Stats */}
              <div className="flex flex-row flex-wrap justify-center gap-6 w-full bg-gray-50 border border-gray-100 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-black">{wpm}</div>
                  <div className="text-xs text-gray-500">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-black">{accuracy}%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-black">{testsTaken}</div>
                  <div className="text-xs text-gray-500">Tests</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full bg-black hover:bg-gray-900 text-white rounded-lg px-4 py-2 font-medium mt-2 transition-all duration-150"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={signup ? handleEmailSignup : handleEmailLogin} className="space-y-2 mt-4">
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={signup && signupSuccess}
                />
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={signup && signupSuccess}
                />
                <button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-900 text-white rounded-lg px-4 py-2 font-semibold transition-all duration-150"
                  disabled={loading || (signup && signupSuccess)}
                  style={{ fontWeight: 600 }}
                >
                  {signup ? 'Sign up with Email' : 'Sign in with Email'}
                </button>
                {signup && signupSuccess && !signupExists && (
                  <div className="text-green-600 text-xs mt-1">Verification email sent! Please check your inbox and click the link to activate your account.</div>
                )}
                {signup && signupExists && (
                  <div className="text-blue-600 text-xs mt-1">Account already exists. <button className='underline' type='button' onClick={() => { setSignup(false); setSignupSuccess(false); setError(''); }}>Sign in?</button></div>
                )}
                {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
                {/* Forgot password link */}
                {!signup && (
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      className="text-xs text-gray-500 hover:underline hover:text-black font-medium"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {/* Show forgot password suggestion after 3 failed attempts */}
                {!signup && loginAttempts >= 3 && (
                  <div className="text-yellow-600 text-xs mt-1">Having trouble? <button className='underline' type='button' onClick={handleForgotPassword}>Reset your password</button></div>
                )}
                {resetSent && <div className="text-green-600 text-xs mt-1">Check your email for a reset link.</div>}
                {resetError && <div className="text-red-500 text-xs mt-1">{resetError}</div>}
              </form>
              <div className="flex justify-between mt-2 items-center">
                <button
                  onClick={() => setSignup(!signup)}
                  className="text-gray-700 hover:underline text-sm font-medium"
                  type="button"
                >
                  {signup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
                <button
                  onClick={loginAsGuest}
                  className="text-gray-400 hover:text-black hover:underline text-sm font-medium"
                  type="button"
                  disabled={loading}
                >
                  Continue as Guest
                </button>
              </div>
            </>
          )}
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
} 