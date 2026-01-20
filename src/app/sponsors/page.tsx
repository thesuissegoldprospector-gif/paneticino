'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building, CalendarCheck, Lock, Mail, ShieldCheck, UploadCloud, UserPlus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  companyName: z.string().min(2, { message: 'Il nome azienda è obbligatorio.' }),
  email: z.string().email({ message: 'Email non valida.' }),
  password: z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri.' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Email non valida.' }),
  password: z.string().min(1, { message: 'La password è obbligatoria.' }),
});

const steps = [
  {
    icon: <UserPlus className="h-8 w-8 text-primary" />,
    title: '1. Registrati',
    description: "Crea il tuo account sponsor fornendo i dati della tua azienda. L'accesso è semplice e veloce.",
  },
  {
    icon: <CalendarCheck className="h-8 w-8 text-primary" />,
    title: '2. Scegli lo Spazio',
    description: 'Naviga tra le pagine disponibili e prenota gli slot di visibilità che preferisci tramite il nostro calendario interattivo.',
  },
  {
    icon: <UploadCloud className="h-8 w-8 text-primary" />,
    title: '3. Carica il Materiale',
    description: "Invia facilmente la tua immagine promozionale, un breve testo e il link al tuo sito web direttamente dalla tua area personale.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: '4. Vai Online',
    description: "Dopo una rapida approvazione da parte del nostro team, la tua sponsorizzazione sarà attiva e visibile a migliaia di utenti.",
  },
];

function SponsorAuthForm() {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { companyName: '', email: '', password: '' },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Servizio di autenticazione non disponibile.' });
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        email: user.email,
        role: 'sponsor',
        registrationDate: new Date().toISOString(),
        firstName: values.companyName,
        lastName: '(Sponsor)',
        photoURL: '',
      }, {});

      const sponsorDocRef = doc(firestore, 'sponsors', user.uid);
      setDocumentNonBlocking(sponsorDocRef, {
        id: user.uid,
        userId: user.uid,
        companyName: values.companyName,
        approvalStatus: 'pending',
      }, {});
      
      await updateProfile(user, { displayName: values.companyName });
      
      toast({
        title: 'Richiesta Inviata!',
        description: "Il tuo account è stato creato. Verrai reindirizzato al tuo profilo.",
      });
      window.location.assign('/profile');

    } catch (error: any) {
      console.error(error);
      const message = error.code === 'auth/email-already-in-use' ? 'Questa email è già in uso.' : 'Si è verificato un errore.';
      toast({ variant: 'destructive', title: 'Errore di registrazione', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    if (!auth) {
       toast({ variant: 'destructive', title: 'Errore', description: 'Servizio di autenticazione non disponibile.' });
       setIsLoading(false);
       return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Accesso Riuscito!',
        description: 'Benvenuto! Verrai reindirizzato al tuo profilo.',
      });
      window.location.assign('/profile');
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Errore di accesso', description: 'Email o password non corretti.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{authMode === 'register' ? 'Richiedi Accesso' : 'Accedi Sponsor'}</CardTitle>
        <CardDescription>
          {authMode === 'register' ? 'Entra a far parte della nostra rete di sponsor.' : 'Accedi al tuo account sponsor.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authMode === 'register' ? (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField control={registerForm.control} name="companyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Azienda</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="La Tua Azienda SRL" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={registerForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="contatto@la-tua-azienda.ch" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={registerForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Richiedi Accesso</Button>
            </form>
          </Form>
        ) : (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="contatto@la-tua-azienda.ch" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={loginForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Accedi</Button>
            </form>
          </Form>
        )}
        <Button variant="link" className="w-full" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')} disabled={isLoading}>
          {authMode === 'register' ? 'Hai già un account? Accedi' : 'Non hai un account? Richiedi accesso'}
        </Button>
        {authMode === 'register' && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
                Il tuo account sarà in attesa di approvazione prima di poter acquistare spazi sponsor.
            </p>
        )}
      </CardContent>
    </Card>
  );
}


export default function SponsorsPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-muted/50">
        <div className="absolute inset-0">
            <Image 
                src="https://picsum.photos/seed/sponsor-hero/1920/1080"
                alt="Sponsor background"
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-10"
                data-ai-hint="business meeting"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <h1 className="font-headline text-4xl md:text-6xl text-primary">
            Spazio Sponsor
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-semibold text-foreground">
            Visibilità locale per aziende che fanno la differenza.
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">
            Entra in contatto con una clientela locale attenta alla qualità e al territorio. Con PaneDelivery, la tua azienda può guadagnare visibilità mirata, raggiungendo migliaia di utenti appassionati di prodotti artigianali, inizialmente in tutto il Ticino. La nostra piattaforma offre spazi pubblicitari esclusivi, prenotabili in modo semplice e trasparente tramite un'agenda dedicata, in attesa di approvazione da parte nostra per garantire la massima coerenza con i nostri valori.
          </p>
        </div>
      </section>

      {/* "Come funziona" Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline text-center mb-12">
            Come Funziona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center transition-transform duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    {step.icon}
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Registration/Login Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
            <SponsorAuthForm />
        </div>
      </section>
    </div>
  );
}
