import { useOverlay } from '../OverlayProvider';
import { useAuth } from '../AuthProvider';
import React, { useState, useEffect, useRef } from 'react';
import { usePersonalization } from '../PersonalizationProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { X, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { toastSuccess, toastError, toastInfo } from '../../lib/toast';

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
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    try {
      await loginWithPassword(email, password);
      closeOverlay();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignupSuccess(false);
    setEmailConfirmationRequired(false);
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      });
      
      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already')) {
          setError('Email already registered. Please sign in instead.');
        } else {
          setError(error.message);
        }
        return;
      }
      
      if (data.user) {
        if (data.session) {
          setSignupSuccess(true);
          toastSuccess('Account created successfully');
          setTimeout(() => {
            closeOverlay();
            navigate('/profile');
          }, 1000);
        } else {
          setEmailConfirmationRequired(true);
          setSignupSuccess(true);
          toastInfo('Please check your email to confirm your account');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    setError('');
    loginAsGuest();
    closeOverlay();
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    setResetSent(false);
    if (!email) {
      setResetError('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toastSuccess('Password reset email sent');
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };


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
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.body.style.overflow = '';
    };
  }, [open, closeOverlay]);

  // Reset form when switching between sign in/sign up
  useEffect(() => {
    if (open === 'auth') {
      setError('');
      setResetSent(false);
      setResetError('');
      setSignupSuccess(false);
      setEmailConfirmationRequired(false);
      setShowForgotPassword(false);
    }
  }, [signup, open]);

  if (open !== 'auth') return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeOverlay}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="overflow-y-auto flex-1 px-6 py-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            {user ? 'Profile' : signup ? 'Create Account' : 'Sign In'}
          </h2>
          
          {user ? (
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {user.username ? user.username[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
              </div>
              <div className="text-xl font-semibold text-foreground">{user.username || user.email || 'User'}</div>
              <div className="grid grid-cols-3 gap-4 w-full bg-muted/50 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{wpm}</div>
                  <div className="text-xs text-muted-foreground mt-1">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{testsTaken}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tests</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  closeOverlay();
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Google Sign In */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-background border border-border hover:border-primary/50 text-foreground rounded-lg px-4 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Forgot Password */}
              {showForgotPassword && !signup ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Reset Password</h3>
                    <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
                  </div>
                  
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting || resetSent}
                        autoFocus
                      />
                    </div>

                    {resetSent && (
                      <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-1">Email sent!</p>
                          <p className="text-sm text-muted-foreground">
                            Check your inbox for the reset link.
                          </p>
                        </div>
                      </div>
                    )}

                    {resetError && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-red-400">{resetError}</span>
                      </div>
                    )}

                    {!resetSent && (
                      <>
                        <button
                          type="submit"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          disabled={isSubmitting || !email}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              <span>Send Reset Link</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetSent(false);
                            setResetError('');
                          }}
                          className="w-full text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                        >
                          Back to Sign In
                        </button>
                      </>
                    )}
                  </form>
                </div>
              ) : (
                <>
                  {/* Email/Password Form */}
                  <form onSubmit={signup ? handleEmailSignup : handleEmailLogin} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting || (signup && signupSuccess)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting || (signup && signupSuccess)}
                        minLength={6}
                      />
                    </div>
                    
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-red-400">{error}</span>
                      </div>
                    )}
                    
                    {signup && signupSuccess && emailConfirmationRequired && (
                      <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-1">Account created!</p>
                          <p className="text-sm text-muted-foreground">
                            Please check your email to confirm your account.
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isSubmitting || (signup && signupSuccess)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Please wait...</span>
                        </>
                      ) : (
                        <span>{signup ? 'Create Account' : 'Sign In'}</span>
                      )}
                    </button>

                    {!signup && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setError('');
                            setResetError('');
                            setResetSent(false);
                          }}
                          disabled={isSubmitting}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}

              {/* Toggle Sign Up/Sign In */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setSignup(!signup);
                    setError('');
                    setSignupSuccess(false);
                    setResetSent(false);
                    setResetError('');
                    setShowForgotPassword(false);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                  type="button"
                >
                  {signup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>

              {/* Continue as Guest */}
              <div className="pt-2">
                <button
                  onClick={handleGuestLogin}
                  className="w-full text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                  type="button"
                  disabled={loading || isSubmitting}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
