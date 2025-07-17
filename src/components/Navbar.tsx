import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from './ui/navigation-menu';
import { User, Keyboard, Award, Users, User as UserIcon, Menu } from 'lucide-react';
import { ExpandableTabs } from './ui/expandable-tabs';
import { Switch } from './ui/switch';
import { useGamification } from './GamificationProvider';
import { useOverlay } from './OverlayProvider';
import logo from '../../public/logo.png';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';
import { useAuth } from './AuthProvider';

const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Tests', to: '/tests' },
  { label: 'Analytics', to: '/profile' },
  { label: 'Profile', to: '/profile' },
];

// Remove navbarTabs and ExpandableTabs entirely since no tabs are needed

const Navbar: React.FC = () => {
  const location = useLocation();
  const { openOverlay } = useOverlay();
  const { state, setGamificationEnabled } = useGamification();
  const { user } = useAuth();
  return (
    <nav className="w-full flex flex-wrap md:flex-nowrap justify-between items-center py-0 md:py-7 bg-white sticky top-0 z-40 px-2 md:px-0">
      <div className="flex items-center gap-2 align-middle flex-shrink-0 min-w-0">
        <Link to="/" className="flex items-center gap-2 align-middle focus:outline-none" aria-label="Go to home page">
          <img
            src={logo}
            alt="TypingThrust Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 flex items-center whitespace-nowrap" style={{fontFamily:'Inter, Roboto, system-ui, sans-serif'}}>TypingThrust</h1>
        </Link>
      </div>
      {/* Desktop Controls */}
      <div className="hidden md:flex flex-wrap justify-end items-center gap-2 md:gap-3 mt-3 md:mt-0 w-full md:w-auto">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/80 border border-gray-200 shadow-sm flex-nowrap">
          <Award className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium text-base hidden sm:inline">Gamification</span>
          <Switch checked={state.gamificationEnabled} onCheckedChange={setGamificationEnabled} />
        </div>
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 text-gray-800 font-semibold shadow hover:bg-gray-200 transition"
          onClick={() => openOverlay('gamification')}
          type="button"
          aria-label="Open Gamification"
        >
          <Award className="w-5 h-5" />
          <span className="hidden sm:inline">Gamification</span>
        </button>
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 text-gray-800 font-semibold shadow hover:bg-gray-200 transition"
          onClick={() => openOverlay('leaderboard')}
          type="button"
          aria-label="Open Leaderboard"
        >
          <Users className="w-5 h-5" />
          <span className="hidden sm:inline">Leaderboard</span>
        </button>
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          onClick={() => {
            if (user) {
              window.location.href = '/profile';
            } else {
              openOverlay('auth');
            }
          }}
          type="button"
          aria-label="Profile"
        >
          <UserIcon className="w-5 h-5" />
        </button>
      </div>
      {/* Mobile Hamburger Dropdown */}
      <div className="flex md:hidden items-center ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none" aria-label="Open menu">
              <Menu className="w-7 h-7 text-gray-900" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem asChild>
              <div className="flex items-center gap-2 w-full">
                <Award className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium text-base">Gamification</span>
                <Switch checked={state.gamificationEnabled} onCheckedChange={setGamificationEnabled} />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button className="flex items-center gap-2 w-full text-gray-800" onClick={() => openOverlay('gamification')} type="button">
                <Award className="w-5 h-5" />
                <span>Gamification</span>
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button className="flex items-center gap-2 w-full text-gray-800" onClick={() => openOverlay('leaderboard')} type="button">
                <Users className="w-5 h-5" />
                <span>Leaderboard</span>
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                className="flex items-center gap-2 w-full text-gray-800"
                onClick={() => {
                  if (user) {
                    window.location.href = '/profile';
                  } else {
                    openOverlay('auth');
                  }
                }}
                type="button"
              >
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar; 