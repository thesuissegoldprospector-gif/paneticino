'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Errore',
            description: 'Servizio di autenticazione non disponibile.',
        });
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
          id: user.uid,
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
            id: user.uid,
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
      console.error('Signup Error:', error);
      toast({
        variant: 'destructive',
        title: 'Errore di registrazione',
        description: error.code === 'auth/email-already-in-use'
          ? 'Questa email è già in uso. Prova ad accedere.'
          : 'Si è verificato un errore. Riprova.',
      });
    } finally {
      setIsLoading(false);
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrati
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
