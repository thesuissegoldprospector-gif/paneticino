'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">
          PaneDelivery
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {!isUserLoading &&
            (user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/profile">Profilo</Link>
                </Button>
                <Button onClick={handleLogout}>Esci</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Accedi</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Registrati</Link>
                </Button>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}
