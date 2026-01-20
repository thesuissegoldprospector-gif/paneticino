'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, query } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle, LogOut, Package, BarChart } from 'lucide-react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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
    if (!firestore || !user) {
      return null;
    }
    console.log("Query per ad_spaces avviata perché l'utente è autenticato.");
    return query(collection(firestore, 'ad_spaces'));
  }, [firestore, user]);

  const { data: adSpaces, isLoading: isAdSpacesLoading } = useCollection(adSpacesQuery);

  useEffect(() => {
    if (user && adSpaces) {
      console.log(`Query per ad_spaces completata. Documenti trovati: ${adSpaces.length}`);
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
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome spazio</TableHead>
              <TableHead>Prezzo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azione</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adSpaces.map((space) => (
              <TableRow key={space.id}>
                <TableCell className="font-medium">{space.name}</TableCell>
                <TableCell>{space.price ? `${space.price.toFixed(2)} CHF` : 'N/D'}</TableCell>
                <TableCell><StatusBadge status={space.status} /></TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={space.status === 'available' ? 'default' : 'secondary'}
                    size="sm"
                    disabled={true}
                  >
                    {space.status === 'available' ? 'Prenota' : 'Non disponibile'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
