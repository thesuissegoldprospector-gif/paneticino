'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';

const profileFormSchema = z.object({
  companyName: z.string().min(2, { message: 'Il nome della ditta è obbligatorio.' }),
  address: z.string().min(5, { message: 'L\'indirizzo è obbligatorio.' }),
  deliveryZones: z.string().min(2, { message: 'Inserisci almeno una zona di consegna.' }),
  profilePictureUrl: z.string().url({ message: 'Inserisci un URL valido per l\'immagine del profilo.' }).optional().or(z.literal('')),
  coverPhotoUrl: z.string().url({ message: 'Inserisci un URL valido per l\'immagine di copertina.' }).optional().or(z.literal('')),
});

const productFormSchema = z.object({
  name: z.string().min(2, "Il nome del prodotto è obbligatorio."),
  description: z.string().min(5, "La descrizione è obbligatoria."),
  price: z.string().min(1, "Il prezzo è obbligatorio."),
  imageUrl: z.string().url({ message: 'Inserisci un URL valido per l\'immagine.' }).or(z.literal('')),
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

  const { data: bakerProfile, isLoading: isBakerLoading } = useDoc(bakerRef);

  const productsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'products'), where('bakerId', '==', user.uid));
  }, [firestore, user]);

  const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
  
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      companyName: '',
      address: '',
      deliveryZones: '',
      profilePictureUrl: '',
      coverPhotoUrl: '',
    },
  });

  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (bakerProfile) {
      profileForm.reset({
        companyName: bakerProfile.companyName || '',
        address: bakerProfile.address || '',
        deliveryZones: (bakerProfile.deliveryZones || []).join(', '),
        profilePictureUrl: bakerProfile.profilePictureUrl || '',
        coverPhotoUrl: bakerProfile.coverPhotoUrl || '',
      });
    }
  }, [bakerProfile, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
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
  }

  async function onProductSubmit(values: z.infer<typeof productFormSchema>) {
    if (!user) return;
    const productsCollection = collection(firestore, 'products');
    addDocumentNonBlocking(productsCollection, { ...values, bakerId: user.uid });

    toast({
      title: 'Prodotto aggiunto!',
      description: `${values.name} è stato aggiunto al tuo listino.`,
    });
    productForm.reset();
  }

  const handleDeleteProduct = (productId: string) => {
    if (!user) return;
    const productRef = doc(firestore, 'products', productId);
    deleteDocumentNonBlocking(productRef);
    toast({
      title: 'Prodotto eliminato',
      variant: 'destructive',
    });
  };

  const isLoading = isBakerLoading || areProductsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const { watch } = profileForm;
  const coverPhotoUrl = watch('coverPhotoUrl');
  const profilePictureUrl = watch('profilePictureUrl');
  const companyName = watch('companyName');
  
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <Card>
          <CardContent className="p-0">
             <div className="relative h-48 w-full bg-muted">
                {coverPhotoUrl ? (
                    <Image src={coverPhotoUrl} alt="Immagine di copertina" layout="fill" objectFit="cover" className="rounded-t-lg" />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Immagine di copertina</div>
                )}
                <div className="absolute -bottom-12 left-6">
                    <div className="relative h-24 w-24 rounded-full border-4 border-card bg-muted flex items-center justify-center">
                         {profilePictureUrl ? (
                            <Image src={profilePictureUrl} alt="Immagine profilo" layout="fill" objectFit="cover" className="rounded-full" />
                        ) : (
                             <span className="text-xs text-center text-muted-foreground">Immagine profilo</span>
                        )}
                    </div>
                </div>
             </div>
             <div className="pt-16 px-6 pb-6">
                <h1 className="text-3xl font-bold">{companyName || "Nome Attività"}</h1>
             </div>
          </CardContent>
      </Card>
    
      <Card>
        <CardHeader>
          <CardTitle>Modifica Profilo Attività</CardTitle>
          <CardDescription>
            Aggiorna i dettagli della tua attività che saranno visibili ai clienti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={profileForm.control} name="companyName" render={({ field }) => (
                   <FormItem>
                     <FormLabel>Nome Ditta</FormLabel>
                     <FormControl><Input placeholder="Es. Panificio Nonna Rosa" {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                  )} />
                 <FormField control={profileForm.control} name="address" render={({ field }) => (
                   <FormItem>
                     <FormLabel>Indirizzo Completo</FormLabel>
                     <FormControl><Input placeholder="Via, numero civico, città, CAP" {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                  )} />
              </div>
              <FormField control={profileForm.control} name="deliveryZones" render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone di Consegna (separate da virgola)</FormLabel>
                  <FormControl><Textarea placeholder="Elenca le aree, i CAP o le città" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={profileForm.control} name="profilePictureUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Foto Profilo</FormLabel>
                    <FormControl><Input placeholder="https://esempio.com/immagine.jpg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="coverPhotoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Foto Copertina</FormLabel>
                    <FormControl><Input placeholder="https://esempio.com/immagine.jpg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => router.push('/profile')}>Annulla</Button>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salva Modifiche</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>I Miei Prodotti</CardTitle>
          <CardDescription>Aggiungi e gestisci i prodotti del tuo panificio.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="mb-8 p-4 border rounded-lg">
             <h3 className="text-lg font-semibold mb-4">Aggiungi un nuovo prodotto</h3>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Prodotto</FormLabel>
                        <FormControl><Input placeholder="Pagnotta Artigianale" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={productForm.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prezzo</FormLabel>
                        <FormControl><Input placeholder="€4.50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={productForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl><Textarea placeholder="Breve descrizione del prodotto" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={productForm.control} name="imageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Immagine</FormLabel>
                      <FormControl><Input placeholder="https://esempio.com/immagine-prodotto.jpg" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={productForm.formState.isSubmitting}>
                    {productForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle />}
                    Aggiungi Prodotto
                  </Button>
                </form>
              </Form>
           </div>

            {products && products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden relative group">
                        <Image src={product.imageUrl || 'https://placehold.co/400x300'} alt={product.name} width={400} height={300} className="w-full h-32 object-cover" />
                        <CardContent className="p-3">
                            <h4 className="font-bold truncate">{product.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                            <p className="font-bold mt-2">{product.price}</p>
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">Non hai ancora aggiunto nessun prodotto.</p>
            )}

        </CardContent>
      </Card>
    </div>
  );
}
