import { getBakeryBySlug, getProductsByBakeryId } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product-card';
import { MapPin, Info } from 'lucide-react';

export default function BakeryDetailPage({ params }: { params: { slug: string } }) {
  const bakery = getBakeryBySlug(params.slug);

  if (!bakery) {
    notFound();
  }

  const products = getProductsByBakeryId(bakery.id);

  return (
    <div>
      <div className="relative h-48 w-full">
        <Image
          src={bakery.coverImage.imageUrl}
          alt={`Cover image for ${bakery.name}`}
          fill
          className="object-cover"
          data-ai-hint={bakery.coverImage.imageHint}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto -mt-16 px-4 pb-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src={bakery.profileImage.imageUrl}
            alt={`Profile of ${bakery.name}`}
            width={128}
            height={128}
            className="h-32 w-32 rounded-full border-4 border-background object-cover bg-background ring-1 ring-border"
            data-ai-hint={bakery.profileImage.imageHint}
          />
          <h1 className="mt-4 font-headline text-4xl">{bakery.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{bakery.description}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{bakery.address}</span>
          </div>
        </div>

        <Tabs defaultValue="products" className="mt-8">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">Prodotti</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {products.length === 0 && <p className="py-8 text-center text-muted-foreground">Nessun prodotto disponibile per questo panettiere.</p>}
          </TabsContent>
          <TabsContent value="info" className="mt-6">
            <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
              <h3 className="mb-4 font-headline text-2xl">Informazioni</h3>
              <div className="space-y-4 text-card-foreground">
                <div className="flex items-start gap-3">
                  <Info className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <p>{bakery.description}</p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <p>{bakery.address}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
