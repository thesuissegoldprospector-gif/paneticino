import Image from 'next/image';
import type { Product } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-[4/3] w-full overflow-hidden">
        <Image
          src={product.image.imageUrl}
          alt={product.name}
          width={product.image.width}
          height={product.image.height}
          className="h-full w-full object-cover"
          data-ai-hint={product.image.imageHint}
        />
      </div>
      <CardContent className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-semibold text-base">{product.name}</h3>
          <p className="font-bold text-sm text-accent-foreground">{product.price}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full border-accent text-accent-foreground hover:bg-accent/10">
          Aggiungi
        </Button>
      </CardContent>
    </Card>
  );
}
