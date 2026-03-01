'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import type { UserRole } from '@/types';

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      // Wait for Firebase auth to finish initializing before making a decision
      if (authLoading) return;
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching role:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user, authLoading]);

  return {
    role,
    loading,
    isHR: role === 'hr',
    isJobSeeker: role === 'job_seeker',
  };
}
