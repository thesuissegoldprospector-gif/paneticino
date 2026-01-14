'use client';

import React from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export function CartSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse p-4 max-w-md mx-auto">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full bg-muted rounded"
        />
      ))}
       <div className="h-10 w-full bg-primary/50 rounded mt-4" />
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, addToCart, removeFromCart, clearCart, isLoading, total } = useCart();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();


  if (isLoading || isUserLoading) return (
     <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
  );

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

  if (cart.length === 0)
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

  const handleCheckout = () => {
    // Here you would typically connect to a payment gateway
    // and create an order in your database.
    console.log("Simulating order creation with items:", cart);
    toast({
        title: "Ordine Inviato!",
        description: "Il tuo ordine è stato simulato con successo."
    });
    clearCart();
    router.push('/'); // Redirect to home after checkout
  };


  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="font-headline text-3xl text-center">Riepilogo Ordine</h1>
      {cart.map((item) => (
        <div key={item.id} className="flex justify-between items-center border-b pb-2">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.quantity} × {item.price.toFixed(2)}€
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addToCart(item)}>+</Button>
            <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>-</Button>
          </div>
        </div>
      ))}

      <p className="text-right font-bold text-lg">Totale: {total.toFixed(2)}€</p>

      <Button
        onClick={handleCheckout}
        className="w-full"
      >
        Conferma e Paga
      </Button>
    </div>
  );
}
