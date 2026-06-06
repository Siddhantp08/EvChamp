import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

export function useSyncUserToDB() {
  const { isSignedIn, user } = useUser();
  const synced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || synced.current) return;

    synced.current = true;

    const primaryEmail = user.primaryEmailAddress?.emailAddress ?? null;

    fetch(`${API_BASE}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: user.id,
        email: primaryEmail,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        imageUrl: user.imageUrl ?? null,
      }),
    }).catch((err) => {
      console.error('User sync error:', err);
    });
  }, [isSignedIn, user]);
}
