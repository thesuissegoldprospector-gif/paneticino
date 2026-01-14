'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, DocumentReference, Firestore, collection, query, where, orderBy } from 'firebase/firestore';
import { getAuth, signOut, updateProfile, User } from 'firebase/auth';
import { Loader2, AlertTriangle, LogOut, Pencil, Camera, Upload, PlusCircle, Trash2, FileText, Heart, MapPin, ShoppingBag, Package, ThumbsUp, ThumbsDown, Truck, Check } from 'lucide-react';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

// ------------------ HOOKS ------------------
function useUserDoc(firestore: Firestore | null, userId?: string) {
  const userRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId) : undefined), [firestore, userId]);
  return useDoc(userRef);
}

function useBakerProfile(firestore: Firestore | null, userId?: string) {
  const bakerRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'bakers', userId) : undefined), [firestore, userId]);
  return useDoc(bakerRef);
}

function useCustomerProfile(firestore: Firestore | null, userId?: string) {
  const customerRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'customers', userId) : undefined), [firestore, userId]);
  return useDoc(customerRef);
}

// ------------------ SCHEMAS ------------------
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Il nome è obbligatorio.'),
  lastName: z.string().min(1, 'Il cognome è obbligatorio.'),
});

const bakerProfileFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(2),
  address: z.string().min(5),
  deliveryZones: z.string().min(2),
  deliveryConditions: z.string().optional(),
});

const productFormSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.string().min(1),
  imageUrl: z.string().url().or(z.literal('')),
});

// ------------------ UTILS ------------------
async function updateUserProfileAndAuth(user: User, userDocRef: DocumentReference, data: any) {
  if (!user || !userDocRef) return;
  const authUpdates: any = {};
  const firestoreUpdates: any = {};

  if (data.firstName && data.lastName) {
    const displayName = `${data.firstName} ${data.lastName}`;
    if (user.displayName !== displayName) authUpdates.displayName = displayName;
    firestoreUpdates.firstName = data.firstName;
    firestoreUpdates.lastName = data.lastName;
  }

  if (data.photoURL && user.photoURL !== data.photoURL) {
    authUpdates.photoURL = data.photoURL;
    firestoreUpdates.photoURL = data.photoURL;
  }

  if (Object.keys(authUpdates).length > 0) await updateProfile(user, authUpdates);
  if (Object.keys(firestoreUpdates).length > 0) updateDocumentNonBlocking(userDocRef, firestoreUpdates);
}

// ------------------ MAIN PAGE ------------------
export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const { data: userDoc, isLoading: isUserDocLoading, ref: userDocRef } = useUserDoc(firestore, user?.uid);
  const { data: bakerProfile, isLoading: isBakerLoading, ref: bakerDocRef } = useBakerProfile(firestore, user?.uid);
  const { data: customerProfile, isLoading: isCustomerLoading, ref: customerDocRef } = useCustomerProfile(firestore, user?.uid);

  const isLoading = isUserLoading || isUserDocLoading || isBakerLoading || isCustomerLoading;

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/');
  };

  if (isLoading) return <div className="flex h-full min-h-[400px] w-full items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Autenticazione richiesta</h2>
        <p className="text-muted-foreground">Devi effettuare l'accesso per visualizzare il tuo profilo.</p>
        <Button asChild><Link href="/login">Vai al Login</Link></Button>
      </div>
    );
  }

  const role = userDoc?.role;

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      {user && userDocRef && <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />}

      {role === 'baker' && bakerProfile && bakerDocRef && userDocRef && user && userDoc ? (
        <BakerProfileDashboard 
          user={user}
          userProfile={userDoc} 
          bakerProfile={bakerProfile} 
          userDocRef={userDocRef} 
          bakerDocRef={bakerDocRef} 
        />
      ) : role === 'customer' && customerProfile && customerDocRef && user && userDoc ? (
        <CustomerProfileDashboard user={user} userDoc={userDoc} profile={customerProfile} docRef={customerDocRef} />
      ) : null }
      
      <div className="flex justify-center pt-8">
          <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Esci
          </Button>
      </div>
    </div>
  );
}

// Placeholder for other components that might be in the same file
// Note: In a real scenario, these would likely be in their own files.

function UserProfileCard({ user, userDoc, userDocRef }: { user: User; userDoc: any; userDocRef: DocumentReference }) {
  // ... implementation needed
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profilo Utente</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Email: {user.email}</p>
        <p>Nome: {userDoc?.firstName} {userDoc?.lastName}</p>
      </CardContent>
    </Card>
  );
}

function BakerProfileDashboard({ user, userProfile, bakerProfile, userDocRef, bakerDocRef }: { user: User; userProfile: any; bakerProfile: any; userDocRef: DocumentReference; bakerDocRef: DocumentReference }) {
   // ... implementation needed
  return <Card><CardHeader><CardTitle>Dashboard Panettiere</CardTitle></CardHeader><CardContent><p>Contenuti per il panettiere...</p></CardContent></Card>;
}

function CustomerProfileDashboard({ user, userDoc, profile, docRef }: { user: User; userDoc: any; profile: any; docRef: DocumentReference | null }) {
   // ... implementation needed
  return <Card><CardHeader><CardTitle>Dashboard Cliente</CardTitle></CardHeader><CardContent><p>Contenuti per il cliente...</p></CardContent></Card>;
}