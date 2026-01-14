'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  companyName: z.string().min(2, { message: 'Il nome della ditta è obbligatorio.' }),
  address: z.string().min(5, { message: 'L\'indirizzo è obbligatorio.' }),
  companyNumber: z.string().min(5, { message: 'Il numero aziendale è obbligatorio.' }),
  deliveryZones: z.string().min(2, { message: 'Inserisci almeno una zona di consegna.' }),
});

export default function BakerApplicationPage() {
  const { user, isUserLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      address: '',
      companyNumber: '',
      deliveryZones: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Devi essere loggato per inviare la richiesta.',
      });
      return;
    }

    const bakerProfileData = {
      userId: user.uid,
      companyName: values.companyName,
      address: values.address,
      companyNumber: values.companyNumber,
      deliveryZones: values.deliveryZones.split(',').map(zone => zone.trim()),
      approvalStatus: 'pending',
      // Add empty fields for profilePictureUrl and coverPhotoUrl
      profilePictureUrl: '',
      coverPhotoUrl: '',
    };

    const bakerDocRef = doc(firestore, 'bakers', user.uid);
    setDocumentNonBlocking(bakerDocRef, bakerProfileData, {});

    toast({
      title: 'Richiesta inviata!',
      description: 'La tua richiesta è stata inviata e sarà revisionata a breve.',
    });

    router.push('/profile');
  }
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Richiesta di Approvazione Panettiere</CardTitle>
          <CardDescription>
            Completa il modulo sottostante con i dettagli della tua attività. Il tuo profilo sarà revisionato dal nostro team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Ditta</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Panificio Nonna Rosa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Via, numero civico, città, CAP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita IVA / Codice Fiscale</FormLabel>
                    <FormControl>
                      <Input placeholder="Il tuo numero aziendale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryZones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone di Consegna</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Elenca le aree, i CAP o le città separate da virgola"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separa ogni zona con una virgola.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Invia Richiesta
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
