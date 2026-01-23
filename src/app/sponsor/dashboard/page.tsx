'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, XCircle, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import SponsorAgenda from '@/components/sponsors/SponsorAgenda';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemo(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

// --- Helper components ---

type SponsorStatus = 'pending' | 'approved' | 'rejected';

const statusConfig: Record<SponsorStatus, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'bg-yellow-500 hover:bg-yellow-500/80' },
  approved: { label: 'Approvato', color: 'bg-green-500 hover:bg-green-500/80' },
  rejected: { label: 'Rifiutato', color: 'bg-red-500 hover:bg-red-500/80' },
};

const StatusBadge = ({ status }: { status: SponsorStatus }) => {
  if (!status) return null;
  const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
  return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
};

function SponsorProfileCard({ user, sponsorProfile }) {
    if (!user || !sponsorProfile) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Il Tuo Profilo Sponsor</CardTitle>
                <CardDescription>
                    Questi sono i dati associati al tuo account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="w-32 text-muted-foreground">Nome Azienda</p>
                    <p className="font-semibold">{sponsorProfile.companyName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="w-32 text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="w-32 text-muted-foreground">Stato Account</p>
                    <StatusBadge status={sponsorProfile.approvalStatus} />
                </div>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---
export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const sponsorDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);

  const isLoading = isUserLoading || isUserDocLoading || isSponsorProfileLoading;

  useEffect(() => {
    // Wait until all data is loaded before attempting to redirect.
    if (isLoading) return;

    // This is a side effect and should be in a useEffect.
    if (!user) {
      router.replace('/login');
    } else if (userDoc?.role !== 'sponsor') {
      router.replace('/profile');
    }
  }, [user, userDoc, isLoading, router]);

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  // Render a loading state while checks are in progress or user is not yet loaded.
  if (isLoading || !user || userDoc?.role !== 'sponsor') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {userDoc && userDoc.role !== 'sponsor' && <p className="ml-4 text-muted-foreground">Reindirizzamento...</p>}
      </div>
    );
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
        <SponsorProfileCard user={user} sponsorProfile={sponsorProfile} />

        {status === 'pending' && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600"><Clock /> Richiesta in Revisione</CardTitle>
              <CardDescription>Il tuo profilo sponsor è in attesa di approvazione. Riceverai una notifica non appena sarà stato revisionato.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {status === 'approved' && (
          <SponsorAgenda />
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
