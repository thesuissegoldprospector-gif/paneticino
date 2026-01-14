'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function BakeryCard({ bakery }: { bakery: any }) {
  return (
    <Link href={`/bakeries/${bakery.id}`} className="block h-full w-full">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative h-32 w-full bg-muted">
            {bakery.coverPhotoUrl && (
                <Image
                    src={bakery.coverPhotoUrl}
                    alt={`Cover image for ${bakery.companyName}`}
                    fill
                    className="object-cover"
                />
            )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative mt-[-32px] h-12 w-12 flex-shrink-0 rounded-full border-2 border-background bg-muted object-cover ring-1 ring-border flex items-center justify-center">
                {bakery.profilePictureUrl ? (
                    <Image
                    src={bakery.profilePictureUrl}
                    alt={`Profile image for ${bakery.companyName}`}
                    fill
                    className="rounded-full object-cover"
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">{bakery.companyName?.[0]}</span>
                )}
            </div>
            <div>
              <h3 className="font-semibold leading-tight text-lg">{bakery.companyName}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{bakery.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


export default function BakeriesPage() {
  const firestore = useFirestore();

  const approvedBakersQuery = useMemoFirebase(() => {
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bakeries.map((bakery) => (
            <BakeryCard key={bakery.id} bakery={bakery} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted-foreground">Nessun panettiere approvato trovato.</p>
      )}
    </div>
  );
}
