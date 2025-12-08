import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Users, User as UserIcon, Menu, X } from 'lucide-react';
import { Switch } from './ui/switch';
import { useGamification } from './GamificationProvider';
import { useOverlay } from './OverlayProvider';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';

const logo = '/logo.png';

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
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg px-2 -ml-2"
            aria-label="Go to home page"
          >
            <img
              src={logo}
              alt="TypingThrust Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
            />
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 whitespace-nowrap">
              TypingThrust
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Gamification Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
              <Award className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Gamification</span>
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
              className="flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span className="hidden xl:inline">Gamification</span>
            </Button>

            {/* Leaderboard Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOverlay('leaderboard')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden xl:inline">Leaderboard</span>
            </Button>

            {/* Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProfileClick}
              className="flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden xl:inline">
                {user && user.id !== 'guest' ? 'Profile' : 'Sign In'}
              </span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Gamification Toggle - Only show if enabled */}
            {state.gamificationEnabled && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-200 mr-2">
                <Award className="w-4 h-4 text-gray-600" />
                <Switch 
                  checked={state.gamificationEnabled} 
                  onCheckedChange={setGamificationEnabled}
                  className="scale-75"
                />
              </div>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 space-y-2">
            <button
              onClick={() => {
                openOverlay('gamification');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Award className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Gamification</span>
            </button>

            <button
              onClick={() => {
                openOverlay('leaderboard');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Leaderboard</span>
            </button>

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <UserIcon className="w-5 h-5 text-gray-600" />
              <span className="font-medium">
                {user && user.id !== 'guest' ? 'Profile' : 'Sign In'}
              </span>
            </button>

            {user && user.id !== 'guest' && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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