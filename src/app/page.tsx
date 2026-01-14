'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

function BakeryCard({ bakery }: { bakery: any }) {
  return (
    <Link href={`/bakeries/${bakery.id}`} className="block h-full w-full">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative h-32 w-full bg-muted">
            {bakery.coverPhotoUrl ? (
                <Image
                    src={bakery.coverPhotoUrl}
                    alt={`Cover image for ${bakery.companyName}`}
                    fill
                    className="object-cover"
                />
            ) : <div className="h-full w-full bg-gradient-to-t from-muted to-background"></div>}
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
                    <span className="font-bold text-muted-foreground">{bakery.companyName?.[0]}</span>
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


export default function Home() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const featuredBakersQuery = useMemoFirebase(() => {
    // Wait until auth state is determined before creating the query
    if (isUserLoading || !firestore) return null;
    return query(collection(firestore, 'bakers'), where('approvalStatus', '==', 'approved'));
  }, [firestore, isUserLoading]);

  const { data: featuredBakeries, isLoading: isLoadingBakeries } = useCollection(featuredBakersQuery);
  
  const showLoading = isLoadingBakeries || isUserLoading;


  return (
    <div className="container mx-auto px-4 py-6 space-y-12">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-headline text-foreground">Panettieri</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/bakeries">
              Vedi tutti <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {showLoading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
