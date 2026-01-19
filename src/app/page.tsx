'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Store, Handshake, Sparkles, Rocket, MousePointerClick } from 'lucide-react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { BakeryCard } from '@/components/bakeries/bakery-card';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  const firestore = useFirestore();

  const featuredBakersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'bakers'),
      where('approvalStatus', '==', 'approved'),
      limit(5)
    );
  }, [firestore]);

  const { data: featuredBakeries, isLoading: isLoadingBakers } = useCollection(featuredBakersQuery);

  // Query per gli ultimi prodotti e per tutti i panettieri
  const recentProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(8));
  }, [firestore]);
  
  const allBakersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bakers'), where('approvalStatus', '==', 'approved'));
  }, [firestore]);
  
  const { data: recentProducts, isLoading: isLoadingProducts } = useCollection(recentProductsQuery);
  const { data: allBakers, isLoading: isLoadingAllBakers } = useCollection(allBakersQuery);

  // Unisce i prodotti con le informazioni del loro panettiere
  const productsWithBakers = React.useMemo(() => {
    if (!recentProducts || !allBakers) return [];
    
    const bakersMap = new Map(allBakers.map(baker => [baker.userId, baker]));
    
    return recentProducts
      .map(product => {
        const baker = bakersMap.get(product.bakerId);
        if (baker) {
          return { product, baker };
        }
        return null;
      })
      .filter((item): item is { product: any; baker: any } => item !== null);
  }, [recentProducts, allBakers]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-12">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-headline text-foreground">Panettieri in vetrina</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/bakeries">
              Vedi tutti <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {isLoadingBakers ? (
            <div className="flex justify-center items-center h-48">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : featuredBakeries && featuredBakeries.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {featuredBakeries.map((bakery) => (
              <div key={bakery.id} className="w-72 flex-shrink-0">
                <BakeryCard bakery={bakery} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Nessun panettiere disponibile al momento.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-headline text-foreground mb-4">Prodotti del giorno</h2>
        {isLoadingProducts || isLoadingAllBakers ? (
           <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-64 flex-shrink-0">
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
        ) : productsWithBakers.length > 0 ? (
           <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {productsWithBakers.map(({ product, baker }) => (
                <div key={product.id} className="w-64 flex-shrink-0">
                  <ProductCard product={product} bakery={baker} />
                </div>
              ))}
            </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nessun prodotto in evidenza al momento.
          </div>
        )}
      </section>

      {/* NEW SECTION */}
      <section className="py-12">
        <h2 className="text-3xl font-headline text-foreground mb-4 text-center">Perché Scegliere PaneDelivery</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Scopri i vantaggi di ricevere il pane fresco direttamente a casa tua, supportando i panettieri artigianali locali.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            
            <Card className="lg:col-span-3 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Store className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>I Migliori Forni Locali</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardDescription>
                        Abbiamo selezionato solo i migliori panettieri artigianali per garantirti prodotti di altissima qualità, realizzati con passione e ingredienti genuini.
                    </CardDescription>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
                <CardHeader>
                     <div className="flex items-center gap-4">
                        <div className="bg-accent/20 p-3 rounded-full">
                            <Handshake className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <CardTitle>Diventa Nostro Partner</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription>
                        Sei un panettiere e vuoi raggiungere più clienti? Unisciti alla nostra piattaforma per far crescere la tua attività e portare le tue creazioni nelle case di tutti.
                    </CardDescription>
                </CardContent>
                <div className="p-6 pt-0">
                    <Button variant="secondary">Scopri di più</Button>
                </div>
            </Card>

            <Card className="lg:col-span-2 text-center flex flex-col items-center justify-start transition-transform duration-200 hover:-translate-y-1">
                <CardHeader>
                    <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg">Freschezza Garantita</CardTitle>
                    <CardDescription className="mt-2">
                        Il tuo ordine viene preparato poco prima della consegna per assicurarti la massima freschezza.
                    </CardDescription>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 text-center flex flex-col items-center justify-start transition-transform duration-200 hover:-translate-y-1">
                <CardHeader>
                     <div className="bg-secondary p-3 rounded-full w-fit mx-auto">
                        <Rocket className="h-6 w-6 text-secondary-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg">Consegna Veloce</CardTitle>
                     <CardDescription className="mt-2">
                        Ricevi il pane e i dolci che ami in tempi rapidi, direttamente alla porta di casa tua.
                    </CardDescription>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 text-center flex flex-col items-center justify-start transition-transform duration-200 hover:-translate-y-1">
                <CardHeader>
                    <div className="bg-accent/20 p-3 rounded-full w-fit mx-auto">
                        <MousePointerClick className="h-6 w-6 text-accent-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg">Semplice da Usare</CardTitle>
                    <CardDescription className="mt-2">
                        Ordina in pochi click dal tuo smartphone o computer, in modo facile e intuitivo.
                    </CardDescription>
                </CardContent>
            </Card>

        </div>
      </section>

    </div>
  );
}
