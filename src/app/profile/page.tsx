'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Heart, ShoppingBag, Loader2, AlertTriangle, FileText, Pencil, X, PlusCircle } from 'lucide-react';
import { useUser, useDoc, useMemoFirebase, useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, DocumentData, Firestore, DocumentReference } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

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

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Il nome è obbligatorio.'),
  lastName: z.string().min(1, 'Il cognome è obbligatorio.'),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const { data: userDoc, isLoading: isUserDocLoading, ref: userDocRef } = useUserDoc(firestore, user?.uid);
  const { data: bakerProfile, isLoading: isBakerLoading } = useBakerProfile(firestore, user?.uid);
  const { data: customerProfile, isLoading: isCustomerLoading, ref: customerDocRef } = useCustomerProfile(firestore, user?.uid);

  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: userDoc?.firstName || '',
      lastName: userDoc?.lastName || '',
    }
  });

  const isLoading = isUserLoading || isUserDocLoading || isBakerLoading || isCustomerLoading;

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
          Devi effettuare l'accesso per visualizzare il tuo profilo.
        </p>
        <Button asChild>
          <Link href="/login">Vai al Login</Link>
        </Button>
      </div>
    );
  }

  const handleEditSubmit = (values: z.infer<typeof profileFormSchema>) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, values);
    toast({ title: 'Profilo aggiornato!' });
    setIsEditing(false);
  };

  const role = userDoc?.role;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} data-ai-hint="profile person" />
              <AvatarFallback>
                {userDoc?.firstName?.[0]}
                {userDoc?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              {!isEditing ? (
                <>
                  <h1 className="text-3xl font-bold">{userDoc?.firstName} {userDoc?.lastName}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                </>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
                     <div className="flex flex-col gap-4 sm:flex-row">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Nome</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Cognome</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                         <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Annulla</Button>
                         <Button type="submit">Salva</Button>
                      </div>
                  </form>
                </Form>
              )}
            </div>
            {!isEditing && (
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Modifica Profilo</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      {role === 'baker' && bakerProfile && (
        <BakerProfileDashboard profile={bakerProfile} />
      )}

      {role === 'customer' && customerProfile && customerDocRef && (
        <CustomerProfileDashboard profile={customerProfile} docRef={customerDocRef} />
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
          <CardContent className="space-y-4">
            <p>Stato: <span className='font-bold capitalize text-primary'>{profile.approvalStatus}</span></p>
            <p>Nome attività: {profile.companyName}</p>
            <p>Indirizzo: {profile.address}</p>
             <Button asChild>
                <Link href="/profile/edit-bakery">Modifica Profilo Attività</Link>
            </Button>
          </CardContent>
        </Card>
     </div>
  );
}


function CustomerProfileDashboard({ profile, docRef }: { profile: DocumentData, docRef: DocumentReference<DocumentData> | null}) {
  const [newAddress, setNewAddress] = useState('');
  const { toast } = useToast();

  const handleAddAddress = () => {
    if (!docRef || newAddress.trim() === '') {
      toast({ variant: 'destructive', title: 'Indirizzo non valido' });
      return;
    }
    const currentAddresses = profile.deliveryAddresses || [];
    const updatedAddresses = [...currentAddresses, newAddress];
    updateDocumentNonBlocking(docRef, { deliveryAddresses: updatedAddresses });
    setNewAddress('');
    toast({ title: 'Indirizzo aggiunto!' });
  };
  
  const handleRemoveAddress = (addressToRemove: string) => {
    if (!docRef) return;
    const updatedAddresses = profile.deliveryAddresses.filter((addr: string) => addr !== addressToRemove);
    updateDocumentNonBlocking(docRef, { deliveryAddresses: updatedAddresses });
    toast({ title: 'Indirizzo rimosso!' });
  };


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
                profile.deliveryAddresses.map((addr: string, i: number) => 
                  <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                    <span>{addr}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveAddress(addr)} className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
            ) : <p className='text-sm text-muted-foreground'>Nessun indirizzo salvato.</p>}
          </div>
           <div className="mt-4 flex gap-2">
              <Input 
                value={newAddress} 
                onChange={(e) => setNewAddress(e.target.value)} 
                placeholder="Nuovo indirizzo" 
              />
              <Button onClick={handleAddAddress}><PlusCircle className="mr-2" /> Aggiungi</Button>
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
            ) : <p className='text-sm text-muted-foreground'>Nessun panettiere preferito.</p>}
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
