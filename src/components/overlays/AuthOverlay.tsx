import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { useOverlay } from '../OverlayProvider';
import { useAuth } from '../AuthProvider';
import React, { useState } from 'react';
import { usePersonalization } from '../PersonalizationProvider';

export default function AuthOverlay() {
  const { open, closeOverlay } = useOverlay();
  const { loginWithGoogle, loginWithPassword, loginAsGuest, logout, user, loading } = useAuth();
  const { state } = usePersonalization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithPassword(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  // User stats
  const wpm = state?.stats?.wpm ?? 0;
  const accuracy = state?.stats?.accuracy ?? 100;
  const testsTaken = state?.stats?.history?.length ?? 0;

  return (
    <Dialog open={open === 'auth'} onOpenChange={closeOverlay}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{user ? 'Profile' : 'Sign In to ProType'}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
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
              <div className="text-xl font-bold text-gray-900">{user.username || user.email || 'User'}</div>
              {/* Stats */}
              <div className="flex flex-row flex-wrap justify-center gap-6 w-full bg-gray-50 border border-gray-100 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-blue-700">{wpm}</div>
                  <div className="text-xs text-gray-500">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-blue-700">{accuracy}%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold text-blue-700">{testsTaken}</div>
                  <div className="text-xs text-gray-500">Tests</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded px-4 py-2 font-medium mt-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-medium"
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.44c-.54 2.9-2.18 5.36-4.64 7.01l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.09 0 19.91 0 24c0 4.09.99 7.91 2.69 11.9l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.18 0 11.64-2.04 15.53-5.55l-7.19-5.6c-2.01 1.35-4.58 2.15-7.34 2.15-6.38 0-11.87-3.59-14.33-8.89l-7.98 6.2C6.73 42.52 14.82 48 24 48z"/></g></svg>
                Sign in with Google
              </button>
              <button
                onClick={() => window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID'}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded px-4 py-2 font-medium mt-2"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/></svg>
                Sign in with GitHub
              </button>
              <form onSubmit={handleEmailLogin} className="space-y-2 mt-4">
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 font-medium"
                  disabled={loading}
                >
                  Sign in with Email
                </button>
                {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
              </form>
              <button
                onClick={loginAsGuest}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded px-4 py-2 font-medium mt-2"
                disabled={loading}
              >
                Continue as Guest
              </button>
            </>
          )}
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
} 