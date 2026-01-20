'use client';

import { useMemo } from 'react';
import { User } from 'firebase/auth';
import { doc, DocumentData } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SponsorDashboard({ user }: { user: User }) {
  const firestore = useFirestore();

  const sponsorDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user.uid]);

  const { data: sponsorProfile, isLoading } = useDoc(sponsorDocRef);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!sponsorProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle /> Profilo Sponsor non trovato</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Non abbiamo trovato un profilo sponsor associato al tuo account.</p>
        </CardContent>
        <CardFooter>
            <Button asChild>
                <Link href="/sponsors">Crea un profilo Sponsor</Link>
            </Button>
        </CardFooter>
      </Card>
    );
  }

  const status = sponsorProfile.approvalStatus;

  return (
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
                <CardFooter className="gap-4">
                    <Button disabled>Gestisci Spazi Pubblicitari (Presto disponibile)</Button>
                    <Button variant="secondary" disabled>Visualizza Statistiche (Presto disponibile)</Button>
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
  );
}
