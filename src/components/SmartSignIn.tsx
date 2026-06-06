import React, { useState } from 'react';
import { SignIn, useSessionList, useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const SmartSignIn: React.FC = () => {
  const { sessions, isLoaded: sessionsLoaded } = useSessionList();
  const { setActive } = useClerk();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [error, setError] = useState('');

  // If already signed in, redirect home
  React.useEffect(() => {
    if (isSignedIn) navigate('/', { replace: true });
  }, [isSignedIn, navigate]);

  // Inactive (saved) sessions — previously signed-in accounts
  const savedSessions = sessions?.filter(s => s.status !== 'active') ?? [];

  // One-tap resume a saved session
  const handleResumeSession = async (sessionId: string) => {
    setSwitching(true);
    setError('');
    try {
      await setActive({ session: sessionId });
      navigate('/', { replace: true });
    } catch {
      setError('Could not restore session. Please sign in again.');
      setSwitching(false);
    }
  };

  // Loading state
  if (!sessionsLoaded || switching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{switching ? 'Signing you in…' : 'Loading…'}</p>
        </div>
      </div>
    );
  }

  // If saved sessions exist and user hasn't clicked "Use a different account"
  if (savedSessions.length > 0 && !showFullForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-6 text-center">
            <img src="/evchamp-logo.png" alt="EVChamp" className="h-10 w-auto mx-auto mb-3" />
            <h1 className="text-white font-bold text-lg">Welcome back</h1>
            <p className="text-gray-400 text-xs mt-1">Choose an account to continue</p>
          </div>

          {/* Saved accounts */}
          <div className="divide-y divide-gray-100">
            {savedSessions.map((session) => {
              const user = session.user;
              const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Account';
              const email = user?.primaryEmailAddress?.emailAddress || user?.primaryPhoneNumber?.phoneNumber || '';
              const avatar = user?.imageUrl;

              return (
                <button
                  key={session.id}
                  onClick={() => handleResumeSession(session.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-200" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center ring-2 ring-gray-200">
                        <span className="text-green-700 font-bold text-base">{name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                    <p className="text-gray-500 text-xs truncate">{email}</p>
                  </div>
                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => setShowFullForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Use a different account
            </button>
          </div>

          {/* Sign up link */}
          <div className="pb-5 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{' '}
              <button onClick={() => navigate('/sign-up')} className="text-green-600 font-semibold hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No saved sessions or user clicked "Use a different account" — show full Clerk form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      {savedSessions.length > 0 && (
        <button
          onClick={() => setShowFullForm(false)}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to saved accounts
        </button>
      )}
      <SignIn
        routing="path"
        path="/sign-in"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default SmartSignIn;
