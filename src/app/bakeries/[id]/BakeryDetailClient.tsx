'use client';

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Info, ShoppingBag, Truck, Heart, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, updateDocumentNonBlocking, useCollection } from "@/firebase";
import { doc, query, collection, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { arrayRemove, arrayUnion } from 'firebase/firestore';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';

// Componente Carrello rapido in overlay
function CartOverlay() {
    const { cart, clearCart, total } = useCart();

    if (cart.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] bg-card shadow-lg rounded-lg p-4 z-50 border hidden md:block">
            <h3 className="font-semibold mb-2 text-lg">Riepilogo Carrello</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground">
                                {item.quantity} × {item.price.toFixed(2)} CHF
                            </p>
                        </div>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => useCart.getState().removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
            <p className="mt-4 font-bold text-right text-lg">Totale: {total.toFixed(2)} CHF</p>
            <Button asChild className="w-full mt-3">
                <Link href="/checkout">Vai al Checkout</Link>
            </Button>
        </div>
    );
}

// ------------------------
// Bakery Detail Client
// ------------------------
export default function BakeryDetailClient({ bakeryId }: { bakeryId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Fetch baker data using the document ID
    const bakerRef = useMemo(() => {
        if (!firestore || !bakeryId) return null;
        return doc(firestore, 'bakers', bakeryId);
    }, [firestore, bakeryId]);
    const { data: bakery, isLoading: isBakerLoading } = useDoc(bakerRef);

    // Fetch products for this baker using the baker's userId
    const productsQuery = useMemo(() => {
        if (!firestore || !bakery?.userId) return null;
        return query(collection(firestore, "products"), where("bakerId", "==", bakery.userId));
    }, [firestore, bakery?.userId]);
    const { data: products, isLoading: areProductsLoading } = useCollection(productsQuery);

    const customerRef = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'customers', user.uid);
    }, [firestore, user]);
    const { data: customerProfile } = useDoc(customerRef);

    const isFavorite = useMemo(() => {
        return customerProfile?.favoriteBakeries?.includes(bakeryId);
    }, [customerProfile, bakeryId]);

    const toggleFavorite = () => {
        if (!user || !customerRef) {
            toast({
                variant: 'destructive',
                title: 'Accesso richiesto',
                description: 'Devi effettuare l\'accesso per aggiungere preferiti.',
            });
            return;
        }

        const updateData = {
            favoriteBakeries: isFavorite ? arrayRemove(bakeryId) : arrayUnion(bakeryId),
        };

        updateDocumentNonBlocking(customerRef, updateData);

        toast({
            title: isFavorite ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti!',
            description: `${bakery?.companyName} è stato ${isFavorite ? 'rimosso dai' : 'aggiunto ai'} tuoi preferiti.`,
        });
    };
    
    if (isBakerLoading) {
        return (
          <div className="container mx-auto px-4 py-6 animate-pulse">
            <div className="h-48 w-full bg-muted mb-4 rounded" />
            <div className="relative -mt-24">
                <div className="h-32 w-32 mx-auto rounded-full bg-muted mb-4 border-4 border-background"/>
            </div>
            <div className="h-8 w-1/3 mx-auto bg-muted rounded" />
            <div className="h-4 w-1/4 mx-auto bg-muted rounded mt-2" />
          </div>
        );
      }
      
    if (!bakery) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold">Panettiere non trovato</h1>
                <p className="text-muted-foreground">Impossibile trovare questo panettiere. Potrebbe non essere più disponibile.</p>
                <Button asChild className="mt-4"><Link href="/bakeries">Torna ai panettieri</Link></Button>
            </div>
        )
    }

  return (
    <div>
      {/* Cover */}
      <div className="relative h-48 w-full bg-muted">
        {bakery.coverPhotoUrl ? (
          <Image
            src={bakery.coverPhotoUrl}
            alt={`Cover ${bakery.companyName}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-background to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Profile */}
      <div className="container mx-auto -mt-16 px-4 pb-8">
        <div className="relative flex flex-col items-center text-center">
          <div className="relative h-32 w-32 rounded-full border-4 border-background bg-background ring-1 ring-border flex items-center justify-center">
            {bakery.profilePictureUrl ? (
              <Image
                src={bakery.profilePictureUrl}
                alt={`Profile ${bakery.companyName}`}
                fill
                sizes="128px"
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground">{bakery.companyName?.[0]}</span>
            )}
          </div>
          <h1 className="mt-4 font-headline text-4xl">{bakery.companyName}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{bakery.address}</span>
          </div>
           {user && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 mt-4 rounded-full"
                onClick={toggleFavorite}
              >
                <Heart className={cn("h-6 w-6 text-destructive", isFavorite && "fill-current")} />
              </Button>
            )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="mt-8">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">Prodotti</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {areProductsLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products && products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => <ProductCard key={product.id} product={product} bakery={bakery} />)}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">Questo panettiere non ha ancora aggiunto prodotti.</p>
              )
            }
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
              <h3 className="mb-4 font-headline text-2xl">Informazioni</h3>
              <div className="space-y-4 text-card-foreground">
                <div className="flex items-start gap-3">
                  <Info className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <p><span className="font-semibold">Zone di consegna:</span> {(bakery.deliveryZones || []).join(", ")}</p>
                </div>
                {bakery.deliveryConditions && (
                  <div className="flex items-start gap-3">
                    <Truck className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                    <p><span className="font-semibold">Condizioni di consegna:</span> {bakery.deliveryConditions}</p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                   <p><span className="font-semibold">Indirizzo:</span> {bakery.address}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Carrello overlay */}
      <CartOverlay />
    </div>
  );
}
