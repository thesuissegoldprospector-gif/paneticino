'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

const adPages = [
    { pageName: 'Home', slots: 3 },
    { pageName: 'Panettieri', slots: 3 },
    { pageName: 'Vicino a te', slots: 3 },
    { pageName: 'Profilo', slots: 3 },
];

const adSlots = adPages.flatMap(page => 
    Array.from({ length: page.slots }, (_, i) => ({
        id: `${page.pageName.toLowerCase().replace(/ /g, '-')}-card-${i + 1}`,
        page: page.pageName,
        cardIndex: i + 1,
        title: `Spazio Pubblicitario ${i + 1}`,
        description: `Card ${i + 1} - Pagina ${page.pageName}`,
        imageUrl: `https://picsum.photos/seed/${page.pageName.toLowerCase()}${i + 1}/600/400`,
        imageHint: "advertisement billboard"
    }))
);

export default function AdDisplay() {
    return (
        <section className="container mx-auto px-4 py-12 no-print">
            <h2 className="text-2xl font-headline text-center text-foreground mb-8">
                I Nostri Spazi Pubblicitari
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {adSlots.map(ad => (
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
                                Questo è uno spazio pubblicitario prenotabile dai nostri sponsor. Clicca per vedere la disponibilità.
                           </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
