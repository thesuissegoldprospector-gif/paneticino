'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, DocumentReference, collection, query, where, DocumentData, orderBy } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Loader2, AlertTriangle, Pencil, Camera, PlusCircle, Trash2, FileText, Package, ThumbsUp, ThumbsDown, Truck, Image as ImageIcon, Link as LinkIcon, Calendar as CalendarIcon, Printer, Check as CheckIcon } from 'lucide-react';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';

import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, updateUserProfileAndAuth } from '@/firebase';
import { UpdateImageDialog } from './dialogs';
import UserProfileCard from './UserProfileCard';
import { ProductionSheet } from './ProductionSheet';
import { DeliverySlips } from './DeliverySlips';
import Link from 'next/link';


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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'In attesa', color: 'bg-yellow-500', icon: Loader2 },
    accepted: { label: 'Accettato', color: 'bg-blue-500', icon: ThumbsUp },
    preparing: { label: 'In preparazione', color: 'bg-indigo-500', icon: Package },
    delivering: { label: 'In consegna', color: 'bg-purple-500', icon: Truck },
    completed: { label: 'Completato', color: 'bg-green-500', icon: CheckIcon },
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

function BakerOrdersDashboard({ user, orders, isLoading }: { user: User, orders: any[] | null, isLoading: boolean }) {
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
                                            {order.items.map((item: any, index: number) => <li key={index}>{item.quantity}x {item.name} - {(item.price * item.quantity).toFixed(2)} CHF</li>)}
                                        </ul>
                                        <p className="font-bold text-right mt-2">Totale: {order.total.toFixed(2)} CHF</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
                                        {order.status === 'pending' && (<><Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'rejected')}><ThumbsDown /> Rifiuta</Button><Button size="sm" onClick={() => handleUpdateStatus(order.id, 'accepted')}><ThumbsUp /> Accetta</Button></>)}
                                        {order.status === 'accepted' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'preparing')}><Package /> Prepara</Button>}
                                        {order.status === 'preparing' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'delivering')}><Truck /> In Consegna</Button>}
                                        {order.status === 'delivering' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'completed')}><CheckIcon /> Completato</Button>}
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


export default function BakerDashboard({ user, userDoc }: { user: User, userDoc: DocumentData }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [printDateRange, setPrintDateRange] = useState<DateRange | undefined>();
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('23:59');
    const [printJob, setPrintJob] = useState<{ type: 'production' | 'delivery'; fromDate: Date; toDate: Date; } | null>(null);

    const bakerDocRef = useMemoFirebase(() => doc(firestore, 'bakers', user.uid), [firestore, user.uid]);
    const { data: bakerProfile, isLoading: isBakerLoading } = useDoc(bakerDocRef);

    const userDocRef = useMemoFirebase(() => doc(firestore, 'users', user.uid), [firestore, user.uid]);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'orders'), where('bakerId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    const { data: orders, isLoading: areOrdersLoading } = useCollection(ordersQuery);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'products'), where('bakerId', '==', user.uid));
    }, [firestore, user]);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);

    const profileForm = useForm<z.infer<typeof bakerProfileFormSchema>>({
        resolver: zodResolver(bakerProfileFormSchema),
        defaultValues: {
            firstName: userDoc?.firstName || '',
            lastName: userDoc?.lastName || '',
            companyName: bakerProfile?.companyName || '',
            address: bakerProfile?.address || '',
            deliveryZones: (bakerProfile?.deliveryZones || []).join(', '),
            deliveryConditions: bakerProfile?.deliveryConditions || '',
        }
    });
    
    useEffect(() => {
        if (userDoc && bakerProfile) {
            profileForm.reset({
                firstName: userDoc.firstName || '',
                lastName: userDoc.lastName || '',
                companyName: bakerProfile.companyName || '',
                address: bakerProfile.address || '',
                deliveryZones: (bakerProfile.deliveryZones || []).join(', '),
                deliveryConditions: bakerProfile.deliveryConditions || '',
            });
        }
    }, [userDoc, bakerProfile, profileForm]);

    useEffect(() => {
        if (printJob) {
            // Short timeout to ensure the component is rendered before printing
            const timer = setTimeout(() => {
                window.print();
                setPrintJob(null); // Reset after print dialog closes
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [printJob]);

    const productForm = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { name: '', description: '', price: '', imageUrl: '' },
    });

    async function onProfileSubmit(values: z.infer<typeof bakerProfileFormSchema>) {
        if (!userDocRef) return;
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

    const handlePrint = (path: 'production' | 'delivery') => {
        if (!printDateRange?.from) {
            toast({ variant: 'destructive', title: 'Data di inizio mancante', description: 'Seleziona una data o un intervallo di date.' });
            return;
        }
        
        const fromDate = new Date(printDateRange.from);
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        fromDate.setHours(startHours, startMinutes, 0, 0);

        const toDate = printDateRange.to ? new Date(printDateRange.to) : new Date(printDateRange.from);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        toDate.setHours(endHours, endMinutes, 59, 999);
        
        if (fromDate > toDate) {
            toast({ variant: 'destructive', title: 'Intervallo non valido', description: 'La data e ora di inizio non possono essere successive alla data e ora di fine.' });
            return;
        }

        setPrintJob({ type: path, fromDate, toDate });
    };
    
    const handlePrintProduction = () => handlePrint('production');
    const handlePrintDelivery = () => handlePrint('delivery');
    
    if (isBakerLoading) {
        return <div className="flex h-full min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
    }

    if (!bakerProfile) {
         return <Card className="text-center"><CardHeader><CardTitle>Profilo Panettiere non trovato</CardTitle><CardDescription>Completa la tua richiesta per diventare panettiere.</CardDescription></CardHeader><CardContent><Button asChild><Link href="/baker-application">Vai alla richiesta</Link></Button></CardContent></Card>;
    }

    if (bakerProfile.approvalStatus === 'pending') {
        return <Card className="text-center"><CardHeader><CardTitle>Richiesta in attesa</CardTitle><CardDescription>La tua richiesta è in revisione.</CardDescription></CardHeader><CardContent><FileText className="mx-auto h-12 w-12 text-muted-foreground" /></CardContent></Card>;
    }
    if (bakerProfile.approvalStatus === 'rejected') {
        return <Card className="text-center border-destructive"><CardHeader><CardTitle className="text-destructive">Richiesta Rifiutata</CardTitle><CardDescription>Contatta il supporto per maggiori informazioni.</CardDescription></CardHeader><CardContent><AlertTriangle className="mx-auto h-12 w-12 text-destructive" /></CardContent></Card>;
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Hide elements that shouldn't be printed */
                    .no-print { 
                        display: none !important; 
                    }
                    body { 
                        background-color: #fff !important; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Reset padding/margin for print */
                    .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    /* --- Pagination Control for Slips --- */

                    /* Prevent a slip from being cut across two pages */
                    .production-sheet, .delivery-slip {
                        break-inside: avoid;
                        page-break-inside: avoid; /* fallback */
                    }
                    
                    /* Force a new page after each slip */
                    .delivery-slip {
                        page-break-after: always; /* fallback */
                        break-after: page;
                    }
                    
                    /* Prevent an extra blank page after the final slip */
                    .delivery-slips-container > .delivery-slip:last-of-type {
                        page-break-after: auto;
                        break-after: auto;
                    }
                }
            `}</style>
            <div className={cn("space-y-8", printJob ? 'no-print' : '')}>
                <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                        <Card>
                            <CardContent className="p-0">
                                <div className="relative h-48 w-full group">
                                    {bakerProfile.coverPhotoUrl ? <Image src={bakerProfile.coverPhotoUrl} alt="Immagine di copertina" fill priority sizes="100vw" style={{objectFit: "cover"}} className="rounded-t-lg" /> : <div className="flex h-full items-center justify-center rounded-t-lg text-muted-foreground bg-muted">Immagine di copertina</div>}
                                    <UpdateImageDialog onUpdate={(url) => handleImageUpdate('coverPhotoUrl', url)} currentUrl={bakerProfile.coverPhotoUrl || ''} pathPrefix={`images/${user.uid}`}>
                                        <Button variant="outline" size="icon" className="absolute top-2 right-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity"><Camera className="h-4 w-4" /></Button>
                                    </UpdateImageDialog>
                                    <div className="absolute -bottom-16 left-6">
                                        <div className="relative h-32 w-32 rounded-full border-4 border-card bg-muted flex items-center justify-center group">
                                            {bakerProfile.profilePictureUrl ? <Image src={bakerProfile.profilePictureUrl} alt="Immagine profilo" fill sizes="128px" style={{objectFit: "cover"}} className="rounded-full" /> : <span className="text-center text-xs text-muted-foreground">Immagine profilo</span>}
                                            <UpdateImageDialog onUpdate={(url) => handleImageUpdate('profilePictureUrl', url)} currentUrl={bakerProfile.profilePictureUrl || ''} pathPrefix={`images/${user.uid}`}>
                                                <Button variant="outline" size="icon" className="absolute bottom-1 right-1 z-10 h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity rounded-full"><Camera className="h-4 w-4" /></Button>
                                            </UpdateImageDialog>
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
                                <FormField control={profileForm.control} name="deliveryConditions" render={({ field }) => (<FormItem><FormLabel>Condizioni di Consegna</FormLabel><FormControl><Textarea placeholder="Es. Ordine minimo 10 CHF..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="flex justify-end gap-2">
                                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salva Modifiche</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </Form>

                <BakerOrdersDashboard user={user} orders={orders} isLoading={areOrdersLoading} />

                <Card>
                    <CardHeader>
                        <CardTitle>Centro Stampa Giornaliero</CardTitle>
                        <CardDescription>Genera fogli di produzione e bollettini di consegna per gli ordini accettati nell'intervallo di tempo selezionato.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <p className="text-sm font-medium">Intervallo di Date</p>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !printDateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {printDateRange?.from ? (
                                                printDateRange.to ? (
                                                    <>
                                                        {format(printDateRange.from, "dd LLL, y", { locale: it })} -{" "}
                                                        {format(printDateRange.to, "dd LLL, y", { locale: it })}
                                                    </>
                                                ) : (
                                                    format(printDateRange.from, "dd LLL, y", { locale: it })
                                                )
                                            ) : (
                                                <span>Scegli le date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={printDateRange?.from}
                                            selected={printDateRange}
                                            onSelect={setPrintDateRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start-time">Ora Inizio</Label>
                                    <Input
                                        id="start-time"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end-time">Ora Fine</Label>
                                    <Input
                                        id="end-time"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-wrap gap-4">
                        <Button onClick={handlePrintProduction} disabled={!printDateRange?.from}>
                            <Printer className="mr-2"/> Stampa Foglio di Produzione
                        </Button>
                        <Button variant="secondary" onClick={handlePrintDelivery} disabled={!printDateRange?.from}>
                            <Printer className="mr-2"/> Stampa Bollettini di Consegna
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>I Miei Prodotti</CardTitle><CardDescription>Aggiungi e gestisci i prodotti.</CardDescription></div>
                        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                            <DialogTrigger asChild><Button><PlusCircle /> Aggiungi Prodotto</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Aggiungi un nuovo prodotto</DialogTitle>
                                    <DialogDescription>
                                    Compila i dettagli del prodotto e aggiungi un'immagine per mostrarlo al meglio.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...productForm}>
                                    <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                                        <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Prodotto</FormLabel><FormControl><Input placeholder="Pagnotta Artigianale" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={productForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Prezzo</FormLabel><FormControl><Input placeholder="4.50 CHF" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                                                                {field.value ? <Image src={field.value} alt="Anteprima prodotto" fill sizes="96px" style={{objectFit: "cover"}} /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                                                            </div>
                                                            <UpdateImageDialog onUpdate={(url) => field.onChange(url)} currentUrl={field.value} pathPrefix={`images/${user.uid}`}>
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
                                        {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={400} height={300} sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="h-32 w-full object-cover" /> : <div className="flex h-32 w-full items-center justify-center bg-muted"><ShoppingBag /></div>}
                                        <CardContent className="p-3">
                                            <h4 className="truncate font-bold">{product.name}</h4>
                                            <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                                            <p className="mt-2 font-bold">{`${String(product.price || '').replace(/€|CHF/g, '').trim()} CHF`}</p>
                                            <Button variant="destructive" size="icon" className="absolute right-2 top-2 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : <p className="py-8 text-center text-muted-foreground">Nessun prodotto aggiunto.</p>}
                    </CardContent>
                </Card>
            </div>

            <div className="hidden print:block">
                {printJob?.type === 'production' && <ProductionSheet fromDate={printJob.fromDate} toDate={printJob.toDate} />}
                {printJob?.type === 'delivery' && <DeliverySlips fromDate={printJob.fromDate} toDate={printJob.toDate} />}
            </div>
        </>
    );
}
