'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, query } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


// Helper for status badge, will be used inside the main component
const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponibile', color: 'bg-green-500 hover:bg-green-500/80' },
  booked: { label: 'Prenotato', color: 'bg-yellow-500 hover:bg-yellow-500/80' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
  return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
};


function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}


// --- Main Page Component ---

export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // User and Sponsor profile fetching
  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const sponsorDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);

  // --- Ad Spaces Fetching Logic ---
  const adSpacesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null; // Only run query if user is authenticated
    console.log("Auth confirmed, preparing ad_spaces query.");
    return query(collection(firestore, 'ad_spaces'));
  }, [user, firestore]);

  const { data: adSpaces, isLoading: isAdSpacesLoading } = useCollection(adSpacesQuery);
  
  useEffect(() => {
    if (user && adSpaces) {
      console.log(`Query for ad_spaces completed. Documents found: ${adSpaces.length}`);
    }
  }, [adSpaces, user]);


  // Combined loading state for the entire page
  const isLoading = isUserLoading || isUserDocLoading || isSponsorProfileLoading;

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  const fullPageLoader = (
    <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  // Page-level loading and redirects
  if (isLoading) {
    return fullPageLoader;
  }

  if (!user) {
    router.replace('/login');
    return fullPageLoader;
  }
  if (userDoc?.role !== 'sponsor') {
    router.replace('/profile');
    return fullPageLoader;
  }

  if (!sponsorProfile) {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle /> Profilo Sponsor non trovato</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Non abbiamo trovato un profilo sponsor associato al tuo account. Questo potrebbe essere un errore.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  const status = sponsorProfile.approvalStatus;

  // --- UI Rendering ---
  const renderAdSpacesContent = () => {
    if (isAdSpacesLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="ml-2 text-muted-foreground">Caricamento spazi...</p>
        </div>
      );
    }
    if (!adSpaces || adSpaces.length === 0) {
      return (
        <p className="py-8 text-center text-muted-foreground">
          Nessuno spazio pubblicitario disponibile al momento.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        {/* Desktop-only Header */}
        <div className="hidden rounded-md bg-muted/50 p-4 md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:gap-4">
          <h3 className="font-semibold">Spazio Pubblicitario</h3>
          <h3 className="font-semibold">Prezzo</h3>
          <h3 className="font-semibold text-center">Stato</h3>
          <h3 className="font-semibold text-right">Azione</h3>
        </div>
  
        {/* Ad Spaces List */}
        <div className="space-y-4">
          {adSpaces.map((space) => (
            <Card key={space.id} className="overflow-hidden md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:gap-4 md:rounded-lg md:p-4">
              
              {/* --- Mobile View --- */}
              <div className="md:hidden">
                <CardHeader>
                    <CardTitle>{space.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Prezzo</span>
                        <span className="font-medium">{space.price ? `${space.price.toFixed(2)} CHF` : 'N/D'}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Stato</span>
                        <StatusBadge status={space.status} />
                    </div>
                </CardContent>
                <CardFooter>
                     <Button disabled className="w-full">
                        Prenota
                    </Button>
                </CardFooter>
              </div>

              {/* --- Desktop View (uses grid columns) --- */}
              <div className="hidden md:block font-semibold">
                {space.name}
              </div>
              <div className="hidden md:block">
                {space.price ? `${space.price.toFixed(2)} CHF` : 'N/D'}
              </div>
              <div className="hidden md:flex md:justify-center">
                <StatusBadge status={space.status} />
              </div>
              <div className="hidden md:block text-right">
                <Button disabled>
                  Prenota
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
            {status === 'pending' && (
                <Card className="border-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600"><Clock /> Richiesta in Revisione</CardTitle>
                        <CardDescription>Il tuo profilo sponsor è in attesa di approvazione da parte del nostro team. Riceverai una notifica non appena sarà stato revisionato.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Grazie per la tua pazienza. Di solito esaminiamo le richieste entro 24-48 ore.</p>
                    </CardContent>
                </Card>
            )}

            {status === 'approved' && (
                <Card className="border-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle /> Benvenuto, Sponsor!</CardTitle>
                        <CardDescription>Il tuo account è stato approvato. Di seguito trovi gli spazi pubblicitari disponibili.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {renderAdSpacesContent()}
                    </CardContent>
                </Card>
            )}

            {status === 'rejected' && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><XCircle /> Richiesta Rifiutata</CardTitle>
                        <CardDescription>Purtroppo, la tua richiesta di sponsorizzazione non è stata approvata in questo momento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Se ritieni che ci sia stato un errore o desideri maggiori informazioni, non esitare a contattare il nostro supporto.</p>
                    </CardContent>
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
