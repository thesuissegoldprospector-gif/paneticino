'use client';

import React, { useMemo, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, addDocumentNonBlocking, useCollection } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, doc, serverTimestamp } from "firebase/firestore";

export default function CheckoutPage() {
  const { cart, removeFromCart, total, clearCart, isLoading: isCartLoading } = useCart();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  // State to manage the selected delivery address for each baker's order
  const [selectedAddresses, setSelectedAddresses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize customer profile fetching
  const customerRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'customers', user.uid);
  }, [firestore, user]);
  const { data: customerProfile, isLoading: isCustomerLoading } = useDoc(customerRef);
  
  const userRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userDoc, isLoading: isUserDocLoading } = useDoc(userRef);

  // Group cart items by baker
  const ordersByBaker = useMemo(() => {
    return cart.reduce((acc, item) => {
      const bakerId = item.bakerId || 'unknown'; // This is the userId
      if (!acc[bakerId]) {
        acc[bakerId] = {
          bakerId: bakerId,
          bakerName: item.bakerName || 'Panettiere Sconosciuto',
          items: [],
          total: 0,
        };
      }
      acc[bakerId].items.push(item);
      acc[bakerId].total += item.price * (item.quantity || 1);
      return acc;
    }, {} as Record<string, { bakerId: string; bakerName: string; items: typeof cart; total: number }>);
  }, [cart]);

  const isLoading = isCartLoading || isUserLoading || isCustomerLoading || isUserDocLoading;

  if (isLoading) {
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
        <p className="text-muted-foreground">Devi effettuare l'accesso per completare l'ordine.</p>
        <Button asChild><Link href="/login">Vai al Login</Link></Button>
      </div>
    );
  }

  if (cart.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Il tuo carrello è vuoto</h2>
        <p className="text-muted-foreground">Aggiungi qualche prodotto per poter procedere all'ordine.</p>
        <Button asChild><Link href="/bakeries">Esplora i panettieri</Link></Button>
      </div>
    );
  }
  
  const handlePlaceOrder = async (bakerUserId: string) => {
      if (!firestore || !user || !customerProfile || !userDoc) return;
      
      const orderData = ordersByBaker[bakerUserId];
      const deliveryAddress = selectedAddresses[bakerUserId];

      if (!deliveryAddress) {
          toast({
              variant: "destructive",
              title: "Indirizzo di consegna mancante",
              description: `Seleziona un indirizzo per l'ordine da ${orderData.bakerName}.`,
          });
          return;
      }
      
      setIsSubmitting(true);
      
      const customerName = user.displayName || (userDoc ? `${userDoc.firstName} ${userDoc.lastName}` : 'Cliente');

      const orderPayload = {
          bakerId: bakerUserId, // Use the correct bakerUserId
          bakerName: orderData.bakerName,
          customerId: user.uid,
          customerName: customerName,
          items: orderData.items.map(item => ({
              productId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl
          })),
          total: orderData.total,
          deliveryAddress: deliveryAddress,
          deliveryZone: deliveryAddress, // Assuming address can be used as zone for simplicity
          status: 'pending',
          createdAt: serverTimestamp(),
      };

      try {
        const ordersCollectionRef = collection(firestore, 'orders');
        const docPromise = addDocumentNonBlocking(ordersCollectionRef, orderPayload);

        toast({
            title: "Ordine Inviato!",
            description: `Il tuo ordine per ${orderData.bakerName} è stato inviato.`,
        });
        
        // Remove only the items for this baker from the cart
        const itemIdsToRemove = orderData.items.map(item => item.id);
        clearCart(itemIdsToRemove);
        
        // Await the promise to get the doc reference for redirection
        const docRef = await docPromise;
        if (docRef) {
          router.push(`/order-confirmation/${docRef.id}`);
        } else {
          router.push('/profile');
        }
        
      } catch (error) {
          console.error("Error placing order: ", error);
          toast({
              variant: "destructive",
              title: "Oh no! Qualcosa è andato storto",
              description: "Impossibile completare l'ordine. Riprova.",
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <h1 className="font-headline text-3xl text-center">Riepilogo Ordine</h1>
      
      {Object.keys(ordersByBaker).length === 0 && !isLoading && (
         <div className="text-center text-muted-foreground py-8">
            <p>Il tuo carrello è stato svuotato.</p>
             <Button asChild variant="link"><Link href="/bakeries">Continua lo shopping</Link></Button>
        </div>
      )}

      {Object.values(ordersByBaker).map(order => (
        <Card key={order.bakerId}>
            <CardHeader>
                <CardTitle>Ordine per {order.bakerName}</CardTitle>
                <CardDescription>Rivedi gli articoli e conferma il tuo ordine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                        {item.quantity} × {item.price.toFixed(2)} CHF
                        </p>
                    </div>
                     <p className="font-semibold">{(item.price * (item.quantity || 1)).toFixed(2)} CHF</p>
                    </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2">
                    <p>Totale Parziale</p>
                    <p>{order.total.toFixed(2)} CHF</p>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                 {customerProfile && customerProfile.deliveryAddresses?.length > 0 ? (
                    <Select
                        onValueChange={(value) => setSelectedAddresses(prev => ({ ...prev, [order.bakerId]: value }))}
                        value={selectedAddresses[order.bakerId]}
                    >
                        <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Seleziona indirizzo di consegna" />
                        </SelectTrigger>
                        <SelectContent>
                            {customerProfile.deliveryAddresses.map((addr: string, i: number) => (
                                <SelectItem key={i} value={addr}>{addr}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 ) : (
                    <div className="text-sm text-destructive flex items-center gap-2">
                       <AlertTriangle className="h-4 w-4" />
                       <span>Nessun indirizzo, <Link href="/profile" className="underline">aggiungine uno</Link>.</span>
                    </div>
                 )}
                <Button 
                    onClick={() => handlePlaceOrder(order.bakerId)} 
                    className="w-full sm:w-auto"
                    disabled={isSubmitting || !selectedAddresses[order.bakerId]}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Conferma Ordine
                </Button>
            </CardFooter>
        </Card>
      ))}
    </div>
  );
}
