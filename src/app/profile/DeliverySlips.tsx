'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type Props = {
    fromDate: Date;
    toDate: Date;
}

export function DeliverySlips({ fromDate, toDate }: Props) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const allOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'orders'),
            where('bakerId', '==', user.uid),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, user]);

    const { data: allOrders, isLoading: areOrdersLoading } = useCollection(allOrdersQuery);
    
    const filteredOrders = useMemo(() => {
        if (!allOrders) return [];
        return allOrders.filter(order => {
            const orderDate = order.createdAt?.toDate();
            if (!orderDate) return false;
            return order.status === 'accepted' && orderDate >= fromDate && orderDate <= toDate;
        });
    }, [allOrders, fromDate, toDate]);

    const isLoading = isUserLoading || areOrdersLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            {filteredOrders && filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                    <Card key={order.id} className="delivery-slip shadow-none border-none" style={{ pageBreakAfter: 'always' }}>
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
                            <p className="text-right font-bold text-xl">Totale Ordine: {order.total.toFixed(2)} CHF</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card><CardContent><p className="text-center text-muted-foreground py-16">Nessun ordine accettato trovato in questo intervallo di tempo.</p></CardContent></Card>
            )}
        </div>
    );
}
