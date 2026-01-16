'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { Loader2, AlertTriangle, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import CustomerDashboard from './CustomerDashboard';
import BakerDashboard from './BakerDashboard';

function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

function useAdminRole(userId?: string) {
    const firestore = useFirestore();
    const adminRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'roles_admin', userId) : null), [firestore, userId]);
    return useDoc(adminRef);
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const { data: adminDoc, isLoading: isAdminLoading } = useAdminRole(user?.uid);
  
  const role = userDoc?.role;
  const isAdmin = !!adminDoc;
  
  const isLoading = isUserLoading || isUserDocLoading || isAdminLoading;

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/');
  };

  if (isLoading) {
    return <div className="flex h-full min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Autenticazione richiesta</h2>
        <p className="text-muted-foreground">Devi effettuare l'accesso per visualizzare il tuo profilo.</p>
        <Button asChild><Link href="/login">Vai al Login</Link></Button>
      </div>
    );
  }
  
  if (!userDoc) {
     return <div className="flex h-full min-h-[50vh] items-center justify-center"><p>Caricamento dati utente...</p><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      
      {isAdmin && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield /> Area Amministratore</CardTitle>
                <CardDescription>Gestisci le richieste e le impostazioni dell'applicazione.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/admin/applications">Vai alla dashboard admin</Link>
                </Button>
            </CardContent>
        </Card>
      )}

      {role === 'baker' && <BakerDashboard user={user} userDoc={userDoc} />}
      {role === 'customer' && <CustomerDashboard user={user} userDoc={userDoc} />}

      <div className="flex justify-center pt-8">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Esci
        </Button>
      </div>
    </div>
  );
}
