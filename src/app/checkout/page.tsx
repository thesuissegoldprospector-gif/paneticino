'use client';

import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, total, clearCart, isLoading: isCartLoading } = useCart();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const handlePlaceOrder = async () => {
    if (!user || !firestore) return;

    const orderData = {
      userId: user.uid,
      items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl
      })),
      totalAmount: total,
      orderDate: serverTimestamp(),
      status: 'pending', // o 'new'
    };

    const ordersCollection = collection(firestore, 'orders');
    const docRef = await addDocumentNonBlocking(ordersCollection, orderData);

    await clearCart();

    if (docRef) {
        router.push(`/order-confirmation/${docRef.id}`);
    } else {
        // Handle error, maybe show a toast
        console.error("Failed to create order");
    }
  };

  if (isUserLoading || isCartLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <h2 className="text-2xl font-bold">Accesso richiesto</h2>
            <p className="text-muted-foreground">
            Devi effettuare l'accesso per completare l'ordine.
            </p>
            <Button asChild>
            <Link href="/login">Vai al Login</Link>
            </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Il tuo carrello è vuoto</h2>
        <p className="text-muted-foreground">
          Aggiungi qualche prodotto per poter procedere all'ordine.
        </p>
        <Button asChild>
          <Link href="/bakeries">Esplora i panettieri</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Ordine</CardTitle>
          <CardDescription>Controlla i tuoi articoli e completa l'ordine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-md bg-muted overflow-hidden">
                    {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ): (
                        <ShoppingCart className="h-8 w-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
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
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <p>Totale</p>
            <p>{total.toFixed(2)}€</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handlePlaceOrder}>
            Conferma Ordine
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
