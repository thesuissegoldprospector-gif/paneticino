'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function CartSheet() {
  const { cart, total, removeFromCart, updateItemQuantity } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  if (!isMounted) {
    return (
      <Button variant="outline" size="icon" className="relative">
        <ShoppingCart />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart />
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Il Mio Carrello</SheetTitle>
        </SheetHeader>
        {cart.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto pr-4">
              {cart.map((item) => (
                <div key={item.id} className="mt-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingCart className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                      )}
                    </div>
                    <div className='flex-1'>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.price.toFixed(2)}€</p>
                      <div className="mt-2 flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateItemQuantity(item.id, (item.quantity || 1) - 1)}
                          disabled={(item.quantity || 1) <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateItemQuantity(item.id, (item.quantity || 1) + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <SheetFooter className="mt-auto border-t pt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Totale</span>
                  <span>{total.toFixed(2)}€</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/checkout">Vai al Checkout</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground">Il tuo carrello è vuoto.</p>
            <SheetTrigger asChild>
                <Button asChild variant="outline">
                    <Link href="/bakeries">Continua lo shopping</Link>
                </Button>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
