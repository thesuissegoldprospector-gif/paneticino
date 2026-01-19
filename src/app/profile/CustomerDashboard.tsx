'use client';

import { useState, useMemo } from 'react';
import { doc, collection, query, where, DocumentData, orderBy } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Loader2, PlusCircle, Trash2, Heart, MapPin, ShoppingBag, FileText, ThumbsUp, Package, Truck, ThumbsDown, HelpCircle, Check as CheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import UserProfileCard from './UserProfileCard';

import { useFirestore, useMemoFirebase, useDoc, useCollection, updateDocumentNonBlocking } from '@/firebase';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'In attesa', color: 'bg-yellow-500', icon: Loader2 },
    accepted: { label: 'Accettato', color: 'bg-blue-500', icon: ThumbsUp },
    preparing: { label: 'In preparazione', color: 'bg-indigo-500', icon: Package },
    delivering: { label: 'In consegna', color: 'bg-purple-500', icon: Truck },
    completed: { label: 'Completato', color: 'bg-green-500', icon: CheckIcon },
    rejected: { label: 'Rifiutato', color: 'bg-red-500', icon: ThumbsDown },
};

function OrderStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-500', icon: HelpCircle };
    const Icon = config.icon;
    return (
        <Badge className={cn("text-white whitespace-nowrap", config.color)}>
            <Icon className="mr-1 h-3 w-3" /> {config.label}
        </Badge>
    );
}

function CustomerOrdersDashboard({ orders, isLoading }: { orders: any[] | null, isLoading: boolean }) {
    return (
        <Card className="md:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag /> Storico ordini</CardTitle></CardHeader>
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
                                <AccordionContent className="space-y-4 p-4">
                                     <div>
                                        <h4 className="font-semibold mb-2">Articoli</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            {order.items.map((item: any, index: number) => <li key={index}>{item.quantity}x {item.name}</li>)}
                                        </ul>
                                    </div>
                                    <div className="font-bold text-right mt-2">Totale: {order.total.toFixed(2)} CHF</div>
                                    <div className="pt-4 mt-4 border-t flex justify-end">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/order-receipt/${order.id}`} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Scarica Ricevuta
                                            </Link>
                                        </Button>
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


export default function CustomerDashboard({ user, userDoc }: { user: User, userDoc: DocumentData }) {
    const firestore = useFirestore();
    const [newAddress, setNewAddress] = useState('');
    const { toast } = useToast();

    const customerDocRef = useMemoFirebase(() => doc(firestore, 'customers', user.uid), [firestore, user.uid]);
    const { data: customerProfile, isLoading: isCustomerLoading } = useDoc(customerDocRef);
    
    const userDocRef = useMemoFirebase(() => doc(firestore, 'users', user.uid), [firestore, user.uid]);
    
    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: orders, isLoading: areOrdersLoading } = useCollection(ordersQuery);

    const favoriteBakeriesQuery = useMemoFirebase(() => {
        if (!firestore || !customerProfile?.favoriteBakeries || customerProfile.favoriteBakeries.length === 0) return null;
        return query(collection(firestore, 'bakers'), where('__name__', 'in', customerProfile.favoriteBakeries));
    }, [firestore, customerProfile?.favoriteBakeries]);
    const { data: favoriteBakeries, isLoading: areFavoritesLoading } = useCollection(favoriteBakeriesQuery);

    const handleAddAddress = () => {
        if (!customerDocRef || newAddress.trim() === '') return toast({ variant: 'destructive', title: 'Indirizzo non valido' });
        const updatedAddresses = [...(customerProfile?.deliveryAddresses || []), newAddress];
        updateDocumentNonBlocking(customerDocRef, { deliveryAddresses: updatedAddresses });
        setNewAddress('');
        toast({ title: 'Indirizzo aggiunto!' });
    };

    const handleRemoveAddress = (addressToRemove: string) => {
        if (!customerDocRef) return;
        const updatedAddresses = customerProfile?.deliveryAddresses.filter((addr: string) => addr !== addressToRemove);
        updateDocumentNonBlocking(customerDocRef, { deliveryAddresses: updatedAddresses });
        toast({ title: 'Indirizzo rimosso!' });
    };
    
    if (isCustomerLoading) {
        return <div className="flex h-full min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
            <UserProfileCard user={user} userDoc={userDoc} userDocRef={userDocRef} />
            <div className="grid max-w-4xl gap-6 md:grid-cols-2 mx-auto">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><MapPin /> I miei indirizzi</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {customerProfile?.deliveryAddresses?.length > 0 ? customerProfile.deliveryAddresses.map((addr: string, i: number) => (
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
                        {areFavoritesLoading ? <Loader2 className="animate-spin" /> : favoriteBakeries && favoriteBakeries.length > 0 ? (
                            <ul className="space-y-2">
                                {favoriteBakeries.map((bakery) => (
                                    <li key={bakery.id} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                                        <Link href={`/bakeries/${bakery.id}`} className="font-semibold hover:underline">{bakery.companyName}</Link>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className='text-sm text-muted-foreground'>Nessun panettiere preferito.</p>}
                    </CardContent>
                </Card>
                <CustomerOrdersDashboard orders={orders} isLoading={areOrdersLoading} />
            </div>
        </div>
    );
}
