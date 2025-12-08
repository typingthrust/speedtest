import { useOverlay } from '../OverlayProvider';
import { useAuth } from '../AuthProvider';
import React, { useState, useEffect, useRef } from 'react';
import { usePersonalization } from '../PersonalizationProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { X } from 'lucide-react';

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
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
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
    setResetError('');
    setResetSent(false);
    try {
      await loginWithPassword(email, password);
      setLoginAttempts(0);
      closeOverlay();
    } catch (err: any) {
      setLoginAttempts(prev => prev + 1);
      setError(err.message || 'Login failed. Please check your email and password.');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignupExists(false);
    setSignupSuccess(false);
    setEmailConfirmationRequired(false);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      });
      
      if (error) {
        const errorMsg = error.message || 'Signup failed';
        if (errorMsg.toLowerCase().includes('already registered') || errorMsg.toLowerCase().includes('user already')) {
          setSignupExists(true);
          setError('Email already registered. Please sign in instead.');
        } else {
          setError(errorMsg);
        }
        setSignupSuccess(false);
        return;
      }
      
      // Check if user was created
      if (data.user) {
        // If session exists, email confirmation is disabled and user is signed in
        if (data.session) {
          setEmailConfirmationRequired(false);
          setSignupSuccess(true);
          setError('');
          setTimeout(() => {
            closeOverlay();
            navigate('/profile');
          }, 1500);
        } else {
          // No session - email confirmation is REQUIRED
          // User MUST click the activation link in their email
          setEmailConfirmationRequired(true);
          setSignupSuccess(true);
          setError('');
        }
      } else {
        setError('Signup completed, but unable to create account. Please try again.');
        setSignupSuccess(false);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      setSignupSuccess(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      // Note: OAuth redirects, so we don't close overlay here
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleGuestLogin = () => {
    setError('');
    loginAsGuest();
    closeOverlay();
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
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email');
    }
  };

  const handleResendConfirmationEmail = async () => {
    setResendingEmail(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      });
      if (error) throw error;
      setError('');
      // Show success message
      setTimeout(() => {
        setResendingEmail(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email. Check your Supabase email settings.');
      setResendingEmail(false);
    }
  };

  // User stats
  const wpm = state?.stats?.wpm ?? 0;
  const accuracy = state?.stats?.accuracy ?? 100;
  const testsTaken = state?.stats?.history?.length ?? 0;

  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (backdropRef.current && e.target === backdropRef.current) {
        closeOverlay();
      }
    }
    if (open === 'auth') {
      document.addEventListener('mousedown', handleClick);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.body.style.overflow = '';
    };
  }, [open, closeOverlay]);

  if (open !== 'auth') return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-md mx-auto bg-white/95 rounded-2xl border border-white/40 shadow-2xl flex flex-col min-h-[400px] max-h-[90vh] min-w-[320px] p-0"
        style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.12)' }}
      >
        <button
          onClick={closeOverlay}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-full px-8 pt-8 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            {user ? 'Profile' : signup ? 'Create Account' : 'Sign In'}
          </h2>
          
          <div className="space-y-5">
          {user ? (
            <div className="flex flex-col items-center gap-5">
              {/* Avatar */}
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-full border-2 border-gray-200 shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600">
                  {user.username ? user.username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
                </div>
              )}
              {/* Username/email */}
              <div className="text-xl font-bold text-gray-900">{user.username || user.email || 'User'}</div>
              {/* Stats */}
              <div className="flex flex-row justify-center gap-8 w-full bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-gray-900">{wpm}</div>
                  <div className="text-xs text-gray-600 mt-1">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-gray-900">{accuracy}%</div>
                  <div className="text-xs text-gray-600 mt-1">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-gray-900">{testsTaken}</div>
                  <div className="text-xs text-gray-600 mt-1">Tests</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  closeOverlay();
                }}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 py-3 font-semibold transition-all duration-200 shadow-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900 rounded-lg px-4 py-3 font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/95 text-gray-500">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={signup ? handleEmailSignup : handleEmailLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading || (signup && signupSuccess)}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 transition-all"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading || (signup && signupSuccess)}
                    minLength={6}
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                    {error}
                  </div>
                )}
                
                {signup && signupSuccess && !signupExists && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-4">
                    {emailConfirmationRequired ? (
                      <div>
                        <p className="font-semibold mb-2 text-base">✓ Account created!</p>
                        <p className="text-sm mb-3 leading-relaxed">
                          An activation email should be sent to <strong className="text-blue-900">{email}</strong>
                        </p>
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-yellow-900 mb-2">⚠️ Not receiving emails?</p>
                          <p className="text-xs text-yellow-800 leading-relaxed mb-2 font-semibold">
                            📬 CHECK YOUR SPAM/JUNK FOLDER FIRST! Supabase emails often go there.
                          </p>
                          <p className="text-xs text-yellow-800 leading-relaxed mb-2">
                            If you still don't see it, your Supabase project may not have email sending configured. 
                            You can try signing in directly - if email confirmation is disabled, it will work.
                          </p>
                          <button
                            type="button"
                            onClick={handleResendConfirmationEmail}
                            disabled={resendingEmail}
                            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50"
                          >
                            {resendingEmail ? 'Sending...' : 'Resend confirmation email'}
                          </button>
                        </div>
                        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-blue-900 mb-2">📧 Check your email:</p>
                          <div className="space-y-1.5 text-xs text-blue-800">
                            <p className="font-semibold text-blue-900">⚠️ IMPORTANT: Check your SPAM/JUNK folder!</p>
                            <p>• Activation emails often go to spam - check there first</p>
                            <p>• Look for an email from Supabase or TypingThrust</p>
                            <p>• <strong>Mark it as "Not Spam"</strong> if found in spam folder</p>
                            <p>• Click the activation link in the email</p>
                            <p>• Without clicking the link, you'll see "invalid email" when signing in</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              // Try to sign in to see if email confirmation is actually required
                              try {
                                await loginWithPassword(email, password);
                                closeOverlay();
                              } catch (err: any) {
                                // If sign in fails, switch to sign in mode so user can see the error
                                setSignup(false);
                                setSignupSuccess(false);
                                setEmailConfirmationRequired(false);
                                setError('Account created but email not confirmed. Please check your email for the activation link, or contact support if emails aren\'t being sent.');
                              }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                          >
                            Try Signing In
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSignup(false);
                              setSignupSuccess(false);
                              setEmailConfirmationRequired(false);
                              setError('');
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                          >
                            Switch to Sign In
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold">✓ Account created successfully!</p>
                        <p className="text-xs mt-1">You're signed in. Redirecting...</p>
                      </div>
                    )}
                  </div>
                )}
                
                {signup && signupExists && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-2">
                    Account already exists. <button className='underline font-semibold' type='button' onClick={() => { setSignup(false); setSignupSuccess(false); setError(''); }}>Sign in instead</button>
                  </div>
                )}

                {!signup && resetSent && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
                    Password reset email sent! Check your inbox.
                  </div>
                )}
                
                {!signup && resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 py-3 font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || (signup && signupSuccess)}
                >
                  {loading ? 'Please wait...' : (signup ? 'Create Account' : 'Sign In')}
                </button>

                {/* Forgot password link */}
                {!signup && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-gray-600 hover:text-gray-900 hover:underline font-medium"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>

              {/* Toggle Sign Up/Sign In */}
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSignup(!signup);
                    setError('');
                    setSignupSuccess(false);
                    setSignupExists(false);
                    setResetSent(false);
                    setResetError('');
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
                  type="button"
                >
                  {signup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>

              {/* Continue as Guest */}
              <div className="pt-2">
                <button
                  onClick={handleGuestLogin}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium underline"
                  type="button"
                  disabled={loading}
                >
                  Continue as Guest
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
} 