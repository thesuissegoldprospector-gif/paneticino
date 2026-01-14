'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Heart, ShoppingBag, Loader2, AlertTriangle, FileText, Pencil, X, PlusCircle, Upload, Camera, Trash2, LogOut } from 'lucide-react';
import { useUser, useDoc, useMemoFirebase, useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, DocumentData, Firestore, DocumentReference, collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


function useUserDoc(firestore: Firestore | null, userId: string | undefined) {
  const userRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  return useDoc(userRef);
}

function useBakerProfile(firestore: Firestore | null, userId: string | undefined) {
    const bakerRef = useMemoFirebase(() => {
      if (!firestore || !userId) return null;
      return doc(firestore, 'bakers', userId);
    }, [firestore, userId]);
    return useDoc(bakerRef);
  }
  
function useCustomerProfile(firestore: Firestore | null, userId: string | undefined) {
  const customerRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'customers', userId);
  }, [firestore, userId]);
  return useDoc(customerRef);
}

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Il nome è obbligatorio.'),
  lastName: z.string().min(1, 'Il cognome è obbligatorio.'),
});

const bakerProfileFormSchema = z.object({
    firstName: z.string().min(1, 'Il nome è obbligatorio.'),
    lastName: z.string().min(1, 'Il cognome è obbligatorio.'),
    companyName: z.string().min(2, { message: 'Il nome della ditta è obbligatorio.' }),
    address: z.string().min(5, { message: 'L\'indirizzo è obbligatorio.' }),
    deliveryZones: z.string().min(2, { message: 'Inserisci almeno una zona di consegna.' }),
});

const productFormSchema = z.object({
    name: z.string().min(2, "Il nome del prodotto è obbligatorio."),
    description: z.string().min(5, "La descrizione è obbligatoria."),
    price: z.string().min(1, "Il prezzo è obbligatorio."),
    imageUrl: z.string().url({ message: 'Carica un\'immagine valida.' }).or(z.literal('')),
});


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
  
  const role = userDoc?.role;

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      {role === 'baker' && bakerProfile && bakerDocRef && userDocRef ? (
        <BakerProfileDashboard 
            userProfile={userDoc} 
            bakerProfile={bakerProfile} 
            userDocRef={userDocRef} 
            bakerDocRef={bakerDocRef} 
        />
      ) : role === 'customer' && customerProfile && userDocRef ? (
        <>
            <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />
            {customerProfile && customerDocRef && <CustomerProfileDashboard profile={customerProfile} docRef={customerDocRef} />}
        </>
      ) : (
         <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />
      )}
      
      <div className="flex justify-center pt-8">
          <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Esci
          </Button>
      </div>
    </div>
  );
}

function UserProfileCard({user, userDoc, userDocRef}: {user: DocumentData, userDoc: DocumentData | null, userDocRef: DocumentReference<DocumentData> | null}) {
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        values: {
          firstName: userDoc?.firstName || '',
          lastName: userDoc?.lastName || '',
        }
    });

    const handleEditSubmit = (values: z.infer<typeof profileFormSchema>) => {
        if (!userDocRef) return;
        updateDocumentNonBlocking(userDocRef, values);
        toast({ title: 'Profilo aggiornato!' });
        setIsEditing(false);
    };

    return (
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
    );
}

const ImageUrlFormSchema = z.object({
    url: z.string().url({ message: "Inserisci un URL valido." }).or(z.literal('')),
});

function UpdateImageDialog({ onUpdate, fieldName, currentUrl, children }: { onUpdate: (fieldName: string, url: string) => void; fieldName: 'profilePictureUrl' | 'coverPhotoUrl'; currentUrl: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof ImageUrlFormSchema>>({
        resolver: zodResolver(ImageUrlFormSchema),
        defaultValues: { url: '' },
    });

    useEffect(() => {
        if (open) {
            setPreview(currentUrl);
            form.setValue('url', currentUrl);
        }
    }, [open, currentUrl, form]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setPreview(dataUrl);
                form.setValue('url', dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraClick = () => {
        toast({
            title: "Funzione in arrivo!",
            description: "La possibilità di usare la fotocamera sarà disponibile a breve.",
        });
    }

    const handleSubmit = (values: z.infer<typeof ImageUrlFormSchema>) => {
        onUpdate(fieldName, values.url);
        setOpen(false);
        form.reset();
        setPreview(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Aggiorna immagine</DialogTitle>
                    <DialogDescription>
                        Carica un'immagine dal tuo dispositivo, usa la fotocamera o incolla un URL.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-md bg-muted">
                    {preview ? (
                        <Image src={preview} alt="Anteprima immagine" fill objectFit="cover" />
                     ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                            Anteprima immagine
                        </div>
                     )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2" /> Carica File
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                    <Button variant="outline" onClick={handleCameraClick}>
                        <Camera className="mr-2" /> Fotocamera
                    </Button>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Oppure incolla un URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://esempio.com/immagine.jpg" {...field} 
                                          onChange={(e) => {
                                            field.onChange(e);
                                            setPreview(e.target.value);
                                          }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Salva</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const ImagePicker = forwardRef<HTMLInputElement, any>(
  ({ value, onChange, className, ...props }, ref) => {
    const [preview, setPreview] = useState(value);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
      setPreview(value);
    }, [value]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setPreview(dataUrl);
          onChange(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    };
    
    const handleCameraClick = () => {
        toast({
            title: "Funzione in arrivo!",
            description: "La possibilità di usare la fotocamera sarà disponibile a breve.",
        });
    }

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const url = event.target.value;
      setPreview(url);
      onChange(url);
    };

    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md border bg-muted">
            {preview ? (
                <Image src={preview} alt="Anteprima immagine prodotto" fill objectFit="cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Anteprima
                </div>
            )}
        </div>
         <div className="flex gap-2">
             <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload /> Carica
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
             <Button type="button" variant="outline" size="sm" onClick={handleCameraClick}>
                <Camera /> Fotocamera
            </Button>
        </div>
        <div>
            <Input
                type="text"
                placeholder="Oppure incolla un URL"
                value={value || ''}
                onChange={handleUrlChange}
                className="mt-2"
                {...props}
            />
        </div>
      </div>
    );
  }
);
ImagePicker.displayName = 'ImagePicker';

function BakerProfileDashboard({ userProfile, bakerProfile, userDocRef, bakerDocRef }: { userProfile: DocumentData, bakerProfile: DocumentData, userDocRef: DocumentReference<DocumentData>, bakerDocRef: DocumentReference<DocumentData> }) {
  
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const productsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'products'), where('bakerId', '==', user.uid));
    }, [firestore, user]);

    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
    
    const profileForm = useForm<z.infer<typeof bakerProfileFormSchema>>({
        resolver: zodResolver(bakerProfileFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            companyName: '',
            address: '',
            deliveryZones: '',
        }
    });

    const productForm = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { name: '', description: '', price: '', imageUrl: '' },
    });
    
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

    useEffect(() => {
        if (userProfile && bakerProfile) {
            profileForm.reset({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                companyName: bakerProfile.companyName || '',
                address: bakerProfile.address || '',
                deliveryZones: (bakerProfile.deliveryZones || []).join(', '),
            });
        }
    }, [userProfile, bakerProfile, profileForm]);

    async function onProfileSubmit(values: z.infer<typeof bakerProfileFormSchema>) {
        if (!userDocRef || !bakerDocRef) return;
        const { firstName, lastName, ...bakerData } = values;

        await Promise.all([
            updateDocumentNonBlocking(userDocRef, { firstName, lastName }),
            updateDocumentNonBlocking(bakerDocRef, {
                ...bakerData,
                deliveryZones: bakerData.deliveryZones.split(',').map(zone => zone.trim().toLowerCase()),
            })
        ]);
        
        toast({ title: 'Profilo aggiornato!', description: 'Le modifiche sono state salvate.' });
    }

    async function onProductSubmit(values: z.infer<typeof productFormSchema>) {
        if (!user || !firestore) return;
        const productsCollection = collection(firestore, 'products');
        await addDocumentNonBlocking(productsCollection, { ...values, bakerId: user.uid });
        toast({ title: 'Prodotto aggiunto!', description: `${values.name} è stato aggiunto al tuo listino.` });
        productForm.reset();
        setIsProductDialogOpen(false);
      }
    
    const handleDeleteProduct = (productId: string) => {
        if (!user || !firestore) return;
        const productRef = doc(firestore, 'products', productId);
        deleteDocumentNonBlocking(productRef);
        toast({ title: 'Prodotto eliminato', variant: 'destructive' });
    };

    const handleImageUpdate = (fieldName: string, url: string) => {
        if (!bakerDocRef) return;
        updateDocumentNonBlocking(bakerDocRef, { [fieldName]: url });
        toast({ title: 'Immagine aggiornata!' });
    };


    if (bakerProfile.approvalStatus === 'pending') {
        return (
          <Card className="mx-auto max-w-2xl text-center">
            <CardHeader>
              <CardTitle>Richiesta in attesa</CardTitle>
              <CardDescription>
                La tua richiesta per diventare panettiere è in fase di revisione. Ti avviseremo non appena sarà approvata.
              </CardDescription>
            </CardHeader>
            <CardContent><FileText className="mx-auto h-12 w-12 text-muted-foreground" /></CardContent>
          </Card>
        );
    }
    
    if (bakerProfile.approvalStatus === 'rejected') {
        return (
          <Card className="mx-auto max-w-2xl text-center border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Richiesta Rifiutata</CardTitle>
              <CardDescription>
                Siamo spiacenti, la tua richiesta non è stata approvata. Contatta il supporto per maggiori informazioni.
              </CardDescription>
            </CardHeader>
            <CardContent><AlertTriangle className="mx-auto h-12 w-12 text-destructive" /></CardContent>
          </Card>
        );
    }

    return (
        <div className="space-y-8">
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <Card>
                        <CardContent className="p-0">
                            <div className="relative h-48 w-full group">
                                {bakerProfile.coverPhotoUrl ? (
                                <Image key={bakerProfile.coverPhotoUrl} src={bakerProfile.coverPhotoUrl} alt="Immagine di copertina" fill objectFit="cover" className="rounded-t-lg" />
                                ) : (
                                <div className="flex h-full items-center justify-center rounded-t-lg text-muted-foreground bg-muted">Immagine di copertina</div>
                                )}
                                 <UpdateImageDialog onUpdate={handleImageUpdate} fieldName="coverPhotoUrl" currentUrl={bakerProfile.coverPhotoUrl || ''}>
                                    <Button variant="outline" size="icon" className="absolute top-2 right-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-4 w-4" />
                                    </Button>
                                </UpdateImageDialog>
                                <div className="absolute -bottom-16 left-6">
                                <div className="relative h-32 w-32 rounded-full border-4 border-card bg-muted flex items-center justify-center group">
                                    {bakerProfile.profilePictureUrl ? (
                                    <Image key={bakerProfile.profilePictureUrl} src={bakerProfile.profilePictureUrl} alt="Immagine profilo" fill objectFit="cover" className="rounded-full" />
                                    ) : (
                                    <span className="text-center text-xs text-muted-foreground">Immagine profilo</span>
                                    )}
                                    <UpdateImageDialog onUpdate={handleImageUpdate} fieldName="profilePictureUrl" currentUrl={bakerProfile.profilePictureUrl || ''}>
                                        <Button variant="outline" size="icon" className="absolute bottom-1 right-1 z-10 h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity rounded-full">
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </UpdateImageDialog>
                                </div>
                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-20">
                                <FormField control={profileForm.control} name="companyName" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs text-muted-foreground">Nome Attività</FormLabel><FormControl><Input placeholder="Nome della tua attività" {...field} className="text-3xl font-bold border-0 p-0 shadow-none focus-visible:ring-0" /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <p className="text-muted-foreground">{user?.email}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Modifica Dettagli</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                                    <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Mario" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                                    <FormItem><FormLabel>Cognome</FormLabel><FormControl><Input placeholder="Rossi" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={profileForm.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Indirizzo Completo</FormLabel><FormControl><Input placeholder="Via, numero civico, città, CAP" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                               
                             </div>
                            <FormField control={profileForm.control} name="deliveryZones" render={({ field }) => (
                                <FormItem><FormLabel>Zone di Consegna (separate da virgola)</FormLabel><FormControl><Textarea placeholder="Elenca le aree, i CAP o le città" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <div className="flex justify-end gap-2">
                                <Button type="submit" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salva Modifiche</Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>I Miei Prodotti</CardTitle>
                        <CardDescription>Aggiungi e gestisci i prodotti del tuo panificio.</CardDescription>
                    </div>
                     <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle /> Aggiungi Prodotto</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                             <DialogHeader>
                                <DialogTitle>Aggiungi un nuovo prodotto</DialogTitle>
                             </DialogHeader>
                             <Form {...productForm}>
                                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                                     <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Prodotto</FormLabel><FormControl><Input placeholder="Pagnotta Artigianale" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Prezzo</FormLabel><FormControl><Input placeholder="€4.50" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrizione</FormLabel><FormControl><Textarea placeholder="Breve descrizione del prodotto" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField
                                        control={productForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Immagine Prodotto</FormLabel>
                                                <FormControl>
                                                    <ImagePicker
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="submit" disabled={productForm.formState.isSubmitting}>
                                            {productForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle />}
                                            Aggiungi Prodotto
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {areProductsLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : products && products.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {products.map((product) => (
                            <Card key={product.id} className="group relative overflow-hidden">
                                {product.imageUrl ? (
                                    <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="h-32 w-full object-cover" />
                                ) : (
                                    <div className="flex h-32 w-full items-center justify-center bg-muted text-muted-foreground">
                                        <ShoppingBag className="h-8 w-8" />
                                    </div>
                                )}
                                <CardContent className="p-3">
                                    <h4 className="truncate font-bold">{product.name}</h4>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                                    <p className="mt-2 font-bold">{product.price}</p>
                                    <Button variant="destructive" size="icon" className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => handleDeleteProduct(product.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        </div>
                    ) : (
                        <p className="py-8 text-center text-muted-foreground">Non hai ancora aggiunto nessun prodotto.</p>
                    )}
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

    
