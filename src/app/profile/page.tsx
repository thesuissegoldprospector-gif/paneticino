'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Heart, ShoppingBag, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function useBakerProfile(firestore: Firestore, userId: string | undefined) {
  const bakerRef = useMemoFirebase(() => {
    if (!userId) return null;
    return doc(firestore, 'bakers', userId);
  }, [firestore, userId]);
  return useDoc(bakerRef);
}

function useCustomerProfile(firestore: Firestore, userId: string | undefined) {
  const customerRef = useMemoFirebase(() => {
    if (!userId) return null;
    return doc(firestore, 'customers', userId);
  }, [firestore, userId]);
  return useDoc(customerRef);
}

function useUserDoc(firestore: Firestore, userId: string | undefined) {
  const userRef = useMemoFirebase(() => {
    if (!userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  return useDoc(userRef);
}

export default function ProfilePage() {
  const { user, isUserLoading, userError } = useUser();
  const firestore = useFirestore();

  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(firestore, user?.uid);
  const { data: bakerProfile, isLoading: isBakerLoading } = useBakerProfile(firestore, user?.uid);
  const { data: customerProfile, isLoading: isCustomerLoading } = useCustomerProfile(firestore, user?.uid);

  const isLoading = isUserLoading || isUserDocLoading || isBakerLoading || isCustomerLoading;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Autenticazione richiesta</h2>
        <p className="text-muted-foreground">
          Devi effettuare l'accesso per visualizzare il tuo profilo.
        </p>
        <Button asChild>
          <Link href="/login">Vai al Login</Link>
        </Button>
      </div>
    );
  }

  const role = userDoc?.role;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8 flex flex-col items-center">
        <Avatar className="mb-4 h-24 w-24">
          <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} data-ai-hint="profile person" />
          <AvatarFallback>
            {userDoc?.firstName?.[0]}
            {userDoc?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">{userDoc?.firstName} {userDoc?.lastName}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      {role === 'baker' && bakerProfile && (
        <BakerProfileDashboard profile={bakerProfile} />
      )}

      {role === 'customer' && customerProfile && (
        <CustomerProfileDashboard profile={customerProfile} />
      )}
    </div>
  );
}


function BakerProfileDashboard({ profile }: { profile: DocumentData }) {
  if (profile.approvalStatus === 'pending') {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <CardHeader>
          <CardTitle>Richiesta in attesa</CardTitle>
          <CardDescription>
            La tua richiesta per diventare panettiere è in fase di revisione. Ti avviseremo non appena sarà approvata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
    if (profile.approvalStatus === 'rejected') {
    return (
      <Card className="mx-auto max-w-2xl text-center border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Richiesta Rifiutata</CardTitle>
          <CardDescription>
            Siamo spiacenti, la tua richiesta non è stata approvata. Contatta il supporto per maggiori informazioni.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        </CardContent>
      </Card>
    );
  }

  return (
     <div className="mx-auto grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Panettiere</CardTitle>
            <CardDescription>Gestisci i tuoi prodotti, ordini e profilo.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Stato: <span className='font-bold text-primary'>{profile.approvalStatus}</span></p>
            <p>Nome attività: {profile.companyName}</p>
            <p>Indirizzo: {profile.address}</p>
          </CardContent>
        </Card>
     </div>
  );
}


function CustomerProfileDashboard({ profile }: { profile: DocumentData }) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> I miei indirizzi
          </CardTitle>
          <CardDescription>Gestisci i tuoi indirizzi di consegna.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profile.deliveryAddresses && profile.deliveryAddresses.length > 0 ? (
                profile.deliveryAddresses.map((addr: string, i: number) => <p key={i}>{addr}</p>)
            ) : <p className='text-muted-foreground'>Nessun indirizzo salvato.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Panettieri preferiti
          </CardTitle>
          <CardDescription>I tuoi forni del cuore.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc">
             {profile.favoriteBakeries && profile.favoriteBakeries.length > 0 ? (
                profile.favoriteBakeries.map((b: string, i: number) => <li key={i}>{b}</li>)
            ) : <p className='text-muted-foreground'>Nessun panettiere preferito.</p>}
          </ul>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" /> Storico ordini
          </CardTitle>
          <CardDescription>Rivedi i tuoi ordini passati.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className='text-muted-foreground'>Nessuno storico ordini al momento.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
