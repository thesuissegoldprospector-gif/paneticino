import Link from 'next/link';
import { bakeries, getSponsoredProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { BakeryCard } from '@/components/bakery-card';
import { ProductCard } from '@/components/product-card';

export default function Home() {
  const featuredBakeries = bakeries.filter((b) => b.isFeatured);
  const sponsoredProducts = getSponsoredProducts();

  return (
    <div className="container mx-auto px-4 py-6 space-y-12">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-headline text-foreground">Panettieri in evidenza</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/bakeries">
              Vedi tutti <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {featuredBakeries.map((bakery) => (
            <div key={bakery.id} className="w-72 flex-shrink-0">
              <BakeryCard bakery={bakery} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-headline text-foreground mb-4">Prodotti del giorno</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sponsoredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
