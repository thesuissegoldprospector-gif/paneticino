'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

// This map links the URL path to the 'page' identifier in our Firestore data.
const pageNameMap: { [key: string]: string } = {
  '/': 'Home',
  '/bakeries': 'Panettieri',
  '/near-me': 'Vicino a te',
  '/profile': 'Profilo',
};

// Represents a single ad slot, combining default data and potential live booking
type AdSlot = {
    id: string;
    page: string;
    title: string;
    description: string;
    imageUrl: string;
    imageHint: string;
    link: string; // The destination link for the ad
};

export default function AdDisplay() {
    const pathname = usePathname();
    const firestore = useFirestore();

    const [currentHourKey, setCurrentHourKey] = useState<string>('');

    // This effect runs only on the client to get the current time, avoiding hydration errors.
    useEffect(() => {
        // We set the key for the current hour. e.g., "2024-07-26_14:00"
        setCurrentHourKey(format(new Date(), 'yyyy-MM-dd_HH:00'));
    }, []);

    // Query all ad_spaces from Firestore, ordered by their index
    const adSpacesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'ad_spaces'), orderBy('cardIndex'));
    }, [firestore]);

    const { data: adSpacesCollection, isLoading } = useCollection(adSpacesQuery);

    // Determine the current page's name based on the URL path.
    const currentPageName = pageNameMap[pathname] || null;
    
    const adSlotsForPage: AdSlot[] = useMemo(() => {
        if (!currentPageName || !adSpacesCollection || !currentHourKey) {
            return [];
        }

        // 1. Filter ad spaces for the current page
        const filteredSpaces = adSpacesCollection.filter(space => space.page === currentPageName);

        // 2. Map spaces to AdSlot objects, checking for active, approved bookings
        return filteredSpaces.map(space => {
            const activeBooking = space.bookings?.[currentHourKey];
            const isBookingActive = activeBooking?.status === 'approved' && activeBooking?.content;

            if (isBookingActive) {
                // If there's an active booking, use its content
                return {
                    id: space.id,
                    page: space.page,
                    title: activeBooking.content.title || space.name, // Fallback to space name
                    description: 'Annuncio sponsorizzato', // Generic description for live ads
                    imageUrl: activeBooking.content.fileUrl || `https://picsum.photos/seed/${space.id}/600/400`, // Fallback image
                    imageHint: 'advertisement',
                    link: activeBooking.content.link || '#', // Fallback link
                };
            } else {
                // Otherwise, use the default placeholder content for the ad space
                return {
                    id: space.id,
                    page: space.page,
                    title: space.name, // Use the space's name as the title
                    description: `Questo spazio è disponibile per la sponsorizzazione.`,
                    imageUrl: `https://picsum.photos/seed/${space.id}/600/400`,
                    imageHint: 'advertisement billboard',
                    link: '/sponsors', // Link to the sponsors page
                };
            }
        });

    }, [adSpacesCollection, currentPageName, currentHourKey]);

    // Render nothing if not on a page with ads, or if data is still loading the key info
    if (!currentPageName || isLoading || !currentHourKey) {
        return null;
    }

    if (adSlotsForPage.length === 0) {
        return null;
    }

    return (
        <section className="py-12 no-print">
            <h2 className="text-2xl font-headline text-center text-foreground mb-8">
                Spazi Sponsorizzati
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {adSlotsForPage.map(ad => (
                    <Link key={ad.id} href={ad.link} target={ad.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="block">
                        <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                            <div className="relative aspect-[16/9] w-full bg-muted">
                                <Image
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    fill
                                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover"
                                    data-ai-hint={ad.imageHint}
                                    onError={(e) => e.currentTarget.src = `https://picsum.photos/seed/${ad.id}/600/400`} // Fallback for broken image URLs
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg">{ad.title}</CardTitle>
                                {ad.description && <CardDescription>{ad.description}</CardDescription>}
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
