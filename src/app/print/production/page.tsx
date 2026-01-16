'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';

type AggregatedProduct = {
    name: string;
    quantity: number;
};

function ProductionSheet() {
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // Set 'to' date to the end of the day
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
            where('createdAt', '<=', Timestamp.fromDate(toDate)),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, user, fromDate, toDate]);

    const { data: orders, isLoading: areOrdersLoading } = useCollection(ordersQuery);

    const aggregatedProducts = useMemo((): AggregatedProduct[] => {
        if (!orders) return [];

        const productMap = new Map<string, number>();

        orders.forEach(order => {
            order.items.forEach((item: { name: string, quantity: number }) => {
                const currentQuantity = productMap.get(item.name) || 0;
                productMap.set(item.name, currentQuantity + item.quantity);
            });
        });

        return Array.from(productMap.entries()).map(([name, quantity]) => ({ name, quantity })).sort((a,b) => a.name.localeCompare(b.name));

    }, [orders]);

    const isLoading = isUserLoading || areOrdersLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="ml-4">Caricamento foglio di produzione...</p>
            </div>
        );
    }

    if (!user || !fromDate || !toDate) {
        return <div className="text-center p-8">Parametri mancanti per generare il foglio.</div>
    }

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
             <style jsx global>{`
                @media print {
                    .no-print { display: none; }
                    body { background-color: #fff; }
                    .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
            <div className="flex justify-between items-center no-print mb-6">
                <Button variant="outline" asChild><Link href="/profile"><ArrowLeft className="mr-2"/>Torna al profilo</Link></Button>
                <Button onClick={() => window.print()}><Printer className="mr-2"/>Stampa Foglio</Button>
            </div>
            <Card className="print-container">
                <CardHeader>
                    <CardTitle>Foglio di Produzione</CardTitle>
                    <CardDescription>
                        Totale prodotti da preparare per gli ordini accettati dal {format(fromDate, 'dd/MM/yy HH:mm', { locale: it })} al {format(toDate, 'dd/MM/yy HH:mm', { locale: it })}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {aggregatedProducts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xl">Prodotto</TableHead>
                                    <TableHead className="text-right text-xl">Quantità Totale</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aggregatedProducts.map(product => (
                                    <TableRow key={product.name}>
                                        <TableCell className="font-medium text-lg">{product.name}</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{product.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Nessun ordine accettato trovato in questo intervallo di tempo.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProductionSheetPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /><p className="ml-4">Caricamento...</p></div>}>
            <ProductionSheet />
        </Suspense>
    );
}
