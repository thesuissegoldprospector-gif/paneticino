'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';

function DeliverySlips() {
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !user || !fromDate || !toDate) return null;
        return query(
            collection(firestore, 'orders'),
            where('bakerId', '==', user.uid),
            where('status', '==', 'accepted'),
            where('createdAt', '>=', Timestamp.fromDate(fromDate)),
            where('createdAt', '<=', Timestamp.fromDate(toDate))
        );
    }, [firestore, user, fromDate, toDate]);

    const { data: orders, isLoading: areOrdersLoading } = useCollection(ordersQuery);
    
    const isLoading = isUserLoading || areOrdersLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="ml-4">Caricamento bollettini...</p>
            </div>
        );
    }
    
    if (!user || !fromDate || !toDate) {
        return <div className="text-center p-8">Parametri mancanti per generare i bollettini.</div>
    }

    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <style jsx global>{`
                @media print {
                    .no-print { display: none; }
                    body { background-color: #fff; }
                    .delivery-slip {
                        page-break-after: always;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .delivery-slip:last-child {
                        page-break-after: auto;
                    }
                }
            `}</style>
            <div className="flex justify-between items-center no-print mb-6">
                <Button variant="outline" asChild><Link href="/profile"><ArrowLeft className="mr-2"/>Torna al profilo</Link></Button>
                <Button onClick={() => window.print()}><Printer className="mr-2"/>Stampa Bollettini</Button>
            </div>
            
            {orders && orders.length > 0 ? (
                <div className="space-y-8">
                    {orders.map(order => (
                        <Card key={order.id} className="delivery-slip">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="font-headline text-3xl">Bollettino di Consegna</CardTitle>
                                        <CardDescription>Ordine #{order.id.substring(0, 8)}</CardDescription>
                                    </div>
                                    <p className="font-semibold">{order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yyyy HH:mm', {locale: it}) : ''}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="font-semibold text-lg">CONSEGNARE A:</h3>
                                        <p className="text-2xl font-bold">{order.customerName}</p>
                                        <p className="text-lg">{order.deliveryAddress}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">RIEPILOGO ARTICOLI</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-base">Prodotto</TableHead>
                                                <TableHead className="text-right text-base">Quantità</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.items.map((item: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium text-base">{item.name}</TableCell>
                                                    <TableCell className="text-right font-bold text-base">{item.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="text-right font-bold text-xl">Totale Ordine: €{order.total.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card><CardContent><p className="text-center text-muted-foreground py-16">Nessun ordine accettato trovato in questo intervallo di tempo.</p></CardContent></Card>
            )}
        </div>
    );
}

export default function DeliverySlipsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /><p className="ml-4">Caricamento...</p></div>}>
            <DeliverySlips />
        </Suspense>
    );
}
