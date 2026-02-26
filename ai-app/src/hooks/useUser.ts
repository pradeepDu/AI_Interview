'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import type { User } from '@/types';

export function useUser() {
  const { user: firebaseUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [firebaseUser]);

  return { user, loading };
}
