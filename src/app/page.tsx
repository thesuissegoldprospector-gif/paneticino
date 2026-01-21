'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Store, Handshake, Sparkles, Rocket, MousePointerClick } from 'lucide-react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { BakeryCard } from '@/components/bakeries/bakery-card';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import AdDisplay from '@/components/sponsors/AdDisplay';

export default function Home() {
  const firestore = useFirestore();

  const featuredBakersQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'bakers'),
      where('approvalStatus', '==', 'approved'),
      limit(5)
    );
  }, [firestore]);

  const { data: featuredBakeries, isLoading: isLoadingBakers } = useCollection(featuredBakersQuery);

  // Query per gli ultimi prodotti e per tutti i panettieri
  const recentProductsQuery = React.useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(8));
  }, [firestore]);
  
  const allBakersQuery = React.useMemo(() => {
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
            
            <Card className="lg:col-span-3 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 overflow-hidden">
                <div className="relative aspect-video w-full">
                    <Image
                        src="https://picsum.photos/seed/fornilocali/600/400"
                        alt="Interno di una panetteria locale"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        data-ai-hint="local bakery"
                    />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Store className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>I Migliori Forni Locali</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription>
                        Abbiamo selezionato solo i migliori panettieri artigianali per garantirti prodotti di altissima qualità, realizzati con passione e ingredienti genuini.
                    </CardDescription>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 overflow-hidden">
                 <div className="relative aspect-video w-full">
                    <Image
                        src="https://picsum.photos/seed/partnerbakery/600/400"
                        alt="Panettiere al lavoro"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        data-ai-hint="bakery partner"
                    />
                </div>
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
                <CardFooter>
                    <Button variant="secondary">Scopri di più</Button>
                </CardFooter>
            </Card>

            <Card className="lg:col-span-2 text-center flex flex-col justify-start transition-transform duration-200 hover:-translate-y-1 overflow-hidden">
                <div className="relative aspect-video w-full">
                    <Image
                        src="https://picsum.photos/seed/freshbread/400/300"
                        alt="Pane appena sfornato"
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover"
                        data-ai-hint="fresh bread"
                    />
                </div>
                <CardHeader className="items-center">
                    <div className="bg-background p-3 rounded-full w-fit mx-auto -mt-8 relative z-10 ring-8 ring-background">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <CardTitle className="text-lg">Freschezza Garantita</CardTitle>
                    <CardDescription className="mt-2">
                        Il tuo ordine viene preparato poco prima della consegna per assicurarti la massima freschezza.
                    </CardDescription>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 text-center flex flex-col justify-start transition-transform duration-200 hover:-translate-y-1 overflow-hidden">
                <div className="relative aspect-video w-full">
                    <Image
                        src="https://picsum.photos/seed/fastdelivery/400/300"
                        alt="Consegna veloce"
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover"
                        data-ai-hint="fast delivery"
                    />
                </div>
                <CardHeader className="items-center">
                     <div className="bg-background p-3 rounded-full w-fit mx-auto -mt-8 relative z-10 ring-8 ring-background">
                        <Rocket className="h-6 w-6 text-secondary-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <CardTitle className="text-lg">Consegna Veloce</CardTitle>
                     <CardDescription className="mt-2">
                        Ricevi il pane e i dolci che ami in tempi rapidi, direttamente alla porta di casa tua.
                    </CardDescription>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 text-center flex flex-col justify-start transition-transform duration-200 hover:-translate-y-1 overflow-hidden">
                <div className="relative aspect-video w-full">
                    <Image
                        src="https://picsum.photos/seed/easyorder/400/300"
                        alt="Persona che ordina da smartphone"
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover"
                        data-ai-hint="easy ordering"
                    />
                </div>
                <CardHeader className="items-center">
                    <div className="bg-background p-3 rounded-full w-fit mx-auto -mt-8 relative z-10 ring-8 ring-background">
                        <MousePointerClick className="h-6 w-6 text-accent-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <CardTitle className="text-lg">Semplice da Usare</CardTitle>
                    <CardDescription className="mt-2">
                        Ordina in pochi click dal tuo smartphone o computer, in modo facile e intuitivo.
                    </CardDescription>
                </CardContent>
            </Card>

        </div>
      </section>

      <AdDisplay />
    </div>
  );
}
