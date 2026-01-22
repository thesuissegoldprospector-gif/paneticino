
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import {
  addDays,
  format,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
  runTransaction,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import adSpacesData from '@/lib/ad-spaces.json';


const TEN_MINUTES_MS = 10 * 60 * 1000;

// --- Sub-componente per la selezione dello spazio ---
function SelectionView({
  onSelectCard,
  adSpaces,
  isLoading
}: {
  onSelectCard: (adSpaceId: string) => void;
  adSpaces: any[] | null;
  isLoading: boolean;
}) {
  const [openPage, setOpenPage] = useState<string | null>(null);

  const sortedPages = useMemo(() => {
    if (!adSpaces) return [];

    const pagesMap = adSpaces.reduce((acc, space) => {
      const pageName = String(space.page || 'Altro').trim();
      if (!pageName) return acc;

      if (!acc[pageName]) acc[pageName] = [];
      acc[pageName].push(space);
      return acc;
    }, {} as Record<string, DocumentData[]>);

    return Object.entries(pagesMap)
      .sort(([pageA], [pageB]) => pageA.localeCompare(pageB))
      .map(([pageName, cards]) => ({
        pageName,
        cards: cards.sort((a, b) => (Number(a.cardIndex) || 0) - (Number(b.cardIndex) || 0)),
      }));
  }, [adSpaces]);

  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Seleziona uno Spazio Pubblicitario</CardTitle>
                  <CardDescription>Caricamento spazi disponibili...</CardDescription>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin"/>
              </CardContent>
          </Card>
      );
  }

  if (!sortedPages.length) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Spazi Pubblicitari non disponibili</CardTitle>
                  <CardDescription>Non ci sono spazi pubblicitari configurati al momento.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-center text-muted-foreground py-8">Controlla la configurazione o contatta un amministratore.</p>
              </CardContent>
          </Card>
      );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleziona uno Spazio Pubblicitario</CardTitle>
        <CardDescription>
          Scegli una pagina e una card per visualizzare il calendario delle disponibilità.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedPages.map(({ pageName, cards }) => (
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
                    {cards.map(card => (
                    <Card 
                        key={card.id} 
                        className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
                        onClick={() => onSelectCard(card.id)}
                    >
                        <CardHeader>
                        <CardTitle>{card.name}</CardTitle>
                        <CardDescription>Visualizza agenda</CardDescription>
                        </CardHeader>
                    </Card>
                    ))}
                </div>
                )}
            </div>
        ))}
      </CardContent>
    </Card>
  );
}


// --- Sub-componente per la prenotazione ---
function BookingView({ adSpaceId, onBack }: { adSpaceId: string; onBack: () => void }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const adSpaceDocRef = useMemo(() => {
        if (!firestore || !adSpaceId) return null;
        return doc(firestore, 'ad_spaces', adSpaceId);
    }, [firestore, adSpaceId]);
    
    const { data: adSpaceData, isLoading: isAdSpaceLoading } = useDoc(adSpaceDocRef);
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlots, setSelectedSlots] = useState<Map<string, { price: number; reservedAt: Date }>>(new Map());
    const [, setTick] = useState(0); // State to trigger re-renders for the timer
    
    // This effect runs a timer to update the UI every second for the countdowns
    // and cleans up expired slots from the local state.
    useEffect(() => {
        const timerId = setInterval(() => {
            // Use functional update to get the latest state without adding it as a dependency
            setSelectedSlots(currentSlots => {
                const now = Date.now();
                const newSlots = new Map(currentSlots);
                let changed = false;
                newSlots.forEach((value, key) => {
                    if (now > value.reservedAt.getTime() + TEN_MINUTES_MS) {
                        newSlots.delete(key);
                        changed = true;
                    }
                });
                // Only return a new map if something actually changed
                return changed ? newSlots : currentSlots;
            });

            // Always update the tick to force a re-render for the countdown timer
            setTick(prev => prev + 1);

        }, 1000);

        return () => clearInterval(timerId);
    }, []); // Empty dependency array ensures this runs only once on mount
    
    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6),
    });

    const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
    const prices = [10, 10, 15, 15, 20, 10, 10, 15, 15, 20, 10, 10, 10]; // Prezzi fittizi
    
    const getSlotStatus = (day: Date, time: string): { status: 'available' | 'selected' | 'booked'; price: number } => {
        const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
        const booking = adSpaceData?.bookings?.[key];
        const price = prices[timeSlots.indexOf(time)];

        if (!booking) {
            return { status: 'available', price };
        }
        
        // Handle permanently booked states
        if (['paid', 'processing', 'approved'].includes(booking.status)) {
            return { status: 'booked', price };
        }

        if (booking.status === 'reserved') {
          const reservedAt = booking.reservedAt?.toDate().getTime();
          // Check if reservation is still valid (not expired)
          if (reservedAt && Date.now() < reservedAt + TEN_MINUTES_MS) {
            // Check if it's the current user's reservation or someone else's
            return {
              status: booking.sponsorId === user?.uid ? 'selected' : 'booked',
              price,
            };
          }
        }
        
        // Default to available if no other condition is met (e.g., expired reservation)
        return { status: 'available', price };
    };

    const handleToggleSlot = async (day: Date, time: string) => {
        if (!adSpaceDocRef || !user) return;
        
        const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
        const price = prices[timeSlots.indexOf(time)];

        try {
            await runTransaction(firestore, async (transaction) => {
                const adSpaceDoc = await transaction.get(adSpaceDocRef);
                if (!adSpaceDoc.exists()) {
                    throw new Error("Il documento dello spazio pubblicitario non esiste.");
                }

                const currentBookings = adSpaceDoc.data()?.bookings || {};
                const existingBooking = currentBookings[key];

                if (existingBooking) {
                    // There's a booking, check if it's ours and in 'reserved' state to deselect it
                    if (existingBooking.sponsorId === user.uid && existingBooking.status === 'reserved') {
                        delete currentBookings[key];
                    } else if (existingBooking.status !== 'reserved' || (Date.now() > existingBooking.reservedAt.toDate().getTime() + TEN_MINUTES_MS)) {
                       // The slot is either permanently booked, or it's an expired reservation we can take over.
                       currentBookings[key] = {
                            status: 'reserved',
                            sponsorId: user.uid,
                            price: price,
                            reservedAt: serverTimestamp(),
                        };
                    }
                    else {
                        // It's reserved by someone else, do nothing.
                        throw new Error("Slot già prenotato o in elaborazione.");
                    }
                } else {
                    // No reservation exists, create a new one
                    currentBookings[key] = {
                        status: 'reserved',
                        sponsorId: user.uid,
                        price: price,
                        reservedAt: serverTimestamp(),
                    };
                }
                
                transaction.update(adSpaceDocRef, { bookings: currentBookings });
            });
        } catch (error: any) {
            console.error("Transaction to toggle slot failed:", error.message);
            toast({
                variant: 'destructive',
                title: 'Operazione fallita',
                description: error.message,
            });
        }
    };
    
    const handlePurchase = async () => {
        if (!adSpaceDocRef || !user) return;
        const slotsToPurchase = Array.from(selectedSlots.keys());
        if (slotsToPurchase.length === 0) return;

        toast({ title: "Simulazione d'acquisto", description: "Sto elaborando la tua prenotazione..."});

        try {
            await runTransaction(firestore, async (transaction) => {
                const adSpaceDoc = await transaction.get(adSpaceDocRef);
                if (!adSpaceDoc.exists()) {
                    throw "Il documento non esiste.";
                }
                const currentBookings = adSpaceDoc.data().bookings || {};
                
                let purchasedCount = 0;
                for (const key of slotsToPurchase) {
                    const booking = currentBookings[key];
                    if (booking && booking.sponsorId === user.uid && booking.status === 'reserved') {
                        currentBookings[key].status = 'processing'; // Change state to "processing"
                        purchasedCount++;
                    }
                }

                if (purchasedCount > 0) {
                  transaction.update(adSpaceDocRef, { bookings: currentBookings });
                } else {
                  throw "Nessuno slot valido da acquistare. Potrebbero essere scaduti.";
                }
            });
             toast({
                title: 'Prenotazione in elaborazione!',
                description: `I tuoi ${slotsToPurchase.length} slot sono ora in stato "processing".`,
            });
            setSelectedSlots(new Map());

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Acquisto fallito',
                description: error.toString(),
            });
        }
    };

    const totalCost = useMemo(() => {
        return Array.from(selectedSlots.values()).reduce((acc, { price }) => acc + price, 0);
    }, [selectedSlots]);
    
    // Update selected slots when data from firestore changes
    useEffect(() => {
        if (!adSpaceData?.bookings || !user) {
            setSelectedSlots(new Map());
            return;
        }
    
        const newSelectedSlots = new Map<string, { price: number; reservedAt: Date }>();
        const now = Date.now();
    
        for (const key in adSpaceData.bookings) {
            const booking = adSpaceData.bookings[key];
            if (booking.status === 'reserved' && booking.sponsorId === user.uid) {
                const reservedAt = booking.reservedAt?.toDate();
                if (reservedAt && now < reservedAt.getTime() + TEN_MINUTES_MS) {
                    newSelectedSlots.set(key, { price: booking.price, reservedAt });
                }
            }
        }
        
        // Prevent infinite loop by checking if the maps are actually different
        if (newSelectedSlots.size !== selectedSlots.size || Array.from(newSelectedSlots.keys()).some(k => !selectedSlots.has(k))) {
            setSelectedSlots(newSelectedSlots);
        }

    }, [adSpaceData, user]);


    if (isAdSpaceLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendario */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <Button variant="outline" size="icon" onClick={onBack}><ChevronLeft /></Button>
                        <CardTitle>{adSpaceData?.name}</CardTitle>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>
                    <CardDescription className="text-center">{adSpaceData?.page}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <Button variant="outline" onClick={() => setCurrentDate(addDays(currentDate, -7))}>Settimana Prec.</Button>
                        <span className="font-semibold text-lg">{format(weekDays[0], 'dd MMM', { locale: it })} - {format(weekDays[6], 'dd MMM yyyy', { locale: it })}</span>
                        <Button variant="outline" onClick={() => setCurrentDate(addDays(currentDate, 7))}>Settimana Succ.</Button>
                    </div>
                    <div className="grid grid-cols-8 gap-1 text-center font-semibold">
                        <div />
                        {weekDays.map(day => (
                            <div key={day.toString()} className={cn("p-2 rounded-md", isToday(day) && "bg-primary text-primary-foreground")}>
                                <div>{format(day, 'eee', { locale: it })}</div>
                                <div>{format(day, 'd')}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-8 gap-1 mt-2">
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="p-2 text-sm text-muted-foreground text-center">{time}</div>
                                {weekDays.map(day => {
                                    const { status, price } = getSlotStatus(day, time);
                                    return (
                                        <div
                                            key={day.toString()}
                                            onClick={() => status !== 'booked' && handleToggleSlot(day, time)}
                                            className={cn("p-2 border rounded-md text-center text-xs transition-colors", {
                                                'cursor-pointer hover:bg-primary/20': status === 'available',
                                                'bg-yellow-400 text-yellow-900 cursor-pointer': status === 'selected',
                                                'bg-muted text-muted-foreground cursor-not-allowed line-through': status === 'booked',
                                                'border-dashed': status === 'available'
                                            })}
                                        >
                                            {price} CHF
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Riepilogo */}
            <Card>
                <CardHeader><CardTitle>Riepilogo Prenotazione</CardTitle></CardHeader>
                <CardContent>
                    {selectedSlots.size > 0 ? (
                        <div className="space-y-2">
                            {Array.from(selectedSlots.entries()).map(([key, { price, reservedAt }]) => {
                                const [date, time] = key.split('_');
                                const timeLeft = Math.max(0, Math.round((reservedAt.getTime() + TEN_MINUTES_MS - Date.now()) / 1000));
                                return (
                                    <div key={key} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                        <div>
                                            <p>{format(new Date(date), 'eee dd MMM', { locale: it })} - {time}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Scade tra {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <p className="font-semibold">{price.toFixed(2)} CHF</p>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleSlot(new Date(date), time)}><X className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Seleziona uno o più slot dal calendario per prenotarli.</p>
                    )}
                </CardContent>
                {selectedSlots.size > 0 && (
                    <CardFooter className="flex-col items-stretch space-y-4">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Totale:</span>
                            <span>{totalCost.toFixed(2)} CHF</span>
                        </div>
                        <Button onClick={handlePurchase}>Acquista {selectedSlots.size} Slot</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

// --- Componente Principale ---
export default function SponsorAgenda() {
  const [selectedAdSpaceId, setSelectedAdSpaceId] = useState<string | null>(null);
  const firestore = useFirestore();

  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'ad_spaces'),
      orderBy('page'),
      orderBy('cardIndex')
    );
  }, [firestore]);

  const { data: adSpaces, isLoading } = useCollection(adSpacesQuery);

  const handleSelectCard = (id: string) => {
    setSelectedAdSpaceId(id);
  };

  const handleBack = () => {
    setSelectedAdSpaceId(null);
  };
  
  if (selectedAdSpaceId) {
    return <BookingView adSpaceId={selectedAdSpaceId} onBack={handleBack} />;
  }

  return <SelectionView onSelectCard={handleSelectCard} adSpaces={adSpaces} isLoading={isLoading} />;
}
