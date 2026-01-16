'use client';

import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';

function OrderReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  // Fetch the order
  const orderRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'orders', id);
  }, [firestore, id]);
  const { data: order, isLoading: isLoadingOrder } = useDoc(orderRef);

  // Fetch baker details using the bakerId from the order
  const bakerQuery = useMemoFirebase(() => {
      if (!firestore || !order?.bakerId) return null;
      return query(collection(firestore, 'bakers'), where('userId', '==', order.bakerId));
  }, [firestore, order?.bakerId]);
  const { data: bakerCollection, isLoading: isLoadingBaker } = useCollection(bakerQuery);
  const baker = bakerCollection?.[0];

  const isLoading = isLoadingOrder || isLoadingBaker;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    notFound();
    return null;
  }

  const orderDate = order.createdAt?.toDate();

  return (
    <div className="bg-muted min-h-screen py-8 px-4 font-body print:bg-white print:py-0">
        <style jsx global>{`
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    background-color: #fff;
                }
                .no-print {
                    display: none;
                }
                 .print-container {
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                    border: none !important;
                    box-shadow: none !important;
                }
            }
        `}</style>

        <div className="fixed top-4 right-4 no-print">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Stampa o Salva PDF
            </Button>
        </div>

      <Card className="max-w-2xl mx-auto print-container">
        <CardHeader className="text-center">
            <p className="text-sm text-muted-foreground">ID Ordine: {order.id}</p>
            <CardTitle className="text-3xl font-headline">Ricevuta d'Acquisto</CardTitle>
            <CardDescription>
                {orderDate ? format(orderDate, 'dd MMMM yyyy, HH:mm', { locale: it }) : ''}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <h3 className="font-semibold">Venditore</h3>
                    <p>{baker?.companyName || order.bakerName || 'Panettiere'}</p>
                    <p className="text-muted-foreground">{baker?.address}</p>
                </div>
                <div className="space-y-1 text-right">
                    <h3 className="font-semibold">Cliente</h3>
                    <p>{order.customerName}</p>
                    <p className="text-muted-foreground">{order.deliveryAddress}</p>
                </div>
            </div>

            <div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prodotto</TableHead>
                            <TableHead className="text-center">Quantità</TableHead>
                            <TableHead className="text-right">Prezzo Unitario</TableHead>
                            <TableHead className="text-right">Subtotale</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map((item: any) => (
                            <TableRow key={item.productId}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">€{(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          <Separator />
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-right">
                <div className="flex justify-between font-semibold text-lg">
                    <span>Totale</span>
                    <span>€{order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Stato</span>
                    <span>Pagato</span>
                </div>
            </div>
          </div>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground justify-center">
            <p>Grazie per il tuo acquisto su PaneDelivery!</p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default OrderReceiptPage;
