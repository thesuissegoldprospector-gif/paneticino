'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import React from 'react';
import { CartSheet } from '@/components/cart/cart-sheet';

function AdminNav() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const adminRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);

    const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef);

    if (isUserLoading || isAdminLoading || !adminDoc) return null;

    return (
       <Button variant="ghost" asChild>
          <Link href="/admin/applications">Admin</Link>
        </Button>
    );
}


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
                <AdminNav />
                <Button variant="ghost" asChild>
                  <Link href="/profile">Profilo</Link>
                </Button>
                <CartSheet />
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
