'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { BakeryCard } from '@/components/bakeries/bakery-card';

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

  const { data: featuredBakeries, isLoading } = useCollection(featuredBakersQuery);

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
        {isLoading ? (
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
        <div className="py-8 text-center text-muted-foreground">
          Nessun prodotto in evidenza al momento.
        </div>
      </section>
    </div>
  );
}
