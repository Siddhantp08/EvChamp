import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import EVChampLogo from '../assets/EVChampLogo.png';
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const platformRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformRef.current && !platformRef.current.contains(event.target as Node)) {
        setIsPlatformOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsPlatformOpen(false);
  }, [location.pathname]);

  const { isSignedIn, user } = useUser();

  const protectedRoutes = [
    '/charging-network', '/service-centres', '/buy-plans', '/buy-used-ev',
    '/rsa-plans', '/sell-ev', '/rent-ev', '/advance-analysis', '/delete-account',
  ];

  const goTo = (route: string) => {
    if (protectedRoutes.includes(route) && !isSignedIn) {
      navigate('/sign-in');
      window.scrollTo({ top: 0, behavior: 'auto' });
      setIsMobileMenuOpen(false);
      setIsPlatformOpen(false);
      return;
    }
    navigate(route);
    window.scrollTo({ top: 0, behavior: 'auto' });
    setIsMobileMenuOpen(false);
    setIsPlatformOpen(false);
  };

  const platformLinks = [
    { label: 'EV Marketplace', desc: 'Buy & sell certified EVs', route: '/buy-used-ev' },
    { label: 'Find EV Service Centres', desc: 'Verified workshops near you', route: '/service-centres' },
    { label: 'INVESTYZ', desc: 'Green infrastructure investment', route: '/investyz' },
    { label: 'IoT & Software Plans', desc: 'Hardware + analytics subscriptions', route: '/buy-plans' },
    { label: 'Rent EV', desc: 'Rent electric vehicles near you', route: '/rent-ev' },
    { label: 'Roadside Assistance', desc: 'Emergency EV support', route: '/rsa-plans' },
    { label: 'ZeVault', desc: 'Your diagnostic credits wallet', route: '/zevault' },
    { label: 'Zeflash', desc: 'Rapid AI battery diagnostics', route: '/zeflash' },
    { label: 'ZipBattery', desc: 'AI battery intelligence', route: '/zipbattery' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-100 w-full max-w-[100vw]">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 flex justify-between items-center min-w-0">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 cursor-pointer">
          <img src={EVChampLogo} alt="EVChamp Logo" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-lg sm:text-2xl font-bold font-serif text-gray-900 truncate">EVChamp</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* Platform Dropdown */}
          <div className="relative" ref={platformRef}>
            <button
              onClick={() => setIsPlatformOpen(!isPlatformOpen)}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <span>Platform</span>
              <svg className={`w-4 h-4 transition-transform ${isPlatformOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isPlatformOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                {platformLinks.map((item) => (
                  <button
                    key={item.route}
                    onClick={() => goTo(item.route)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-gray-800 group-hover:text-green-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => goTo('/about')} className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
            About
          </button>
          <button onClick={() => goTo('/contact')} className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Contact
          </button>
          <button onClick={() => goTo('/blog')} className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Blog
          </button>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          {isSignedIn && (
            <button
              onClick={() => goTo('/zevault')}
              className="inline-flex items-center gap-1.5 font-medium px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              ZeVault
            </button>
          )}
          <button
            onClick={() => goTo('/buy-plans')}
            className="bg-gray-900 text-white font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-all text-sm shadow-sm"
          >
            Get Started
          </button>

          {/* Account */}
          <div className="relative" ref={accountRef}>
            {isSignedIn ? (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="flex items-center space-x-1.5 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sign In</span>
                </button>
              </SignInButton>
            )}
            {isDropdownOpen && isSignedIn && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <button onClick={() => { goTo('/zevault'); setIsDropdownOpen(false); }} className="flex items-center w-full px-4 py-2.5 text-sm text-violet-700 hover:bg-violet-50 transition-colors">
                  <svg className="w-4 h-4 mr-3 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  ZeVault Credits
                </button>
                <button onClick={() => { goTo('/user'); setIsDropdownOpen(false); }} className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>
                <SignOutButton>
                  <button className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-2">
          {isSignedIn && (
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-50 transition-all"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {/* Primary CTAs */}
            <div className="flex gap-2 pb-3 border-b border-gray-100">
              <button onClick={() => goTo('/buy-plans')} className="flex-1 text-center bg-gray-900 text-white font-medium px-3 py-2.5 rounded-lg text-sm">
                Get Started
              </button>
            </div>

            {/* Platform Links */}
            <div className="py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Platform</p>
              {platformLinks.map((item) => (
                <button
                  key={item.route}
                  onClick={() => goTo(item.route)}
                  className="w-full text-left px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Other Links */}
            <div className="border-t border-gray-100 pt-2 space-y-1">
              <button onClick={() => goTo('/about')} className="w-full text-left px-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">About</button>
              <button onClick={() => goTo('/contact')} className="w-full text-left px-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Contact</button>
              <button onClick={() => goTo('/blog')} className="w-full text-left px-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Blog</button>
            </div>

            {/* Account */}
            <div className="border-t border-gray-100 pt-3">
              {isSignedIn ? (
                <div className="space-y-1">
                  <div className="px-2 py-1">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <button onClick={() => goTo('/zevault')} className="w-full text-left px-2 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50 rounded-lg flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    ZeVault Credits
                  </button>
                  <button onClick={() => goTo('/user')} className="w-full text-left px-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    Profile Settings
                  </button>
                  <SignOutButton>
                    <button className="w-full text-left px-2 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full text-center bg-gray-900 text-white font-medium px-4 py-2.5 rounded-lg text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;