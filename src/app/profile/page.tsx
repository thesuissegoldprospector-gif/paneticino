'use client';
import { useState, useEffect, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, DocumentData, Firestore, DocumentReference, collection, query, where, orderBy } from 'firebase/firestore';
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
  const userRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

function useBakerProfile(firestore: Firestore | null, userId?: string) {
  const bakerRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'bakers', userId) : null), [firestore, userId]);
  return useDoc(bakerRef);
}

function useCustomerProfile(firestore: Firestore | null, userId?: string) {
  const customerRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'customers', userId) : null), [firestore, userId]);
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

const ImageUrlFormSchema = z.object({
  url: z.string().url({ message: "Inserisci un URL valido." }).or(z.literal('')),
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


// ------------------ ImagePicker Component (ForwardRef) ------------------
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
      toast({ title: "Funzione in arrivo!", description: "La possibilità di usare la fotocamera sarà disponibile a breve.", });
    };
    
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
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Anteprima</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload /> Carica</Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <Button type="button" variant="outline" size="sm" onClick={handleCameraClick}><Camera /> Fotocamera</Button>
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



// ------------------ DIALOGS ------------------
function UpdateAvatarDialog({ user, userDocRef, children }: { user: User, userDocRef: DocumentReference | null, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'camera' | 'preview'>('select');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream;
    const getCameraPermission = async () => {
      if (step !== 'camera') return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Accesso Fotocamera Negato', description: 'Abilita i permessi per la fotocamera nelle impostazioni del browser.', });
        setStep('select');
      }
    };
    getCameraPermission();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setImageSrc(dataUrl);
      setStep('preview');
    }
  };
  
  const handleSave = async () => {
    if (imageSrc && user && userDocRef) {
      await updateUserProfileAndAuth(user, userDocRef, { photoURL: imageSrc });
      toast({ title: 'Avatar aggiornato con successo!' });
      setOpen(false);
      setTimeout(() => { setStep('select'); setImageSrc(null); }, 300);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => { setStep('select'); setImageSrc(null); setHasCameraPermission(null); }, 300);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Aggiorna Foto Profilo</DialogTitle></DialogHeader>
        {step === 'select' && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2" /> Carica File</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <Button variant="outline" onClick={() => setStep('camera')}><Camera className="mr-2" /> Usa Fotocamera</Button>
          </div>
        )}
        {step === 'camera' && (
          <div>
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <DialogFooter className="mt-4"><Button onClick={handleTakePhoto} disabled={hasCameraPermission === false}>Scatta Foto</Button></DialogFooter>
          </div>
        )}
        {step === 'preview' && imageSrc && (
          <div>
            <Image src={imageSrc} alt="Anteprima" width={400} height={300} className="w-full aspect-video rounded-md object-cover" />
            <DialogFooter className="mt-4 gap-2">
              <Button variant="ghost" onClick={() => setStep('select')}>Annulla</Button>
              <Button onClick={handleSave}>Salva Foto</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


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
        toast({ title: "Funzione in arrivo!", description: "La possibilità di usare la fotocamera sarà disponibile a breve.", });
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
                    <DialogDescription>Carica un'immagine dal tuo dispositivo, usa la fotocamera o incolla un URL.</DialogDescription>
                </DialogHeader>
                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-md bg-muted">
                    {preview ? (<Image src={preview} alt="Anteprima immagine" fill objectFit="cover" />) : (<div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Anteprima immagine</div>)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2" /> Carica File</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <Button variant="outline" onClick={handleCameraClick}><Camera className="mr-2" /> Fotocamera</Button>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="url" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Oppure incolla un URL</FormLabel>
                                <FormControl><Input placeholder="https://esempio.com/immagine.jpg" {...field} onChange={(e) => { field.onChange(e); setPreview(e.target.value); }} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter><Button type="submit">Salva</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// ------------------ PROFILE COMPONENTS ------------------
function UserProfileCard({ user, userDoc, userDocRef }: { user: User, userDoc: any, userDocRef: DocumentReference | null }) {
    const [isEditing, setIsEditing] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        values: { firstName: userDoc?.firstName || '', lastName: userDoc?.lastName || '' }
    });

    const handleEditSubmit = async (values: z.infer<typeof profileFormSchema>) => {
        if (!userDocRef || !user) return;
        await updateUserProfileAndAuth(user, userDocRef, values);
        toast({ title: 'Profilo aggiornato!' });
        setIsEditing(false);
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <UpdateAvatarDialog user={user} userDocRef={userDocRef}>
                        <div className="relative group cursor-pointer">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200`} data-ai-hint="profile person" />
                                <AvatarFallback>{userDoc?.firstName?.[0]}{userDoc?.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white h-8 w-8" />
                            </div>
                        </div>
                    </UpdateAvatarDialog>
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
                                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Cognome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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

function BakerProfileDashboard({ user, userProfile, bakerProfile, userDocRef, bakerDocRef }: { user: User, userProfile: any, bakerProfile: any, userDocRef: DocumentReference, bakerDocRef: DocumentReference }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

    const productsQuery = useMemoFirebase(() => (firestore && user ? query(collection(firestore, 'products'), where('bakerId', '==', user.uid)) : null), [firestore, user]);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);

    const profileForm = useForm<z.infer<typeof bakerProfileFormSchema>>({
        resolver: zodResolver(bakerProfileFormSchema),
        defaultValues: {
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            companyName: bakerProfile?.companyName || '',
            address: bakerProfile?.address || '',
            deliveryZones: (bakerProfile?.deliveryZones || []).join(', '),
            deliveryConditions: bakerProfile?.deliveryConditions || '',
        }
    });
    
     useEffect(() => {
        if (userProfile && bakerProfile) {
            profileForm.reset({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                companyName: bakerProfile.companyName || '',
                address: bakerProfile.address || '',
                deliveryZones: (bakerProfile.deliveryZones || []).join(', '),
                deliveryConditions: bakerProfile.deliveryConditions || '',
            });
        }
    }, [userProfile, bakerProfile, profileForm]);

    const productForm = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { name: '', description: '', price: '', imageUrl: '' },
    });

    async function onProfileSubmit(values: z.infer<typeof bakerProfileFormSchema>) {
        const { firstName, lastName, ...bakerData } = values;
        await updateUserProfileAndAuth(user, userDocRef, { firstName, lastName });
        updateDocumentNonBlocking(bakerDocRef, { ...bakerData, deliveryZones: values.deliveryZones.split(',').map(zone => zone.trim().toLowerCase()) });
        toast({ title: 'Profilo aggiornato!' });
    }

    async function onProductSubmit(values: z.infer<typeof productFormSchema>) {
        if (!firestore || !user) return;
        addDocumentNonBlocking(collection(firestore, 'products'), { ...values, bakerId: user.uid });
        toast({ title: 'Prodotto aggiunto!' });
        productForm.reset();
        setIsProductDialogOpen(false);
    }
    
    const handleDeleteProduct = (productId: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'products', productId));
        toast({ title: 'Prodotto eliminato', variant: 'destructive' });
    };

    const handleImageUpdate = (fieldName: string, url: string) => {
        updateDocumentNonBlocking(bakerDocRef, { [fieldName]: url });
        toast({ title: 'Immagine aggiornata!' });
    };

    if (bakerProfile.approvalStatus === 'pending') {
        return <Card className="text-center"><CardHeader><CardTitle>Richiesta in attesa</CardTitle><CardDescription>La tua richiesta è in revisione.</CardDescription></CardHeader><CardContent><FileText className="mx-auto h-12 w-12 text-muted-foreground" /></CardContent></Card>;
    }
    if (bakerProfile.approvalStatus === 'rejected') {
        return <Card className="text-center border-destructive"><CardHeader><CardTitle className="text-destructive">Richiesta Rifiutata</CardTitle><CardDescription>Contatta il supporto per maggiori informazioni.</CardDescription></CardHeader><CardContent><AlertTriangle className="mx-auto h-12 w-12 text-destructive" /></CardContent></Card>;
    }

    return (
        <div className="space-y-8">
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <Card>
                        <CardContent className="p-0">
                             <div className="relative h-48 w-full group">
                                {bakerProfile.coverPhotoUrl ? <Image src={bakerProfile.coverPhotoUrl} alt="Immagine di copertina" fill objectFit="cover" className="rounded-t-lg" /> : <div className="flex h-full items-center justify-center rounded-t-lg text-muted-foreground bg-muted">Immagine di copertina</div>}
                                <UpdateImageDialog onUpdate={handleImageUpdate} fieldName="coverPhotoUrl" currentUrl={bakerProfile.coverPhotoUrl || ''}><Button variant="outline" size="icon" className="absolute top-2 right-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity"><Camera className="h-4 w-4" /></Button></UpdateImageDialog>
                                <div className="absolute -bottom-16 left-6">
                                    <div className="relative h-32 w-32 rounded-full border-4 border-card bg-muted flex items-center justify-center group">
                                        {bakerProfile.profilePictureUrl ? <Image src={bakerProfile.profilePictureUrl} alt="Immagine profilo" fill objectFit="cover" className="rounded-full" /> : <span className="text-center text-xs text-muted-foreground">Immagine profilo</span>}
                                        <UpdateImageDialog onUpdate={handleImageUpdate} fieldName="profilePictureUrl" currentUrl={bakerProfile.profilePictureUrl || ''}><Button variant="outline" size="icon" className="absolute bottom-1 right-1 z-10 h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity rounded-full"><Camera className="h-4 w-4" /></Button></UpdateImageDialog>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-20">
                                <FormField control={profileForm.control} name="companyName" render={({ field }) => (<FormItem><FormLabel className="text-xs text-muted-foreground">Nome Attività</FormLabel><FormControl><Input placeholder="Nome della tua attività" {...field} className="text-3xl font-bold border-0 p-0 shadow-none focus-visible:ring-0" /></FormControl><FormMessage /></FormItem>)} />
                                <p className="text-muted-foreground">{user?.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Modifica Dettagli</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormField control={profileForm.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Mario" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={profileForm.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Cognome</FormLabel><FormControl><Input placeholder="Rossi" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={profileForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Indirizzo Completo</FormLabel><FormControl><Input placeholder="Via, numero civico, città, CAP" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={profileForm.control} name="deliveryZones" render={({ field }) => (<FormItem><FormLabel>Zone di Consegna (separate da virgola)</FormLabel><FormControl><Textarea placeholder="Elenca le aree, i CAP o le città" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={profileForm.control} name="deliveryConditions" render={({ field }) => (<FormItem><FormLabel>Condizioni di Consegna</FormLabel><FormControl><Textarea placeholder="Es. Ordine minimo 10€..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <div className="flex justify-end gap-2">
                                <Button type="submit" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salva Modifiche</Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>

            <BakerOrdersDashboard user={user} userDoc={userProfile} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>I Miei Prodotti</CardTitle><CardDescription>Aggiungi e gestisci i prodotti.</CardDescription></div>
                    <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                        <DialogTrigger asChild><Button><PlusCircle /> Aggiungi Prodotto</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Aggiungi un nuovo prodotto</DialogTitle></DialogHeader>
                            <Form {...productForm}>
                                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                                    <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Prodotto</FormLabel><FormControl><Input placeholder="Pagnotta Artigianale" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Prezzo</FormLabel><FormControl><Input placeholder="€4.50" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrizione</FormLabel><FormControl><Textarea placeholder="Breve descrizione..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={productForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Immagine Prodotto</FormLabel><FormControl><ImagePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                                    <DialogFooter><Button type="submit" disabled={productForm.formState.isSubmitting}>{productForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />} Aggiungi</Button></DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {areProductsLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : products && products.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {products.map((product) => (
                                <Card key={product.id} className="group relative overflow-hidden">
                                    {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="h-32 w-full object-cover" /> : <div className="flex h-32 w-full items-center justify-center bg-muted"><ShoppingBag /></div>}
                                    <CardContent className="p-3">
                                        <h4 className="truncate font-bold">{product.name}</h4>
                                        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                                        <p className="mt-2 font-bold">{product.price}</p>
                                        <Button variant="destructive" size="icon" className="absolute right-2 top-2 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : <p className="py-8 text-center text-muted-foreground">Nessun prodotto aggiunto.</p>}
                </CardContent>
            </Card>
        </div>
    );
}

function CustomerProfileDashboard({ user, userDoc, profile, docRef }: { user: User, userDoc: any, profile: any, docRef: DocumentReference | null }) {
    const [newAddress, setNewAddress] = useState('');
    const { toast } = useToast();

    const handleAddAddress = () => {
        if (!docRef || newAddress.trim() === '') return toast({ variant: 'destructive', title: 'Indirizzo non valido' });
        const updatedAddresses = [...(profile.deliveryAddresses || []), newAddress];
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
        <div className="grid max-w-4xl gap-6 md:grid-cols-2 mx-auto">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin /> I miei indirizzi</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {profile.deliveryAddresses?.length > 0 ? profile.deliveryAddresses.map((addr: string, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                                <span>{addr}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveAddress(addr)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        )) : <p className='text-sm text-muted-foreground'>Nessun indirizzo salvato.</p>}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Nuovo indirizzo" />
                        <Button onClick={handleAddAddress}><PlusCircle /> Aggiungi</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Heart /> Panettieri preferiti</CardTitle></CardHeader>
                <CardContent>
                    {profile.favoriteBakeries?.length > 0 ? <ul>{profile.favoriteBakeries.map((b: string) => <li key={b}>{b}</li>)}</ul> : <p className='text-sm text-muted-foreground'>Nessun panettiere preferito.</p>}
                </CardContent>
            </Card>
            <CustomerOrdersDashboard user={user} userDoc={userDoc} />
        </div>
    );
}

// ------------------ ORDERS DASHBOARDS ------------------
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'In attesa', color: 'bg-yellow-500', icon: Loader2 },
    accepted: { label: 'Accettato', color: 'bg-blue-500', icon: ThumbsUp },
    preparing: { label: 'In preparazione', color: 'bg-indigo-500', icon: Package },
    delivering: { label: 'In consegna', color: 'bg-purple-500', icon: Truck },
    completed: { label: 'Completato', color: 'bg-green-500', icon: Check },
    rejected: { label: 'Rifiutato', color: 'bg-red-500', icon: ThumbsDown },
};

function OrderStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-500', icon: 'HelpCircle' };
    const Icon = config.icon;
    return (
        <Badge className={cn("text-white whitespace-nowrap", config.color)}>
            <Icon className="mr-1 h-3 w-3" /> {config.label}
        </Badge>
    );
}

function BakerOrdersDashboard({ user, userDoc }: { user: User, userDoc: any }) {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(() => (
        (firestore && user && userDoc?.role === 'baker')
            ? query(collection(firestore, 'orders'), where('bakerId', '==', user.uid), orderBy('createdAt', 'desc'))
            : null
    ), [firestore, user, userDoc]);
    const { data: orders, isLoading } = useCollection(ordersQuery);

    const handleUpdateStatus = (orderId: string, newStatus: string) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'orders', orderId), { status: newStatus });
    };

    return (
        <Card>
            <CardHeader><CardTitle>Dashboard Ordini</CardTitle><CardDescription>Visualizza e gestisci gli ordini.</CardDescription></CardHeader>
            <CardContent>
                {isLoading && <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}
                {!isLoading && (!orders || orders.length === 0) && <p className="text-center text-muted-foreground py-8">Nessun ordine ricevuto.</p>}
                {orders && orders.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                        {orders.map(order => (
                            <AccordionItem value={order.id} key={order.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4 items-center">
                                        <div className="text-left">
                                            <p className="font-semibold">Ordine da {order.customerName}</p>
                                            <p className="text-sm text-muted-foreground">{format(order.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: it })}</p>
                                        </div>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Dettagli Cliente</h4>
                                        <p><strong>Cliente:</strong> {order.customerName}</p>
                                        <p><strong>Indirizzo:</strong> {order.deliveryAddress}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Articoli</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {order.items.map((item: any, index: number) => <li key={index}>{item.quantity}x {item.name} - {(item.price * item.quantity).toFixed(2)}€</li>)}
                                        </ul>
                                        <p className="font-bold text-right mt-2">Totale: {order.total.toFixed(2)}€</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
                                        {order.status === 'pending' && (<><Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'rejected')}><ThumbsDown /> Rifiuta</Button><Button size="sm" onClick={() => handleUpdateStatus(order.id, 'accepted')}><ThumbsUp /> Accetta</Button></>)}
                                        {order.status === 'accepted' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'preparing')}><Package /> Prepara</Button>}
                                        {order.status === 'preparing' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'delivering')}><Truck /> In Consegna</Button>}
                                        {order.status === 'delivering' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'completed')}><Check /> Completato</Button>}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}

function CustomerOrdersDashboard({ user, userDoc }: { user: User, userDoc: any }) {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(() => (
        (firestore && user && userDoc?.role === 'customer')
            ? query(collection(firestore, 'orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'))
            : null
    ), [firestore, user, userDoc]);
    const { data: orders, isLoading } = useCollection(ordersQuery);

    return (
        <Card className="md:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag /> Storico ordini</CardTitle><CardDescription>Rivedi i tuoi ordini.</CardDescription></CardHeader>
            <CardContent>
                {isLoading && <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}
                {!isLoading && (!orders || orders.length === 0) && <p className="text-center text-muted-foreground py-8">Nessun ordine effettuato.</p>}
                {orders && orders.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                        {orders.map(order => (
                            <AccordionItem value={order.id} key={order.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4 items-center">
                                        <div className="text-left">
                                            <p className="font-semibold">Ordine da {order.bakerName || 'Panettiere'}</p>
                                            <p className="text-sm text-muted-foreground">{format(order.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: it })}</p>
                                        </div>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <ul className="list-disc pl-5 space-y-1 text-sm">
                                        {order.items.map((item: any, index: number) => <li key={index}>{item.quantity}x {item.name}</li>)}
                                    </ul>
                                    <p className="font-bold text-right mt-2">Totale: {order.total.toFixed(2)}€</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
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

  if (isLoading) return <div className="flex h-full min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 py-16 text-center">
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
      {/* User Profile */}
      {user && userDocRef && <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />}

      {/* Baker Dashboard */}
      {role === 'baker' && bakerProfile && bakerDocRef && userDocRef && user && userDoc && (
        <BakerProfileDashboard 
          user={user} 
          userProfile={userDoc} 
          bakerProfile={bakerProfile} 
          userDocRef={userDocRef} 
          bakerDocRef={bakerDocRef} 
        />
      )}

      {/* Customer Dashboard */}
      {role === 'customer' && customerProfile && customerDocRef && user && userDoc && (
        <CustomerProfileDashboard 
          user={user} 
          userDoc={userDoc} 
          profile={customerProfile} 
          docRef={customerDocRef} 
        />
      )}

      {/* Logout */}
      <div className="flex justify-center pt-8">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Esci
        </Button>
      </div>
    </div>
  );
}