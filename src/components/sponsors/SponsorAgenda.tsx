'use client';

import React, { useState, useMemo } from 'react';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';

// --- Static Data ---

const adCardPages: Record<string, string[]> = {
  'Home': ['Card 1', 'Card 2', 'Card 3'],
  'Panettieri': ['Card 1', 'Card 2', 'Card 3'],
  'Vicino a te': ['Card 1', 'Card 2', 'Card 3'],
  'Profilo': ['Card 1', 'Card 2', 'Card 3'],
};

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const prices = [ 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5, 10, 10, 15, 15, 15, 20, 20, 10, 10, 10, 15, 15, 15, 10, 10, 5, 2.5 ];

// --- Calendar View Component ---

const CalendarView = ({ adSpaceId, onBack }: { adSpaceId: string; onBack: () => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const mockAdSpaces = useMemo(() => {
    const seed = adSpaceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return timeSlots.map((time, index) => {
        const pseudoRandom = (seed * (index + 1)) % 100 / 100;
        return {
            id: `slot-${index}`,
            name: `Banner - ${time}`,
            price: prices[index],
            status: pseudoRandom > 0.7 ? 'booked' : 'available',
        };
    });
  }, [adSpaceId]);

  const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Agenda per: {adSpaceId}</CardTitle>
              <CardDescription>Visualizza gli slot disponibili e prenota la tua visibilità.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border p-2 w-full sm:w-auto justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium">Settimana</p>
              <p className="text-xs text-muted-foreground">
                {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: it })}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto" style={{ maxHeight: '60vh', scrollbarWidth: 'thin' }}>
          <div className="relative grid grid-cols-[auto_repeat(7,1fr)]">
            <div className="sticky left-0 z-10 bg-card">
              <div className="h-12 border-b"></div>
              {timeSlots.map(time => (
                <div key={time} className="flex h-12 items-center justify-center border-b border-r px-2 text-xs text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>

            {weekDays.map(day => (
              <div key={day.toISOString()} className="min-w-[120px]">
                <div className="sticky top-0 z-10 flex h-12 flex-col items-center justify-center border-b bg-card text-center">
                  <p className="font-semibold">{format(day, 'eee', { locale: it })}</p>
                  <p className="text-xs text-muted-foreground">{format(day, 'dd')}</p>
                </div>
                <div className="relative">
                  {mockAdSpaces.map(space => (
                    <div key={space.id} className="relative h-12 border-b">
                      <Button
                        variant={space.status === 'available' ? 'outline' : 'secondary'}
                        className={cn("absolute inset-0.5 h-auto w-auto rounded-sm text-xs", {
                          'border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800': space.status === 'available',
                          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-not-allowed': space.status === 'booked'
                        })}
                        disabled
                      >
                        {space.price.toFixed(2)} CHF
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">I prezzi variano in base alla fascia oraria. Clicca su uno slot per prenotare (funzionalità in arrivo).</p>
      </CardFooter>
    </Card>
  );
};

// --- Selection View Component ---

const SelectionView = ({ onSelectCard }: { onSelectCard: (adSpaceId: string) => void }) => {
    const [openPage, setOpenPage] = useState<string | null>('Home');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seleziona uno Spazio Pubblicitario</CardTitle>
                <CardDescription>Scegli una pagina e una card per visualizzare il calendario delle disponibilità.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.entries(adCardPages).map(([pageName, cards]) => (
                    <div key={pageName}>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-lg font-semibold"
                            onClick={() => setOpenPage(openPage === pageName ? null : pageName)}
                        >
                            <CalendarIcon className="mr-4 text-primary" />
                            {pageName}
                            <ChevronRight className={cn("ml-auto h-5 w-5 transition-transform", openPage === pageName && "rotate-90")} />
                        </Button>
                        {openPage === pageName && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pl-8">
                                {cards.map(cardName => {
                                    const adSpaceId = `${pageName} - ${cardName}`;
                                    return (
                                        <Card 
                                            key={adSpaceId} 
                                            className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
                                            onClick={() => onSelectCard(adSpaceId)}
                                        >
                                            <CardHeader>
                                                <CardTitle>{cardName}</CardTitle>
                                                <CardDescription>Visualizza agenda</CardDescription>
                                            </CardHeader>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}


// --- Main Component ---

export default function SponsorAgenda() {
  const firestore = useFirestore();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ad_spaces'));
  }, [firestore]);

  const { data: adSpaces, isLoading } = useCollection(adSpacesQuery);

  if (selectedCard) {
    return <CalendarView adSpaceId={selectedCard} onBack={() => setSelectedCard(null)} />;
  }
  
  return <SelectionView onSelectCard={setSelectedCard} />;
}
