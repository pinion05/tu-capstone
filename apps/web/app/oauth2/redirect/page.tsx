'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function OAuth2RedirectPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Tokens are now securely set as HttpOnly cookies by the backend
    refreshUser().then(() => {
      router.push('/');
    }).catch((err) => {
      console.error('Failed to load user data after OAuth2 login', err);
      router.push('/login?error=auth_failed');
    });
  }, [router, refreshUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold">Completing login...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we set up your session.</p>
    </div>
  );
}
