'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type AggregatedProduct = {
    name: string;
    quantity: number;
};

type Props = {
    fromDate: Date;
    toDate: Date;
}

export function ProductionSheet({ fromDate, toDate }: Props) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const allOrdersQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'orders'),
            where('bakerId', '==', user.uid)
        );
    }, [firestore, user]);

    const { data: allOrders, isLoading: areOrdersLoading } = useCollection(allOrdersQuery);

    const aggregatedProducts = useMemo((): AggregatedProduct[] => {
        if (!allOrders) return [];

        const filteredOrders = allOrders.filter(order => {
             const orderDate = order.createdAt?.toDate();
            if (!orderDate) return false;
            return order.status === 'accepted' && orderDate >= fromDate && orderDate <= toDate;
        });

        const productMap = new Map<string, number>();

        filteredOrders.forEach(order => {
            order.items.forEach((item: { name: string, quantity: number }) => {
                const currentQuantity = productMap.get(item.name) || 0;
                productMap.set(item.name, currentQuantity + item.quantity);
            });
        });

        return Array.from(productMap.entries()).map(([name, quantity]) => ({ name, quantity })).sort((a,b) => a.name.localeCompare(b.name));

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
        <Card className="print-container shadow-none border-none">
            <CardHeader>
                <CardTitle>Foglio di Produzione</CardTitle>
                <CardDescription>
                    Totale prodotti da preparare per gli ordini accettati 
                    dal {format(fromDate, 'dd/MM/yy HH:mm', { locale: it })} 
                    al {format(toDate, 'dd/MM/yy HH:mm', { locale: it })}.
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
    );
}
