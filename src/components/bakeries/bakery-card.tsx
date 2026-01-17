'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function BakeryCard({ bakery }: { bakery: any }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Reference to the customer's profile document
  const customerRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'customers', user.uid);
  }, [firestore, user]);

  // Fetch the customer's profile
  const { data: customerProfile } = useDoc(customerRef);

  // Check if the current bakery is in the user's favorites
  const isFavorite = useMemo(() => {
    return customerProfile?.favoriteBakeries?.includes(bakery.id);
  }, [customerProfile, bakery.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the bakery page
    e.stopPropagation(); // Stop event bubbling

    if (!user || !customerRef) {
      toast({
        variant: 'destructive',
        title: 'Accesso richiesto',
        description: "Devi effettuare l'accesso per aggiungere preferiti.",
      });
      return;
    }

    const updateData = {
      favoriteBakeries: isFavorite ? arrayRemove(bakery.id) : arrayUnion(bakery.id),
    };

    updateDocumentNonBlocking(customerRef, updateData);

    toast({
      title: isFavorite ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti!',
      description: `${bakery.companyName} è stato ${isFavorite ? 'rimosso dai' : 'aggiunto ai'} tuoi preferiti.`,
    });
  };

  const companyName = bakery?.companyName || 'Panificio';
  const address = bakery?.address || 'Indirizzo non disponibile';
  // Fallback images to prevent undefined/empty src
  const coverImageSrc = bakery?.coverPhotoUrl || `https://picsum.photos/seed/${bakery.id || 'cover'}/400/200`;
  const profileImageSrc = bakery?.profilePictureUrl || `https://picsum.photos/seed/${bakery.id || 'profile'}/100/100`;


  return (
    <Link href={`/bakeries/${bakery.id}`} className="block h-full w-full group">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg relative">
        {user && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 rounded-full bg-background/70 hover:bg-background h-8 w-8"
                onClick={toggleFavorite}
            >
                <Heart
                className={cn(
                    'h-5 w-5 text-destructive transition-all',
                    isFavorite ? 'fill-current' : 'fill-transparent'
                )}
                />
            </Button>
        )}
        <div className="relative h-32 w-full bg-muted">
            <Image
                src={coverImageSrc}
                alt={`Cover image for ${companyName}`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
            />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="relative mt-[-32px] h-12 w-12 flex-shrink-0 rounded-full border-2 border-background bg-muted ring-1 ring-border overflow-hidden">
                <Image
                    src={profileImageSrc}
                    alt={`Profile image for ${companyName}`}
                    fill
                    sizes="48px"
                    className="rounded-full object-cover"
                />
            </div>
            <div>
              <h3 className="font-semibold leading-tight text-lg group-hover:underline">{companyName}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{address}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
