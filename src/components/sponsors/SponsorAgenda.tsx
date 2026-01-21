'use client';

import React, { useState, useMemo } from 'react';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';


// Mock data per la struttura UI dell'agenda, in attesa di adattare il backend.
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const prices = [
    2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5, // 00:00 - 06:00
    10, 10, 15, 15, 15, // 07:00 - 11:00
    20, 20, // 12:00 - 13:00
    10, 10, 10, // 14:00 - 16:00
    15, 15, 15, // 17:00 - 19:00
    10, 10, // 20:00 - 21:00
    5, 2.5 // 22:00, 23:00
];

const mockAdSpaces = timeSlots.map((time, index) => ({
  id: `slot-${index}`,
  name: `Banner in Homepage - ${time}`,
  price: prices[index],
  status: Math.random() > 0.7 ? 'booked' : 'available',
}));


export default function SponsorAgenda() {
  const firestore = useFirestore();
  
  // FIX: La query Firestore è ora avvolta in useMemo.
  // Questo assicura che l'oggetto query sia stabile tra i rendering,
  // interrompendo il loop infinito causato da useCollection.
  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ad_spaces'));
  }, [firestore]);

  // La chiamata a useCollection ora riceve una dipendenza stabile.
  const { data: adSpaces, isLoading } = useCollection(adSpacesQuery);

  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <CardTitle>Agenda Spazi Pubblicitari</CardTitle>
            <CardDescription>Visualizza gli slot disponibili e prenota la tua visibilità.</CardDescription>
          </div>
          <div className="flex items-center gap-4 rounded-lg border p-2">
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
        <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
          <div className="relative grid grid-cols-[auto_repeat(7,1fr)]">
            {/* Time column */}
            <div className="sticky left-0 z-10 bg-card">
              <div className="h-12 border-b"></div>
              {timeSlots.map(time => (
                <div key={time} className="flex h-12 items-center justify-center border-b border-r px-2 text-xs text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
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
}
