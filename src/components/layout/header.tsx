'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import React from 'react';
import { CartSheet } from '@/components/cart/cart-sheet';

export function Header() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();


  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-secondary/80 backdrop-blur-sm no-print">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">
          PaneDelivery
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden items-center gap-2 md:flex">
          {!isUserLoading &&
            (user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/profile">Profilo</Link>
                </Button>
                <CartSheet />
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

        {/* Mobile Cart Icon */}
        <div className="flex items-center gap-2 md:hidden">
            {user && <CartSheet />}
        </div>

      </div>
    </header>
  );
}
