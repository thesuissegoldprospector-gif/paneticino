'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const formSchema = z.object({
  firstName: z.string().min(1, { message: 'Il nome è obbligatorio.' }),
  lastName: z.string().min(1, { message: 'Il cognome è obbligatorio.' }),
  email: z.string().email({ message: 'Inserisci un\'email valida.' }),
  password: z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri.' }),
  role: z.enum(['customer', 'baker'], {
    required_error: 'Devi selezionare un ruolo.',
  }),
});

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const handleError = (error: any, message: string) => {
    console.error('Signup Error:', error);
    toast({
        variant: 'destructive',
        title: 'Errore di registrazione',
        description: message,
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
        handleError(null, 'Servizio di autenticazione non disponibile.');
        setIsLoading(false);
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {
          displayName: `${values.firstName} ${values.lastName}`
      });

      const userDocRef = doc(firestore, 'users', user.uid);
      const userData = {
        id: user.uid,
        email: values.email,
        role: values.role,
        registrationDate: new Date().toISOString(),
        firstName: values.firstName,
        lastName: values.lastName,
        photoURL: user.photoURL,
      };
      setDocumentNonBlocking(userDocRef, userData, { merge: true });

      if (values.role === 'customer') {
        const customerDocRef = doc(firestore, 'customers', user.uid);
        const customerData = {
          userId: user.uid,
          deliveryAddresses: [],
          favoriteBakeries: [],
        };
        setDocumentNonBlocking(customerDocRef, customerData, { merge: true });
        toast({
          title: 'Registrazione completata!',
          description: 'Benvenuto su PaneDelivery. Ora puoi effettuare il login.',
        });
        router.push('/login');
      } else if (values.role === 'baker') {
        // We create a pending baker profile
        const bakerDocRef = doc(firestore, 'bakers', user.uid);
        const bakerProfileData = {
            userId: user.uid,
            companyName: '',
            address: '',
            companyNumber: '',
            deliveryZones: [],
            deliveryConditions: '',
            approvalStatus: 'pending',
            profilePictureUrl: '',
            coverPhotoUrl: '',
        };
        setDocumentNonBlocking(bakerDocRef, bakerProfileData, {});
        
        toast({
          title: 'Account creato!',
          description: 'Ora compila la tua richiesta per diventare un panettiere.',
        });
        router.push('/baker-application');
      }
    } catch (error: any) {
        handleError(error, error.code === 'auth/email-already-in-use' ? 'Questa email è già in uso. Prova ad accedere.' : 'Si è verificato un errore. Riprova.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !firestore) {
        handleError(null, 'Servizio di autenticazione non disponibile.');
        return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            const [firstName, ...lastNameParts] = (user.displayName || 'Nuovo Utente').split(' ');
            const lastName = lastNameParts.join(' ');
            
            const userData = {
                id: user.uid,
                email: user.email,
                role: 'customer',
                registrationDate: new Date().toISOString(),
                firstName: firstName,
                lastName: lastName,
                photoURL: user.photoURL,
            };
            setDocumentNonBlocking(userDocRef, userData, { merge: true });

            const customerDocRef = doc(firestore, 'customers', user.uid);
            const customerData = {
                id: user.uid,
                userId: user.uid,
                deliveryAddresses: [],
                favoriteBakeries: [],
            };
            setDocumentNonBlocking(customerDocRef, customerData, { merge: true });
        }
        
        toast({
          title: 'Accesso effettuato!',
          description: 'Bentornato su PaneDelivery.',
        });
        router.push('/profile');
    } catch (error: any) {
        handleError(error, 'Impossibile registrarsi con Google. Riprova.');
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Crea un account</CardTitle>
          <CardDescription>
            Hai già un account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Accedi
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4'>
            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Registrati con Google
            </Button>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Oppure continua con
                    </span>
                </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Sei un cliente o un panettiere?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="customer" />
                            </FormControl>
                            <FormLabel className="font-normal">Sono un cliente</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="baker" />
                            </FormControl>
                            <FormLabel className="font-normal">Sono un panettiere</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Mario" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="Rossi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="lamia@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrati
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
