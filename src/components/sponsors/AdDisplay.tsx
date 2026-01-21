'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import adData from '@/lib/ad-spaces.json';

// This map links the URL path to the 'page' identifier in our JSON data.
const pageNameMap: { [key: string]: string } = {
  '/': 'Home',
  '/bakeries': 'Panettieri',
  '/near-me': 'Vicino a te',
  '/profile': 'Profilo',
};

export default function AdDisplay() {
    const pathname = usePathname();
    
    // Determine the current page's name based on the URL path.
    const currentPageName = pageNameMap[pathname] || null;

    // If the current page isn't one that should display ads, render nothing.
    if (!currentPageName) {
        return null;
    }

    // Filter the ad slots from the JSON file to get only the ones for the current page.
    const filteredAdSlots = adData.adSlots.filter(ad => ad.page === currentPageName);
    
    // If no ad slots are defined for this page, render nothing.
    if (filteredAdSlots.length === 0) {
        return null;
    }

    return (
        <section className="py-12 no-print">
            <h2 className="text-2xl font-headline text-center text-foreground mb-8">
                Spazi Sponsorizzati
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdSlots.map(ad => (
                    <Card key={ad.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                         <div className="relative aspect-[16/9] w-full bg-muted">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                fill
                                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover"
                                data-ai-hint={ad.imageHint}
                            />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg">{ad.title}</CardTitle>
                            <CardDescription>{ad.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">
                                Spazio prenotabile. Clicca per vedere la disponibilità.
                           </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
