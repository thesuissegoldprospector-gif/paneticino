'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { BakeryCard } from '@/components/bakeries/bakery-card';
import { useMemo } from 'react';

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
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-8 text-center font-headline text-4xl text-foreground">I Nostri Panettieri</h1>
      {bakeries && bakeries.length > 0 ? (
        <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
          {bakeries.map((bakery) => (
            <div key={bakery.id} className="w-80 flex-shrink-0">
              <BakeryCard bakery={bakery} />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted-foreground">Nessun panettiere approvato trovato.</p>
      )}
    </div>
  );
}
