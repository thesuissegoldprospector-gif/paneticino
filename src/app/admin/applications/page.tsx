'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useUser, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, ShieldX, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function AdminDashboard() {
  const firestore = useFirestore();

  const pendingBakersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'bakers'), where('approvalStatus', '==', 'pending'));
  }, [firestore]);

  const { data: pendingBakers, isLoading } = useCollection(pendingBakersQuery);

  const handleApproval = (bakerId: string, newStatus: 'approved' | 'rejected') => {
    const bakerRef = doc(firestore, 'bakers', bakerId);
    updateDocumentNonBlocking(bakerRef, { approvalStatus: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Caricamento richieste...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Richieste Panettieri in Attesa</CardTitle>
        <CardDescription>
          Revisiona, approva o rifiuta le richieste per i nuovi panettieri.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingBakers && pendingBakers.length > 0 ? (
          pendingBakers.map((baker) => (
            <Card key={baker.id} className="p-4">
                <CardHeader>
                    <CardTitle>{baker.companyName}</CardTitle>
                    <CardDescription>{baker.address}</CardDescription>
                </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-semibold">Partita IVA:</span> {baker.companyNumber}</p>
                <p><span className="font-semibold">Zone di consegna:</span> {(baker.deliveryZones || []).join(', ')}</p>
                <p><span className="font-semibold">ID Utente:</span> {baker.userId}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => handleApproval(baker.id, 'rejected')}>
                  <UserX className="mr-2" /> Rifiuta
                </Button>
                <Button variant="default" onClick={() => handleApproval(baker.id, 'approved')}>
                  <UserCheck className="mr-2" /> Approva
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Nessuna richiesta in attesa di approvazione.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminDoc, isLoading: isAdminLoading } = useMemo(() => {
    // This custom hook logic is to check for document existence without real-time updates.
    // A simplified useDoc that doesn't trigger re-renders on data change might be better.
    // For now, we use a one-time getDoc inside a useEffect-like structure.
    
    // Stubbing useDoc response for existence check
    const [adminData, setAdminData] = React.useState<{data: DocumentData | null, isLoading: boolean}>({data: null, isLoading: true});
    
    React.useEffect(() => {
        if(adminRef) {
            const { getDoc } = require("firebase/firestore");
            getDoc(adminRef).then(docSnap => {
                setAdminData({ data: docSnap.exists() ? docSnap.data() : null, isLoading: false });
            }).catch(() => {
                 setAdminData({ data: null, isLoading: false });
            })
        } else if (!isUserLoading) {
            setAdminData({ data: null, isLoading: false });
        }
    }, [adminRef, isUserLoading]);

    return adminData;

  }, [adminRef, isUserLoading]);

  const isLoading = isUserLoading || isAdminLoading;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Autenticazione richiesta</h2>
        <p className="text-muted-foreground">
          Devi effettuare l'accesso per visualizzare questa pagina.
        </p>
        <Button asChild>
          <Link href="/login">Vai al Login</Link>
        </Button>
      </div>
    );
  }

  if (!adminDoc) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShieldX className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Accesso Negato</h2>
        <p className="text-muted-foreground">
          Non disponi delle autorizzazioni necessarie per visualizzare questa pagina.
        </p>
         <Button asChild variant="outline">
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    );
  }
  

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <AdminDashboard />
    </div>
  );
}
