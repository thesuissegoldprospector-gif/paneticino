import { bakeries } from '@/lib/data';
import { BakeryCard } from '@/components/bakery-card';

export default function BakeriesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-8 text-center font-headline text-4xl text-foreground">I Nostri Panettieri</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bakeries.map((bakery) => (
          <BakeryCard key={bakery.id} bakery={bakery} />
        ))}
      </div>
    </div>
  );
}
