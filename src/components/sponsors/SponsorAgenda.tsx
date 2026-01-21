'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft, ShoppingCart, Timer, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteField, type DocumentData, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// --- Static Data & Types ---
const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const basePrices = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5, 10, 10, 15, 15, 15, 20, 20, 10, 10, 10, 15, 15, 15, 10, 10, 5, 2.5];
const nightlyDiscount = 0.5; // 50% discount

const prices = basePrices.map((price, index) => {
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
  addedAt: number; // JS Timestamp
};

const TEN_MINUTES_MS = 10 * 60 * 1000;

// --- Sub-components ---

function Countdown({ expiryTimestamp, onExpire }: { expiryTimestamp: number; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

  useEffect(() => {
    if (expiryTimestamp <= Date.now()) {
      onExpire();
      return;
    }
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
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const adSpaceDocRef = useMemo(() => {
    if (!firestore || !adSpaceId) return null;
    return doc(firestore, 'ad_spaces', adSpaceId);
  }, [firestore, adSpaceId]);

  const { data: adSpaceData, isLoading: isLoadingAdSpace } = useDoc(adSpaceDocRef);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const handleToggleSlot = async (day: Date, time: string) => {
    if (!user || !firestore || !adSpaceDocRef) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Utente non autenticato o riferimento allo spazio non valido.' });
      return;
    }
    
    const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
    const fieldPath = `bookings.${key}`;

    try {
        await runTransaction(firestore, async (transaction) => {
            const adSpaceSnap = await transaction.get(adSpaceDocRef);
            if (!adSpaceSnap.exists()) {
                throw "Il documento dello spazio pubblicitario non esiste.";
            }

            const bookings = adSpaceSnap.data().bookings || {};
            const currentBooking = bookings[key];
            const price = prices[timeSlots.indexOf(time)];
            
            const isStale = currentBooking?.status === 'reserved' && currentBooking.reservedAt && (Date.now() > currentBooking.reservedAt.toDate().getTime() + TEN_MINUTES_MS);
            
            if (!currentBooking || isStale) {
                transaction.update(adSpaceDocRef, {
                    [fieldPath]: {
                        sponsorId: user.uid,
                        status: 'reserved',
                        reservedAt: serverTimestamp(),
                        price: price,
                    }
                });
            }
            else if (currentBooking.status === 'reserved' && currentBooking.sponsorId === user.uid) {
                transaction.update(adSpaceDocRef, {
                    [fieldPath]: deleteField()
                });
            }
        });
    } catch (e) {
        console.error("Transaction to toggle slot failed: ", e);
        toast({
            variant: "destructive",
            title: "Operazione fallita",
            description: "Qualcuno potrebbe aver appena prenotato questo slot. La vista si aggiornerà a breve.",
        });
    }
  };

  const mySelectedSlots = useMemo((): SelectedSlot[] => {
    if (!adSpaceData?.bookings || !user) return [];
    const now = Date.now();
    const slots: SelectedSlot[] = [];

    for (const key in adSpaceData.bookings) {
      const booking = adSpaceData.bookings[key];
      if (booking.status === 'reserved' && booking.sponsorId === user.uid) {
        const reservedAtTime = booking.reservedAt?.toDate().getTime();
        if (reservedAtTime && now < reservedAtTime + TEN_MINUTES_MS) {
          const [dateStr, timeStr] = key.split('_');
          slots.push({
            id: `${adSpaceId}-${key}`,
            adSpaceId: adSpaceId,
            day: new Date(dateStr + 'T00:00:00'),
            time: timeStr,
            price: booking.price,
            addedAt: reservedAtTime,
          });
        }
      }
    }
    return slots.sort((a, b) => a.addedAt - b.addedAt);
  }, [adSpaceData, user, adSpaceId]);


  const getSlotStatus = (day: Date, time: string): { status: 'available' | 'selected' | 'booked'; price: number } => {
    const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
    const booking = adSpaceData?.bookings?.[key];
    const price = prices[timeSlots.indexOf(time)];

    if (!booking) return { status: 'available', price };
    if (booking.status === 'paid') return { status: 'booked', price };

    if (booking.status === 'reserved') {
      const reservedAt = booking.reservedAt?.toDate().getTime();
      if (reservedAt && Date.now() < reservedAt + TEN_MINUTES_MS) {
        return {
          status: booking.sponsorId === user?.uid ? 'selected' : 'booked',
          price,
        };
      }
    }
    return { status: 'available', price };
  };

  const handlePurchase = async () => {
    if (!user || !adSpaceDocRef || mySelectedSlots.length === 0) return;
    
    const updates: Record<string, any> = {};
    mySelectedSlots.forEach(slot => {
        const key = `${format(slot.day, 'yyyy-MM-dd')}_${slot.time}`;
        updates[`bookings.${key}`] = {
            sponsorId: user.uid,
            status: 'paid',
            price: slot.price,
        };
    });

    try {
        await updateDoc(adSpaceDocRef, updates);
        toast({
            title: "Prenotazione Simulata!",
            description: `Hai "acquistato" ${mySelectedSlots.length} slot per un totale di ${total.toFixed(2)} CHF.`,
        });
    } catch (error) {
        console.error("Error purchasing slots:", error);
        toast({ variant: 'destructive', title: 'Acquisto fallito', description: 'Impossibile confermare la prenotazione.' });
    }
  };

  const total = useMemo(() => mySelectedSlots.reduce((sum, slot) => sum + slot.price, 0), [mySelectedSlots]);

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
                            <CardTitle>Agenda per: {adSpaceData?.name || adSpaceId}</CardTitle>
                            <CardDescription>Clicca su uno slot per aggiungerlo al carrello.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border p-2 w-full sm:w-auto justify-between">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, -7))}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="text-center">
                                <p className="text-sm font-medium">Settimana</p>
                                <p className="text-xs text-muted-foreground">
                                    {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: it })}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, 7))}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-auto" style={{ maxHeight: '70vh', scrollbarWidth: 'thin' }}>
                        {isLoadingAdSpace || adSpaceData === undefined ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
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
                                    {timeSlots.map((time) => {
                                        const { status, price } = getSlotStatus(day, time);
                                        return (
                                        <div key={time} className="relative h-12 border-b">
                                            <Button
                                                onClick={() => handleToggleSlot(day, time)}
                                                disabled={status === 'booked'}
                                                variant={'outline'}
                                                className={cn(
                                                    "absolute inset-0.5 h-auto w-auto rounded-sm text-xs transition-all",
                                                    {
                                                        'border-primary/50 text-primary-foreground bg-primary/90 hover:bg-primary': status === 'selected',
                                                        'hover:bg-accent/50': status === 'available',
                                                        'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted': status === 'booked',
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
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart /> Riepilogo Prenotazione</CardTitle>
                    <CardDescription>Gli slot selezionati scadono tra 10 minuti.</CardDescription>
                </CardHeader>
                <CardContent>
                    {mySelectedSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Seleziona uno slot dal calendario per iniziare.</p>
                    ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {mySelectedSlots.map(slot => (
                        <div key={slot.id} className="flex justify-between items-start text-sm p-2 rounded-md bg-muted/50">
                            <div>
                                <p className="font-semibold">{format(slot.day, 'eee dd/MM', { locale: it })} - {slot.time}</p>
                                <p className="text-muted-foreground">{slot.price.toFixed(2)} CHF</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-destructive" />
                                    <Countdown expiryTimestamp={slot.addedAt + TEN_MINUTES_MS} onExpire={() => handleToggleSlot(slot.day, slot.time)} />
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => handleToggleSlot(slot.day, slot.time)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </CardContent>
                {mySelectedSlots.length > 0 && (
                    <CardFooter className="flex-col items-stretch space-y-4">
                    <div className="flex justify-between font-bold text-lg border-t pt-4">
                        <span>Totale</span>
                        <span>{total.toFixed(2)} CHF</span>
                    </div>
                    <Button onClick={handlePurchase}>Acquista Slot ({mySelectedSlots.length})</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
  );
};


const SelectionView = ({ adSpaces, isLoading, onSelectCard }: { adSpaces: DocumentData[] | null; isLoading: boolean; onSelectCard: (adSpaceId: string) => void }) => {
  const [openPage, setOpenPage] = useState<string | null>('Home');

  const sortedPages = useMemo(() => {
    if (!adSpaces) return [];

    const pagesMap = adSpaces.reduce((acc, space) => {
      const pageName = String(space.page || 'Altro').trim();
      if (!pageName) return acc;

      if (!acc[pageName]) {
        acc[pageName] = [];
      }
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
        <CardDescription>Scegli una pagina e una card per visualizzare il calendario delle disponibilità.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                      onClick={() => onSelectCard(card.id)}
                      className="cursor-pointer hover:shadow-md hover:border-primary transition-all"
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
            ))
        }
      </CardContent>
    </Card>
  );
};


// --- Main Component ---
export default function SponsorAgenda() {
  const firestore = useFirestore();
  const [selectedAdSpaceId, setSelectedAdSpaceId] = useState<string | null>(null);

  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ad_spaces'), orderBy('page'), orderBy('cardIndex'));
  }, [firestore]);

  const { data: adSpaces, isLoading } = useCollection(adSpacesQuery);

  if (selectedAdSpaceId) {
    return <BookingView adSpaceId={selectedAdSpaceId} onBack={() => setSelectedAdSpaceId(null)} />;
  }
  
  return <SelectionView adSpaces={adSpaces} isLoading={isLoading} onSelectCard={setSelectedAdSpaceId} />;
}
