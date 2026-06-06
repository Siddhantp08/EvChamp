import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

const ZeVaultPage: React.FC = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setCredits(null);
      return;
    }

    const fetchCredits = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch('/api/zevault-credits', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load your credits right now.');
        }

        const data = await response.json();
        setCredits(data.remaining ?? 0);
      } catch (err: any) {
        console.error('Failed to fetch ZeVault credits:', err);
        setError(err.message || 'Something went wrong while loading your ZeVault.');
      } finally {
        setLoading(false);
      }
    };

    void fetchCredits();
  }, [isSignedIn, getToken]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 text-center text-slate-100">
          <span className="mx-auto mb-3 flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <h1 className="text-xl font-semibold mb-2">Sign in to view ZeVault</h1>
          <p className="text-sm text-slate-300 mb-4">
            ZeVault stores your test credits securely. Please sign in to see your balance and usage.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-cyan-600 hover:to-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                ZeVault
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">Your EV battery health credits, all in one secure vault.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/zeflash')}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start Quick Test
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Credits Card */}
        <section className="rounded-3xl border border-violet-700/50 bg-gradient-to-br from-violet-900/60 via-slate-950 to-indigo-900/60 p-6 sm:p-8 shadow-lg shadow-violet-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-violet-200 uppercase tracking-[0.2em] mb-2">Available Credits</p>
              <div className="flex items-baseline gap-3">
                {loading ? (
                  <svg className="animate-spin text-yellow-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <span className="text-5xl sm:text-6xl font-extrabold text-yellow-300 drop-shadow-[0_0_25px_rgba(250,204,21,0.35)]">
                    {credits !== null ? credits : '—'}
                  </span>
                )}
                <span className="text-sm sm:text-base text-violet-100 font-medium">
                  ZeVault credit{credits === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-3 text-sm text-violet-100/80 max-w-xl">
                Every ZeVault credit unlocks one complete AI-powered diagnostic of your EV battery health.
              </p>
            </div>
            <div className="space-y-3 w-full sm:w-auto sm:max-w-xs">
              <button
                onClick={() => navigate('/zeflash')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-3 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Use 1 credit now
              </button>
              <a
                href="https://www.zeflash.app/plans"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/70 bg-slate-950/40 text-violet-100 text-sm font-semibold px-4 py-3 hover:bg-violet-900/50"
              >
                Add more credits
              </a>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100 flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* How it works + Rhythm */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h2 className="text-base sm:text-lg font-semibold text-white">How ZeVault credits work</h2>
            </div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              <li>• 1 ZeVault credit = 1 full EV battery diagnostic test.</li>
              <li>• Each test includes AI analysis, instant report and recommendations.</li>
              <li>• Credits are linked to your account, not a single vehicle.</li>
              <li>• Credits are shared across EVChamp and Zeflash — one vault, every service.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <h2 className="text-base sm:text-lg font-semibold text-white">Stay on a 3-month rhythm</h2>
            </div>
            <p className="text-sm text-slate-200">
              To keep your EV battery in check, we gently nudge you to test every 3 months. ZeVault is designed so that roughly one credit is used every 3 months — helping you build a healthy, repeat testing habit without thinking about it.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white mb-1">Ready for your next checkup?</h2>
            <p className="text-sm text-slate-400">
              Run a quick Zeflash test now and turn your ZeVault credits into real insights about your EV's health.
            </p>
          </div>
          <button
            onClick={() => navigate('/zeflash')}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-3 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start Quick Test
          </button>
        </section>

        {/* View full history on zeflash.app */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-semibold text-white">Previous Zeflash tests</h2>
            <a
              href="https://www.zeflash.app/zevault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              View full history →
            </a>
          </div>
          <p className="text-sm text-slate-400">
            Your complete AI report history is available on{' '}
            <a
              href="https://www.zeflash.app/zevault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              zeflash.app/zevault
            </a>
            . Sign in with the same account to view all your past diagnostics.
          </p>
        </section>
      </main>
    </div>
  );
};

export default ZeVaultPage;
