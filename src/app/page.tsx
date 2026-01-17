'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { BakeryCard } from '@/components/bakeries/bakery-card';
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

export default function Home() {
  const firestore = useFirestore();

  const plugin = React.useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false, stopOnMouseEnter: true })
  );

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
    // NOTA: la collezione 'products' non ha un timestamp.
    // Per mostrare gli "ultimi", dovremmo aggiungere un campo 'createdAt' e ordinare per quello.
    // Per ora, ci limitiamo a caricare un numero limitato di prodotti.
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
           <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
        ) : productsWithBakers.length > 0 ? (
           <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {productsWithBakers.map(({ product, baker }) => (
                  <ProductCard key={product.id} product={product} bakery={baker} />
              ))}
            </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nessun prodotto in evidenza al momento.
          </div>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-headline text-foreground mb-4">I Nostri Sponsor</h2>
        <div className="relative">
          <Carousel
            plugins={[plugin.current]}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {Array.from({ length: 8 }).map((_, index) => (
                <CarouselItem key={index} className="basis-full md:basis-1/2">
                  <div className="p-1">
                    <div className="flex aspect-[32/5] items-center justify-center rounded-lg bg-muted p-2">
                      <span className="text-md font-semibold text-muted-foreground">
                        Sponsor {index + 1}
                      </span>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden sm:flex" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden sm:flex" />
          </Carousel>
        </div>
      </section>
    </div>
  );
}
