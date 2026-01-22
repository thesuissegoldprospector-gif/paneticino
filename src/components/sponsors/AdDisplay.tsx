'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

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

// MODIFIED: The component now accepts a 'cardIndex' to render a specific ad slot.
export default function AdDisplay({ cardIndex }: { cardIndex: number }) {
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
    
    // MODIFIED: This memo now isolates a SINGLE ad slot based on the provided cardIndex.
    const adSlot: AdSlot | null = useMemo(() => {
        if (!currentPageName || !adSpacesCollection || !currentHourKey) {
            return null;
        }

        // 1. Find the specific ad space for this page and cardIndex
        const space = adSpacesCollection.find(
          (s) => s.page === currentPageName && s.cardIndex === cardIndex
        );

        if (!space) {
          return null; // No ad space is configured for this specific index on this page.
        }

        // 2. Check for an active, approved booking for the current hour
        const activeBooking = space.bookings?.[currentHourKey];
        const isBookingActive = activeBooking?.status === 'approved' && activeBooking?.content;

        if (isBookingActive) {
            // If there's a live booking, use its content
            return {
                id: space.id,
                page: space.page,
                title: activeBooking.content.title || space.name,
                description: 'Annuncio sponsorizzato',
                imageUrl: activeBooking.content.fileUrl || `https://picsum.photos/seed/${space.id}/600/400`,
                imageHint: 'advertisement',
                link: activeBooking.content.link || '#',
            };
        } else {
            // Otherwise, use the default placeholder content for the ad space
            return {
                id: space.id,
                page: space.page,
                title: space.name,
                description: `Questo spazio è disponibile per la sponsorizzazione.`,
                imageUrl: `https://picsum.photos/seed/${space.id}/600/400`,
                imageHint: 'advertisement billboard',
                link: '/sponsors',
            };
        }
    }, [adSpacesCollection, currentPageName, currentHourKey, cardIndex]);

    // Render nothing if no slot is configured for this index, or if essential data is missing.
    if (!adSlot || isLoading || !currentHourKey) {
        return null;
    }

    // MODIFIED: The component now renders a single Link/Card, not a full section.
    return (
        <div className="py-6 no-print">
            <Link href={adSlot.link} target={adSlot.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="block">
                <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
                    <div className="relative aspect-[16/9] w-full bg-muted">
                        <Image
                            src={adSlot.imageUrl}
                            alt={adSlot.title}
                            fill
                            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                            data-ai-hint={adSlot.imageHint}
                            onError={(e) => e.currentTarget.src = `https://picsum.photos/seed/${adSlot.id}/600/400`}
                        />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg">{adSlot.title}</CardTitle>
                        {adSlot.description && <CardDescription>{adSlot.description}</CardDescription>}
                    </CardHeader>
                </Card>
            </Link>
        </div>
    );
}
