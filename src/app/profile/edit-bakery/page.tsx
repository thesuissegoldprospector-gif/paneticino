'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const formSchema = z.object({
  companyName: z.string().min(2, { message: 'Il nome della ditta è obbligatorio.' }),
  address: z.string().min(5, { message: 'L\'indirizzo è obbligatorio.' }),
  deliveryZones: z.string().min(2, { message: 'Inserisci almeno una zona di consegna.' }),
  profilePictureUrl: z.string().url({ message: 'Inserisci un URL valido.' }).optional().or(z.literal('')),
  coverPhotoUrl: z.string().url({ message: 'Inserisci un URL valido.' }).optional().or(z.literal('')),
});

export default function EditBakerProfilePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const bakerRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'bakers', user.uid);
  }, [firestore, user]);

  const { data: bakerProfile, isLoading } = useDoc(bakerRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      address: '',
      deliveryZones: '',
      profilePictureUrl: '',
      coverPhotoUrl: '',
    },
  });

  useEffect(() => {
    if (bakerProfile) {
      form.reset({
        companyName: bakerProfile.companyName || '',
        address: bakerProfile.address || '',
        deliveryZones: (bakerProfile.deliveryZones || []).join(', '),
        profilePictureUrl: bakerProfile.profilePictureUrl || '',
        coverPhotoUrl: bakerProfile.coverPhotoUrl || '',
      });
    }
  }, [bakerProfile, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!bakerRef) return;

    const profileData = {
      ...values,
      deliveryZones: values.deliveryZones.split(',').map(zone => zone.trim()),
    };

    updateDocumentNonBlocking(bakerRef, profileData);

    toast({
      title: 'Profilo aggiornato!',
      description: 'Le modifiche al profilo della tua attività sono state salvate.',
    });

    router.push('/profile');
  }

  if (isLoading) {
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
          <CardTitle>Modifica Profilo Attività</CardTitle>
          <CardDescription>
            Aggiorna i dettagli della tua attività che saranno visibili ai clienti.
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
               <FormField
                control={form.control}
                name="profilePictureUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Foto Profilo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://esempio.com/immagine.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="coverPhotoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Foto Copertina</FormLabel>
                    <FormControl>
                      <Input placeholder="https://esempio.com/immagine.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => router.push('/profile')}>
                  Annulla
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salva Modifiche
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}