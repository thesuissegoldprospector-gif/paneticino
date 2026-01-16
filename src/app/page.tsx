
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/server';
import { BakeryCard } from '@/components/bakeries/bakery-card';
import { Loader2 } from 'lucide-react';

type Bakery = {
  id: string;
  [key: string]: any;
};

async function getFeaturedBakeries(): Promise<Bakery[]> {
  try {
    const featuredBakersQuery = query(
      collection(firestore, 'bakers'), 
      where('approvalStatus', '==', 'approved'), 
      limit(5)
    );
    const snapshot = await getDocs(featuredBakersQuery);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bakery[];
  } catch (error) {
    console.error("Error fetching featured bakeries:", error);
    return [];
  }
}

export default async function Home() {
  const featuredBakeries = await getFeaturedBakeries();

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
        {featuredBakeries.length > 0 ? (
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
