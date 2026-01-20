'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';


function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Fetch user role to protect the route
  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  
  // Fetch sponsor profile
  const sponsorDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);

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

  if (isLoading) {
    return fullPageLoader;
  }

  // Route Protection
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
                <CardFooter>
                    <Button asChild variant="outline">
                        <Link href="/sponsors">Torna alla pagina Sponsor</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  const status = sponsorProfile.approvalStatus;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
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
                        <CardDescription>Il tuo account è stato approvato. Ora puoi iniziare a esplorare le opzioni di sponsorizzazione.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Usa i link sottostanti per gestire le tue campagne e visualizzare le performance.</p>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-4">
                        <Button asChild>
                            <Link href="/sponsor/spaces">Gestisci Spazi Pubblicitari</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href="/sponsor/stats">Visualizza Statistiche</Link>
                        </Button>
                    </CardFooter>
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
                    <CardFooter>
                         <Button variant="outline">Contatta il Supporto</Button>
                    </CardFooter>
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
