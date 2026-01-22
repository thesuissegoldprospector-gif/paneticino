'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { BakeryCard } from '@/components/bakeries/bakery-card';
import { useMemo } from 'react';
import AdDisplay from '@/components/sponsors/AdDisplay';

export default function BakeriesPage() {
  const firestore = useFirestore();

  const approvedBakersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bakers'), where('approvalStatus', '==', 'approved'));
  }, [firestore]);

  const { data: bakeries, isLoading } = useCollection(approvedBakersQuery);


  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Caricamento panettieri...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <h1 className="text-center font-headline text-4xl text-foreground">I Nostri Panettieri</h1>
      {bakeries && bakeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bakeries.map((bakery) => (
            <div key={bakery.id}>
              <BakeryCard bakery={bakery} />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted-foreground">Nessun panettiere approvato trovato.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdDisplay cardIndex={1} />
        <AdDisplay cardIndex={2} />
        <AdDisplay cardIndex={3} />
      </div>
    </div>
  );
}
