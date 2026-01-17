'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export function ProductCard({ product, bakery }: { product: any; bakery: any }) {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const { user } = useUser();
    const [adding, setAdding] = useState(false);
  
    const handleAdd = () => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Accesso richiesto",
          description: "Devi effettuare l'accesso per aggiungere prodotti al carrello.",
        });
        return;
      }
      
      setAdding(true);

      const priceString = String(product.price || '0').replace('€', '').replace('CHF', '').trim();
      const priceNumber = parseFloat(priceString);

      if (isNaN(priceNumber)) {
        toast({
            variant: "destructive",
            title: "Prezzo non valido",
            description: "Questo prodotto non può essere aggiunto al carrello.",
        });
        setAdding(false);
        return;
    }

      addToCart({ 
          id: product.id, 
          name: product.name, 
          price: priceNumber,
          imageUrl: product.imageUrl,
          bakerId: bakery.userId,
          bakerName: bakery.companyName
      });

      toast({
        title: "Prodotto aggiunto!",
        description: `${product.name} è stato aggiunto al carrello.`,
      });

      setTimeout(() => {
        setAdding(false);
      }, 500);
    };
  
    return (
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={400}
              height={300}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <ShoppingBag className="h-12 w-12" />
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="font-semibold text-base">{product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            <p className="mt-1 font-bold text-sm text-accent-foreground">{String(product.price).replace('€', 'CHF')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full border-accent text-accent-foreground hover:bg-accent/10"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Aggiungendo..." : "Aggiungi"}
          </Button>
        </CardContent>
      </Card>
    );
  }

export function ProductCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden animate-pulse">
      <div className="aspect-[4/3] w-full bg-muted" />
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
