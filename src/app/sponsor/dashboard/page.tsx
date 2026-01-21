'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, XCircle, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { SponsorAdSpacesTable } from '@/components/sponsors/SponsorAdSpacesTable';

function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemo(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

// --- Main Page Component ---
export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // User and Sponsor profile fetching
  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const sponsorDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);
  
  // Combined loading state
  const isLoading = isUserLoading || isUserDocLoading || isSponsorProfileLoading;

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  if (isLoading) {
    return (
        <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>;
  }
  if (userDoc?.role !== 'sponsor') {
    router.replace('/profile');
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>;
  }

  if (!sponsorProfile) {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Profilo Sponsor non trovato</CardTitle></CardHeader>
                <CardContent><p>Non abbiamo trovato un profilo sponsor associato al tuo account.</p></CardContent>
            </Card>
        </div>
    );
  }

  const status = sponsorProfile.approvalStatus;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-8">
            {status === 'pending' && (
                <Card className="border-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600"><Clock /> Richiesta in Revisione</CardTitle>
                        <CardDescription>Il tuo profilo sponsor è in attesa di approvazione. Riceverai una notifica non appena sarà stato revisionato.</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {status === 'approved' && (
              <SponsorAdSpacesTable mode="sponsor" />
            )}

            {status === 'rejected' && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><XCircle /> Richiesta Rifiutata</CardTitle>
                        <CardDescription>Purtroppo, la tua richiesta di sponsorizzazione non è stata approvata. Contatta il supporto per maggiori informazioni.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
        <div className="mt-8 flex justify-center">
            <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Esci
            </Button>
        </div>
    </div>
  );
}
