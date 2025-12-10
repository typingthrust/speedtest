import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Users, User as UserIcon, Menu, X } from 'lucide-react';
import { Switch } from './ui/switch';
import { useGamification } from './GamificationProvider';
import { useOverlay } from './OverlayProvider';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import Logo from './Logo';

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
    <nav className="w-full bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo - Modern SVG Logo */}
          <Link 
            to="/" 
            onClick={() => navigate('/')}
            className="logo-link flex items-center focus:outline-none focus:ring-0 rounded-lg px-2 -ml-2 no-underline"
            aria-label="Go to home page"
            style={{ outline: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <Logo className="h-8 sm:h-9 md:h-10 w-auto flex-shrink-0 select-none" />
          </Link>

          {/* Desktop Navigation - Minimal & Clean */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* Gamification Toggle - Compact */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/50 border border-border/50">
              <Award className="w-3.5 h-3.5 text-primary" />
              <Switch 
                checked={state.gamificationEnabled} 
                onCheckedChange={setGamificationEnabled}
                className="scale-90"
              />
            </div>

            {/* Gamification Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOverlay('gamification')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-card/50 text-sm"
            >
              <Award className="w-4 h-4" />
            </Button>

            {/* Leaderboard Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openOverlay('leaderboard')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-card/50 text-sm"
            >
              <Users className="w-4 h-4" />
            </Button>

            {/* Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProfileClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-card/50 text-sm"
            >
              <UserIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Gamification Toggle - Compact */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-card/50 border border-border/50">
              <Award className="w-3.5 h-3.5 text-primary" />
              <Switch 
                checked={state.gamificationEnabled} 
                onCheckedChange={setGamificationEnabled}
                className="scale-75"
              />
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-card/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4 space-y-2">
            <button
              onClick={() => {
                openOverlay('gamification');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-foreground hover:bg-card rounded-lg transition-colors"
            >
              <Award className="w-5 h-5 text-primary" />
              <span className="font-medium">Gamification</span>
            </button>

            <button
              onClick={() => {
                openOverlay('leaderboard');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-foreground hover:bg-card rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Leaderboard</span>
            </button>

            <div className="border-t border-border my-2"></div>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-foreground hover:bg-card rounded-lg transition-colors"
            >
              <UserIcon className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {user && user.id !== 'guest' ? 'Profile' : 'Sign In'}
              </span>
            </button>

            {user && user.id !== 'guest' && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-400 hover:bg-card rounded-lg transition-colors"
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