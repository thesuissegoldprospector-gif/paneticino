'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'orders', id);
  }, [firestore, id]);

  const { data: order, isLoading } = useDoc(orderRef);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className='ml-4'>Caricamento conferma ordine...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Ordine non trovato</h2>
        <p className="text-muted-foreground">
          Impossibile trovare i dettagli per questo ordine.
        </p>
        <Button asChild>
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    );
  }

  const orderDate = order.orderDate?.toDate();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className='mt-4'>Ordine Confermato!</CardTitle>
          <CardDescription>
            Grazie per il tuo acquisto. Il tuo ordine è stato ricevuto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
            <div className="rounded-md border bg-muted/50 p-4 text-sm">
                <p><span className="font-semibold">Numero Ordine:</span> {order.id}</p>
                {orderDate && <p><span className="font-semibold">Data Ordine:</span> {format(orderDate, 'dd/MM/yyyy HH:mm')}</p>}
                <p><span className="font-semibold">Stato:</span> In preparazione</p>
            </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Articoli ordinati</h3>
            {order.items.map((item: any) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className='flex items-center gap-4'>
                    <div className="relative h-16 w-16 rounded-md bg-muted overflow-hidden">
                        {item.imageUrl && (
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        )}
                    </div>
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Quantità: {item.quantity}</p>
                    </div>
                </div>
                <p className="font-semibold">{item.price}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <p>Totale Pagato</p>
            <p>{order.totalAmount.toFixed(2)}€</p>
          </div>
        </CardContent>
        <CardFooter className='flex-col gap-4'>
          <Button asChild className="w-full">
            <Link href="/profile">Vai ai tuoi ordini</Link>
          </Button>
           <Button asChild variant="outline" className="w-full">
            <Link href="/">Continua lo shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
