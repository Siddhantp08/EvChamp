import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const DeleteAccount: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [step, setStep] = useState<'info' | 'confirm' | 'deleting' | 'done' | 'error'>('info');
  const [confirmText, setConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    setStep('deleting');
    try {
      // Try to delete the account
      await user?.delete();
      setStep('done');
      setTimeout(() => {
        signOut();
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('Delete account error:', err);
      
      // Check if the error is about verification or requires re-authentication
      const errorMessage = err?.errors?.[0]?.message || err?.message || '';
      const errorCode = err?.errors?.[0]?.code || '';
      
      if (errorCode === 'verification_required' || 
          errorCode === 'requires_second_factor' ||
          errorMessage.toLowerCase().includes('verification') || 
          errorMessage.toLowerCase().includes('additional') ||
          errorMessage.toLowerCase().includes('re-authenticate')) {
        // Provide clear instructions for verification-required scenarios
        setErrorMsg(
          'For security reasons, you need to verify your identity before deleting your account. ' +
          'Please sign out, sign back in, and then try deleting your account again. ' +
          'If the issue persists, contact our support team.'
        );
      } else {
        setErrorMsg(errorMessage || 'Something went wrong. Please try again or contact support.');
      }
      setStep('error');
    }
  };

  // Not signed in – show a message to sign in first
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-100 to-blue-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to delete your account.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/sign-in')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-100 to-blue-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Deleted</h2>
          <p className="text-gray-600">Your account has been permanently deleted. You will be redirected shortly.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    const isVerificationError = errorMsg.toLowerCase().includes('verify') || 
                                 errorMsg.toLowerCase().includes('sign out') ||
                                 errorMsg.toLowerCase().includes('re-authenticate');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-100 to-blue-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isVerificationError ? 'Verification Required' : 'Deletion Failed'}
          </h2>
          <p className="text-gray-600 mb-4">{errorMsg}</p>
          <p className="text-sm text-gray-500 mb-6">
            {isVerificationError ? (
              <>Need help? Contact us at </>
            ) : (
              <>Please contact us at </>
            )}
            <a href="mailto:hello@zip-bolt.com" className="text-green-600 underline">
              hello@zip-bolt.com
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isVerificationError && (
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/sign-in');
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Sign Out & Sign In Again
              </button>
            )}
            <button
              onClick={() => { setStep('info'); setConfirmText(''); setErrorMsg(''); }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-100 to-blue-200 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="bg-red-600 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Delete Account</h1>
          </div>
        </div>

        <div className="px-8 py-6">

          {/* Step 1: Info */}
          {step === 'info' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-semibold text-sm mb-2">⚠️ This action is permanent and cannot be undone.</p>
                <p className="text-red-600 text-sm">Deleting your account will:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-600">
                  <li>Permanently remove your profile and all personal data</li>
                  <li>Cancel any active subscriptions</li>
                  <li>Revoke access to all EVChamp services</li>
                  <li>Delete your fleet management history and analytics</li>
                </ul>
              </div>

              <p className="text-gray-700 text-sm mb-2">
                Signed in as: <span className="font-semibold">{user?.primaryEmailAddress?.emailAddress || user?.username}</span>
              </p>

              <p className="text-gray-600 text-sm mb-6">
                If you'd prefer, you can contact us at{' '}
                <a href="mailto:hello@zip-bolt.com" className="text-green-600 underline">
                  hello@zip-bolt.com
                </a>{' '}
                to resolve any issues before deleting.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  Continue to Delete
                </button>
              </div>
            </>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && (
            <>
              <p className="text-gray-700 mb-4">
                To confirm deletion, please type{' '}
                <span className="font-bold text-red-600 bg-red-50 px-1 rounded">DELETE</span>{' '}
                in the box below:
              </p>

              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { setStep('info'); setConfirmText(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText.trim().toUpperCase() !== 'DELETE'}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                    confirmText.trim().toUpperCase() === 'DELETE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-200 text-red-400 cursor-not-allowed'
                  }`}
                >
                  Permanently Delete Account
                </button>
              </div>
            </>
          )}

          {/* Deleting spinner */}
          {step === 'deleting' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700 font-semibold">Deleting your account...</p>
              <p className="text-gray-500 text-sm mt-1">Please do not close this page.</p>
            </div>
          )}

        </div>

        {/* Footer note */}
        {(step === 'info' || step === 'confirm') && (
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact{' '}
              <a href="mailto:hello@zip-bolt.com" className="text-green-600 underline">
                hello@zip-bolt.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
