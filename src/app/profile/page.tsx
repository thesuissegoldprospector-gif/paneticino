'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, DocumentReference, Firestore, collection, query, where, orderBy, DocumentData } from 'firebase/firestore';
import { getAuth, signOut, updateProfile, User } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, Storage } from "firebase/storage";
import { Loader2, AlertTriangle, LogOut, Pencil, Camera, Upload, PlusCircle, Trash2, FileText, Heart, MapPin, ShoppingBag, Package, ThumbsUp, ThumbsDown, Truck, Check, Image as ImageIcon, Link2, Shield } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, useFirebase } from '@/firebase';

const placeholderImages = [
    'https://picsum.photos/seed/bread1/400/300',
    'https://picsum.photos/seed/bread2/400/300',
    'https://picsum.photos/seed/bread3/400/300',
    'https://picsum.photos/seed/bread4/400/300',
];


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

function useAdminRole(firestore: Firestore | null, userId?: string) {
    const adminRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'roles_admin', userId) : null), [firestore, userId]);
    return useDoc(adminRef);
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
  name: z.string().min(2, { message: "Il nome del prodotto è obbligatorio." }),
  description: z.string().min(5, { message: "La descrizione è obbligatoria." }),
  price: z.string().min(1, { message: "Il prezzo è obbligatorio." }),
  imageUrl: z.string().url({ message: "L'URL dell'immagine non è valido." }).or(z.literal('')),
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


// ------------------ DIALOGS ------------------
function UpdateAvatarDialog({ user, userDocRef, children }: { user: User, userDocRef: DocumentReference | null, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { storage } = useFirebase(); // Use hook to get storage instance

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    if (!imageFile || !user || !userDocRef || !storage) {
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile caricare: servizio non disponibile o dati mancanti.' });
        return;
    }
    
    setIsUploading(true);
    try {
        const imageRef = storageRef(storage, `avatars/${user.uid}/${Date.now()}_${imageFile.name}`);
        
        const snapshot = await uploadBytes(imageRef, imageFile);
        const downloadURL = await getDownloadURL(snapshot.ref);

        await updateUserProfileAndAuth(user, userDocRef, { photoURL: downloadURL });
        toast({ title: 'Avatar aggiornato con successo!' });
        setOpen(false);
        setImageSrc(null);
        setImageFile(null);
    } catch (error) {
        console.error("Error uploading image: ", error);
        toast({ variant: 'destructive', title: 'Errore di Caricamento', description: 'Controlla la configurazione di CORS e le regole di Storage.' });
    } finally {
        setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiorna Foto Profilo</DialogTitle>
          <DialogDescription id="update-avatar-description">
            Carica una nuova immagine per il tuo profilo. Verrà visualizzata pubblicamente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4" aria-describedby="update-avatar-description">
            <Input type="file" onChange={handleFileChange} accept="image/*" />
            {imageSrc && <Image src={imageSrc} alt="Anteprima" width={200} height={200} className="mt-4 rounded-md" />}
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={handleSave} disabled={!imageFile || isUploading}>
            {isUploading ? <Loader2 className="animate-spin" /> : 'Salva Foto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    if (!dataurl || !dataurl.includes(',')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    try {
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("Error converting data URL to file:", e);
        return null;
    }
}

function UpdateImageDialog({ onUpdate, currentUrl, children }: { onUpdate: (url: string) => void; currentUrl?: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [sourceForUpload, setSourceForUpload] = useState<'file' | 'camera' | 'gallery' | 'link' | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { toast } = useToast();
    const { user, storage } = useFirebase();

    useEffect(() => {
        if (open) {
            const initialUrl = currentUrl || '';
            setPreviewUrl(initialUrl);
            setLinkUrl(initialUrl);
            setImageFile(null);
            setSourceForUpload(null);
        }
        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [open, currentUrl]);
    
    const handleCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Camera non accessibile', description: 'Permesso negato o camera non trovata.' });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setSourceForUpload('file');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setPreviewUrl(dataUrl);
                setSourceForUpload('camera');
                const file = dataURLtoFile(dataUrl, 'capture.jpg');
                if (file) setImageFile(file);
                
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        if (!user || !storage) throw new Error("Utente non autenticato o servizio di storage non disponibile.");
        
        const imageRef = storageRef(storage, `images/${user.uid}/${Date.now()}_${file.name}`);
        
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
    };
    
    const handleSubmit = async () => {
        setIsUploading(true);
        try {
            let finalUrl = '';

            if (imageFile) {
                finalUrl = await uploadImage(imageFile);
            } else if (sourceForUpload === 'link' && linkUrl) {
                finalUrl = linkUrl;
            } else {
                 toast({ variant: 'destructive', title: 'Nessuna immagine selezionata', description: 'Seleziona un file o fornisci un link.' });
                 setIsUploading(false);
                 return;
            }
            onUpdate(finalUrl);
            setOpen(false);
        } catch (error: any) {
            console.error("Error handling image: ", error);
             let description = 'Impossibile salvare l\'immagine. Controlla la console per i dettagli.';
            if (error.code === 'storage/unauthorized') {
                description = 'Non hai i permessi per caricare. Controlla le regole di CORS e di Firebase Storage.';
            } else if (error.code === 'storage/object-not-found') {
                description = 'File non trovato. Potrebbe essere un problema di rete.';
            }
            toast({ variant: 'destructive', title: 'Errore di caricamento', description });
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleSetUrlFromGallery = (url: string) => {
        setPreviewUrl(url);
        // We will treat picsum photos as links as they are not base64
        setLinkUrl(url);
        setImageFile(null);
        setSourceForUpload('link');
    }
    
    const handleSetUrlFromLink = (url: string) => {
        setPreviewUrl(url);
        setLinkUrl(url);
        setImageFile(null);
        setSourceForUpload('link');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Aggiorna immagine</DialogTitle>
                  <DialogDescription id="update-image-description">
                    Scegli un'immagine caricandola dal tuo dispositivo, usando un link, scattando una foto o selezionandola dalla galleria.
                  </DialogDescription>
                </DialogHeader>
                <div aria-describedby="update-image-description">
                  <Tabs defaultValue="upload">
                      <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="upload"><Upload />Carica</TabsTrigger>
                          <TabsTrigger value="url"><Link2 />URL</TabsTrigger>
                          <TabsTrigger value="gallery"><ImageIcon />Galleria</TabsTrigger>
                          <TabsTrigger value="camera" onClick={handleCamera}><Camera />Camera</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="py-4 space-y-4">
                          <Input type="file" onChange={handleFileChange} accept="image/*" />
                      </TabsContent>
                      <TabsContent value="url" className="py-4 space-y-4">
                          <Input placeholder="https://esempio.com/immagine.jpg" value={linkUrl} onChange={(e) => handleSetUrlFromLink(e.target.value)} />
                      </TabsContent>
                      <TabsContent value="gallery" className="py-4">
                          <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                              {placeholderImages.map(imgUrl => (
                                  <div key={imgUrl} className="relative aspect-video cursor-pointer" onClick={() => handleSetUrlFromGallery(imgUrl)}>
                                      <Image src={imgUrl} alt="Placeholder" fill objectFit="cover" className={cn("rounded-md", previewUrl === imgUrl && (sourceForUpload === 'gallery' || sourceForUpload === 'link') && "ring-2 ring-primary ring-offset-2")}/>
                                  </div>
                              ))}
                          </div>
                      </TabsContent>
                      <TabsContent value="camera" className="py-4 space-y-4">
                          <video ref={videoRef} className="w-full aspect-video bg-muted rounded-md" autoPlay playsInline muted />
                          <canvas ref={canvasRef} className="hidden"/>
                          <Button onClick={handleCapture} disabled={!videoRef.current?.srcObject}>Scatta Foto</Button>
                      </TabsContent>
                  </Tabs>
                  {previewUrl && (
                      <div className='py-4'>
                          <p className='text-sm font-medium mb-2'>Anteprima:</p>
                          <Image src={previewUrl} alt="Anteprima" width={200} height={200} className="rounded-md object-cover mx-auto" />
                      </div>
                  )}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSubmit} disabled={isUploading || !previewUrl}>
                        {isUploading ? <Loader2 className="animate-spin" /> : 'Salva'}
                    </Button>
                </DialogFooter>
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

function BakerProfileDashboard({ user, userProfile, bakerProfile, userDocRef, bakerDocRef, orders, areOrdersLoading, products, areProductsLoading }: { user: User, userProfile: any, bakerProfile: any, userDocRef: DocumentReference, bakerDocRef: DocumentReference, orders: any[] | null, areOrdersLoading: boolean, products: any[] | null, areProductsLoading: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

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

    const handleImageUpdate = (fieldName: 'profilePictureUrl' | 'coverPhotoUrl', url: string) => {
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
                                <UpdateImageDialog onUpdate={(url) => handleImageUpdate('coverPhotoUrl', url)} currentUrl={bakerProfile.coverPhotoUrl || ''}><Button variant="outline" size="icon" className="absolute top-2 right-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity"><Camera className="h-4 w-4" /></Button></UpdateImageDialog>
                                <div className="absolute -bottom-16 left-6">
                                    <div className="relative h-32 w-32 rounded-full border-4 border-card bg-muted flex items-center justify-center group">
                                        {bakerProfile.profilePictureUrl ? <Image src={bakerProfile.profilePictureUrl} alt="Immagine profilo" fill objectFit="cover" className="rounded-full" /> : <span className="text-center text-xs text-muted-foreground">Immagine profilo</span>}
                                        <UpdateImageDialog onUpdate={(url) => handleImageUpdate('profilePictureUrl', url)} currentUrl={bakerProfile.profilePictureUrl || ''}><Button variant="outline" size="icon" className="absolute bottom-1 right-1 z-10 h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity rounded-full"><Camera className="h-4 w-4" /></Button></UpdateImageDialog>
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

            <BakerOrdersDashboard user={user} userDoc={userProfile} orders={orders} isLoading={areOrdersLoading} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>I Miei Prodotti</CardTitle><CardDescription>Aggiungi e gestisci i prodotti.</CardDescription></div>
                    <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                        <DialogTrigger asChild><Button><PlusCircle /> Aggiungi Prodotto</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Aggiungi un nuovo prodotto</DialogTitle>
                                <DialogDescription id="add-product-description">
                                  Compila i dettagli del prodotto e aggiungi un'immagine per mostrarlo al meglio.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...productForm}>
                                <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4" aria-describedby="add-product-description">
                                    <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Prodotto</FormLabel><FormControl><Input placeholder="Pagnotta Artigianale" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Prezzo</FormLabel><FormControl><Input placeholder="€4.50" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrizione</FormLabel><FormControl><Textarea placeholder="Breve descrizione..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    
                                    <FormField
                                        control={productForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Immagine Prodotto</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative h-24 w-24 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                                            {field.value ? <Image src={field.value} alt="Anteprima prodotto" fill objectFit="cover" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                                                        </div>
                                                        <UpdateImageDialog onUpdate={(url) => field.onChange(url)} currentUrl={field.value}>
                                                            <Button type="button" variant="outline">Cambia Immagine</Button>
                                                        </UpdateImageDialog>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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

function CustomerProfileDashboard({ user, userDoc, profile, docRef, orders, areOrdersLoading }: { user: User, userDoc: any, profile: any, docRef: DocumentReference | null, orders: any[] | null, areOrdersLoading: boolean }) {
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
            <CustomerOrdersDashboard user={user} userDoc={userDoc} orders={orders} isLoading={areOrdersLoading} />
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

function BakerOrdersDashboard({ user, userDoc, orders, isLoading }: { user: User, userDoc: any, orders: any[] | null, isLoading: boolean }) {
    const firestore = useFirestore();
    
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
                                            <p className="text-sm text-muted-foreground">{order.createdAt ? format(order.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: it }) : ''}</p>
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

function CustomerOrdersDashboard({ user, userDoc, orders, isLoading }: { user: User, userDoc: any, orders: any[] | null, isLoading: boolean }) {
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
                                            <p className="text-sm text-muted-foreground">{order.createdAt ? format(order.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: it }) : ''}</p>
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

  // Load all user-related data centrally
  const { data: userDoc, isLoading: isUserDocLoading, ref: userDocRef } = useUserDoc(firestore, user?.uid);
  const { data: bakerProfile, isLoading: isBakerLoading, ref: bakerDocRef } = useBakerProfile(firestore, user?.uid);
  const { data: customerProfile, isLoading: isCustomerLoading, ref: customerDocRef } = useCustomerProfile(firestore, user?.uid);
  const { data: adminDoc, isLoading: isAdminLoading } = useAdminRole(firestore, user?.uid);
  
  const role = userDoc?.role;
  const isAdmin = !!adminDoc;

  // The query is constructed only when user and role are known and valid.
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !role) {
      return null;
    }

    const ordersCollection = collection(firestore, 'orders');

    if (isAdmin) {
       return query(ordersCollection, orderBy('createdAt', 'desc'));
    }

    if (role === 'baker') {
      return query(ordersCollection, where('bakerId', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    if (role === 'customer') {
      return query(ordersCollection, where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    // Return null if role is unknown or doesn't match, preventing unauthorized queries.
    return null;
  }, [firestore, user, role, isAdmin]);


  const { data: orders, isLoading: areOrdersLoading } = useCollection(ordersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user || role !== 'baker') return null;
    return query(collection(firestore, 'products'), where('bakerId', '==', user.uid));
  }, [firestore, user, role]);
  
  const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);
  
  const isLoading = isUserLoading || isUserDocLoading || isBakerLoading || isCustomerLoading || isAdminLoading;

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

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* User Profile */}
      {user && userDoc && userDocRef && <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />}
      
      {/* Admin Section - Only shown on this page */}
      {isAdmin && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield /> Area Amministratore</CardTitle>
                <CardDescription>Gestisci le richieste e le impostazioni dell'applicazione.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/admin/applications">Vai alla dashboard admin</Link>
                </Button>
            </CardContent>
        </Card>
      )}


      {/* Baker Dashboard */}
      {role === 'baker' && bakerProfile && bakerDocRef && userDocRef && user && userDoc && (bakerProfile.approvalStatus === 'approved') && (
        <BakerProfileDashboard 
          user={user} 
          userProfile={userDoc} 
          bakerProfile={bakerProfile} 
          userDocRef={userDocRef} 
          bakerDocRef={bakerDocRef}
          orders={orders}
          areOrdersLoading={areOrdersLoading}
          products={products}
          areProductsLoading={areProductsLoading}
        />
      )}
       {role === 'baker' && bakerProfile && (bakerProfile.approvalStatus === 'pending' || bakerProfile.approvalStatus === 'rejected') && (
        <BakerProfileDashboard 
          user={user} 
          userProfile={userDoc} 
          bakerProfile={bakerProfile} 
          userDocRef={userDocRef!} 
          bakerDocRef={bakerDocRef!}
          orders={null}
          areOrdersLoading={false}
          products={null}
          areProductsLoading={false}
        />
      )}


      {/* Customer Dashboard */}
      {role === 'customer' && customerProfile && customerDocRef && user && userDoc && (
        <CustomerProfileDashboard 
          user={user} 
          userDoc={userDoc} 
          profile={customerProfile} 
          docRef={customerDocRef}
          orders={orders}
          areOrdersLoading={areOrdersLoading}
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
