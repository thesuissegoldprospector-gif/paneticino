'use client';
import React from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Info, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ProductCard({ product }: { product: any }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} width={400} height={300} className="h-full w-full object-cover"/>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <ShoppingBag className="h-12 w-12"/>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-semibold text-base">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          <p className="mt-1 font-bold text-sm text-accent-foreground">{product.price}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full border-accent text-accent-foreground hover:bg-accent/10">
          Aggiungi
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductCardSkeleton() {
    return (
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted-foreground/20" />
            <div className="h-8 w-full animate-pulse rounded bg-muted-foreground/20" />
          </div>
          <div className="mt-4 h-5 w-1/4 animate-pulse rounded bg-muted-foreground/20" />
        </CardContent>
      </Card>
    );
  }

export default function BakeryDetailClient({ bakery, products }: { bakery: any; products: any[] | null }) {
  return (
    <div>
      {/* Cover */}
      <div className="relative h-48 w-full bg-muted">
        {bakery.coverPhotoUrl ? (
          <Image src={bakery.coverPhotoUrl} alt={`Cover image for ${bakery.companyName}`} fill className="object-cover" priority/>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-background to-muted"/>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Profile */}
      <div className="container mx-auto -mt-16 px-4 pb-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-32 w-32 rounded-full border-4 border-background bg-background ring-1 ring-border flex items-center justify-center">
            {bakery.profilePictureUrl ? (
              <Image src={bakery.profilePictureUrl} alt={`Profile of ${bakery.companyName}`} fill className="rounded-full object-cover"/>
            ) : (
              <span className="text-3xl font-bold text-muted-foreground">{bakery.companyName?.[0]}</span>
            )}
          </div>
          <h1 className="mt-4 font-headline text-4xl">{bakery.companyName}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4"/>
            <span>{bakery.address}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="mt-8">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">Prodotti</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6">
            {products ? (
                products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => <ProductCard key={product.id} product={product}/>)}
                </div>
                ) : (
                <p className="py-8 text-center text-muted-foreground">Questo panettiere non ha ancora aggiunto nessun prodotto.</p>
                )
            ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            )}
          </TabsContent>
          <TabsContent value="info" className="mt-6">
            <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
              <h3 className="mb-4 font-headline text-2xl">Informazioni</h3>
              <div className="space-y-4 text-card-foreground">
                <div className="flex items-start gap-3">
                  <Info className="mt-1 h-5 w-5 flex-shrink-0 text-primary"/>
                  <p>Zone di consegna: {(bakery.deliveryZones || []).join(", ")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-primary"/>
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
