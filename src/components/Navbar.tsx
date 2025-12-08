import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Users, User as UserIcon, Menu, X } from 'lucide-react';
import { Switch } from './ui/switch';
import { useGamification } from './GamificationProvider';
import { useOverlay } from './OverlayProvider';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';

const logo = '/logonew.png';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { openOverlay } = useOverlay();
  const { state, setGamificationEnabled } = useGamification();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProfileClick = () => {
    if (user && user.id !== 'guest') {
      navigate('/profile');
    } else {
      openOverlay('auth');
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-sm">
      <div className="w-full px-2 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            onClick={() => navigate('/')}
            className="logo-link flex items-center focus:outline-none focus:ring-0 rounded-lg px-2 -ml-2 no-underline"
            aria-label="Go to home page"
            style={{ outline: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <img
              src={logo}
              alt="TypingThrust Logo"
              className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 xl:w-52 xl:h-52 object-contain flex-shrink-0 select-none"
              draggable="false"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Gamification Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Award className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-200">Gamification</span>
              <Switch 
                checked={state.gamificationEnabled} 
                onCheckedChange={setGamificationEnabled}
                className="ml-1"
              />
            </div>

            {/* Gamification Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOverlay('gamification')}
              className="flex items-center gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              <Award className="w-4 h-4" />
              <span className="hidden xl:inline">Gamification</span>
            </Button>

            {/* Leaderboard Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOverlay('leaderboard')}
              className="flex items-center gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              <Users className="w-4 h-4" />
              <span className="hidden xl:inline">Leaderboard</span>
            </Button>

            {/* Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProfileClick}
              className="flex items-center gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden xl:inline">
                {user && user.id !== 'guest' ? 'Profile' : 'Sign In'}
              </span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Gamification Toggle - Always visible */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 mr-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <Switch 
                checked={state.gamificationEnabled} 
                onCheckedChange={setGamificationEnabled}
                className="scale-75"
              />
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-100" />
              ) : (
                <Menu className="w-6 h-6 text-slate-100" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-700 py-4 space-y-2">
            <button
              onClick={() => {
                openOverlay('gamification');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Award className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">Gamification</span>
            </button>

            <button
              onClick={() => {
                openOverlay('leaderboard');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">Leaderboard</span>
            </button>

            <div className="border-t border-slate-700 my-2"></div>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <UserIcon className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">
                {user && user.id !== 'guest' ? 'Profile' : 'Sign In'}
              </span>
            </button>

            {user && user.id !== 'guest' && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="font-medium">Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 