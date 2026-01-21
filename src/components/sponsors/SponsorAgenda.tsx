'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft, ShoppingCart, Timer, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// --- Static Data & Types ---
const adCardPages: Record<string, string[]> = {
  'Home': ['Card 1', 'Card 2', 'Card 3'],
  'Panettieri': ['Card 1', 'Card 2', 'Card 3'],
  'Vicino a te': ['Card 1', 'Card 2', 'Card 3'],
  'Profilo': ['Card 1', 'Card 2', 'Card 3'],
};

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const basePrices = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5, 10, 10, 15, 15, 15, 20, 20, 10, 10, 10, 15, 15, 15, 10, 10, 5, 2.5];
const nightlyDiscount = 0.5; // 50% discount

const prices = basePrices.map((price, index) => {
    // night hours 22:00 (index 22) to 07:00 (index 7 excluded)
    if (index >= 22 || index < 7) {
        return price * nightlyDiscount;
    }
    return price;
});

type SelectedSlot = {
  id: string;
  adSpaceId: string;
  day: Date;
  time: string;
  price: number;
  addedAt: number; // Timestamp
};

const TEN_MINUTES_MS = 10 * 60 * 1000;

// --- Sub-components ---

function Countdown({ expiryTimestamp, onExpire }: { expiryTimestamp: number; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newTimeLeft = expiryTimestamp - Date.now();
      if (newTimeLeft <= 0) {
        clearInterval(intervalId);
        onExpire();
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiryTimestamp, onExpire]);

  if (timeLeft <= 0) return null;

  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <span className="font-mono text-xs text-destructive">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

const BookingView = ({ adSpaceId, onBack }: { adSpaceId: string; onBack: () => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const freshSlots = selectedSlots.filter(slot => slot.addedAt + TEN_MINUTES_MS > now);
      if (freshSlots.length !== selectedSlots.length) {
        setSelectedSlots(freshSlots);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSlots]);

  const handleSelectSlot = (day: Date, time: string, price: number) => {
    const slotId = `${adSpaceId}-${format(day, 'yyyy-MM-dd')}-${time}`;
    setSelectedSlots(prev =>
      prev.some(s => s.id === slotId)
        ? prev.filter(s => s.id !== slotId)
        : [...prev, { id: slotId, adSpaceId, day, time, price, addedAt: Date.now() }]
    );
  };
  
  const handleRemoveSlot = (slotId: string) => {
      setSelectedSlots(prev => prev.filter(s => s.id !== slotId));
  }

  const handlePurchase = () => {
    const total = selectedSlots.reduce((sum, s) => sum + s.price, 0).toFixed(2);
    toast({
      title: "Prenotazione Simulata!",
      description: `Hai "acquistato" ${selectedSlots.length} slot per un totale di ${total} CHF.`,
    });

    setBookedSlots(prevBooked => {
      const newBooked = { ...prevBooked };
      selectedSlots.forEach(slot => {
        const dayKey = format(slot.day, 'yyyy-MM-dd');
        if (!newBooked[dayKey]) newBooked[dayKey] = [];
        newBooked[dayKey].push(slot.time);
      });
      return newBooked;
    });

    setSelectedSlots([]);
  };

  const total = useMemo(() => selectedSlots.reduce((sum, slot) => sum + slot.price, 0), [selectedSlots]);

  const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  
   // Use a pseudo-random generator based on adSpaceId and date to make bookings unique per calendar
    const isSlotBooked = (day: Date, time: string) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        if (bookedSlots[dayKey]?.includes(time)) return true;

        const seed = adSpaceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + day.getDate() + timeSlots.indexOf(time);
        return (seed % 10) < 2; // ~20% chance of being initially booked
    };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card>
                 <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className='flex items-center gap-4'>
                            <Button variant="outline" size="icon" onClick={onBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                            <CardTitle>Agenda per: {adSpaceId}</CardTitle>
                            <CardDescription>Clicca su uno slot per aggiungerlo al carrello.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border p-2 w-full sm:w-auto justify-between">
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
                    <div className="overflow-auto" style={{ maxHeight: '70vh', scrollbarWidth: 'thin' }}>
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
                        <div key={day.toISOString()} className="min-w-[100px]">
                            <div className="sticky top-0 z-10 flex h-12 flex-col items-center justify-center border-b bg-card text-center">
                            <p className="font-semibold">{format(day, 'eee', { locale: it })}</p>
                            <p className="text-xs text-muted-foreground">{format(day, 'dd')}</p>
                            </div>
                            <div className="relative">
                            {timeSlots.map((time, index) => {
                                const slotId = `${adSpaceId}-${format(day, 'yyyy-MM-dd')}-${time}`;
                                const isSelected = selectedSlots.some(s => s.id === slotId);
                                const price = prices[index];
                                const booked = isSlotBooked(day, time);

                                return (
                                <div key={slotId} className="relative h-12 border-b">
                                    <Button
                                        onClick={() => handleSelectSlot(day, time, price)}
                                        disabled={booked}
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={cn(
                                            "absolute inset-0.5 h-auto w-auto rounded-sm text-xs transition-all",
                                            {
                                                'border-primary/50 text-primary-foreground bg-primary/90 hover:bg-primary': isSelected,
                                                'hover:bg-accent/50': !isSelected && !booked,
                                                'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted': booked,
                                            }
                                        )}
                                    >
                                        {price.toFixed(2)} CHF
                                    </Button>
                                </div>
                                );
                            })}
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart /> Riepilogo Prenotazione</CardTitle>
                    <CardDescription>Gli slot selezionati scadono in 10 minuti.</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Seleziona uno slot dal calendario per iniziare.</p>
                    ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {selectedSlots.map(slot => (
                        <div key={slot.id} className="flex justify-between items-start text-sm p-2 rounded-md bg-muted/50">
                            <div>
                            <p className="font-semibold">{format(slot.day, 'eee dd/MM', { locale: it })} - {slot.time}</p>
                            <p className="text-muted-foreground">{slot.price.toFixed(2)} CHF</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-destructive" />
                                    <Countdown expiryTimestamp={slot.addedAt + TEN_MINUTES_MS} onExpire={() => handleRemoveSlot(slot.id)} />
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => handleRemoveSlot(slot.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </CardContent>
                {selectedSlots.length > 0 && (
                    <CardFooter className="flex-col items-stretch space-y-4">
                    <div className="flex justify-between font-bold text-lg border-t pt-4">
                        <span>Totale</span>
                        <span>{total.toFixed(2)} CHF</span>
                    </div>
                    <Button onClick={handlePurchase}>Acquista Slot ({selectedSlots.length})</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
  );
};


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
  
  // Memoize the query to prevent re-renders, even though it's not used for booking logic yet
  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ad_spaces'));
  }, [firestore]);

  useCollection(adSpacesQuery);

  if (selectedCard) {
    return <BookingView adSpaceId={selectedCard} onBack={() => setSelectedCard(null)} />;
  }
  
  return <SelectionView onSelectCard={setSelectedCard} />;
}
