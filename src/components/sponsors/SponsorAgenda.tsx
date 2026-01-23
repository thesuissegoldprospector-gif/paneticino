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
  Edit,
  Save,
  Link as LinkIcon,
  CheckCircle,
  CalendarClock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import {
  addDays,
  format,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isPast,
  endOfWeek,
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UpdateImageDialog } from '@/app/profile/dialogs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const TEN_MINUTES_MS = 10 * 60 * 1000;

// --- Sponsor Content Submission ---

const contentSubmissionSchema = z.object({
  title: z.string().min(3, "Il titolo deve avere almeno 3 caratteri.").max(100, "Massimo 100 caratteri."),
  link: z.string().url("Per favore, inserisci un URL valido.").optional().or(z.literal('')),
  fileUrl: z.string().url("L'URL del file non è valido.").optional().or(z.literal('')),
});

function SponsorContentForm({ slot }: { slot: any }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof contentSubmissionSchema>>({
    resolver: zodResolver(contentSubmissionSchema),
    defaultValues: slot.content || { title: '', link: '', fileUrl: '' },
  });

  async function onSubmit(data: z.infer<typeof contentSubmissionSchema>) {
    if (!firestore) return;
    const adSpaceRef = doc(firestore, 'ad_spaces', slot.adSpaceId);
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const adSpaceDoc = await transaction.get(adSpaceRef);
        if (!adSpaceDoc.exists()) throw new Error("Spazio pubblicitario non trovato.");
        
        // When resubmitting, always set status to 'processing' and clear admin feedback
        transaction.update(adSpaceRef, {
            [`bookings.${slot.slotKey}.content`]: data,
            [`bookings.${slot.slotKey}.status`]: 'processing',
            [`bookings.${slot.slotKey}.adminComment`]: null,
            [`bookings.${slot.slotKey}.reviewedAt`]: null,
            [`bookings.${slot.slotKey}.reviewedBy`]: null,
        });

      });
      toast({ title: "Contenuto salvato!", description: "Il tuo contenuto è stato salvato e attende l'approvazione." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Errore nel salvataggio", description: error.message });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 bg-muted/50 rounded-lg">
        {slot.status === 'rejected' && slot.adminComment && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Feedback dell'Admin</AlertTitle>
                <AlertDescription>{slot.adminComment}</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo / Testo Annuncio</FormLabel>
              <FormControl><Input placeholder="Es. Scopri la nostra nuova collezione!" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (URL)</FormLabel>
              <FormControl><Input placeholder="https://www.iltuosito.ch" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Immagine / Video dell'Annuncio</FormLabel>
              <FormControl>
                <div>
                  <UpdateImageDialog onUpdate={(url) => field.onChange(url)} currentUrl={field.value} pathPrefix={`uploads/sponsors/${slot.sponsorId}`}>
                    <Button type="button" variant="outline">
                      <Edit className="mr-2 h-4 w-4" /> Carica/Modifica File
                    </Button>
                  </UpdateImageDialog>
                  {field.value && <Link href={field.value} target="_blank" className="text-sm text-blue-500 hover:underline ml-4 break-all">{field.value}</Link>}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {slot.status === 'rejected' ? 'Salva e Reinvia per Approvazione' : 'Salva Contenuti'}
        </Button>
      </form>
    </Form>
  );
}


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
    
    useEffect(() => {
        const timerId = setInterval(() => {
            let hasExpired = false;
            const now = Date.now();
            for (const [, { reservedAt }] of selectedSlots.entries()) {
                if (now >= reservedAt.getTime() + TEN_MINUTES_MS) {
                    hasExpired = true;
                    break;
                }
            }
            if (hasExpired || selectedSlots.size > 0) {
                // Force a re-render to update timers or remove expired slots
                setSelectedSlots(prevSlots => new Map(prevSlots));
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [selectedSlots]);
    
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const prices = [5, 5, 5, 5, 5, 5, 10, 10, 15, 20, 20, 15, 15, 20, 20, 15, 15, 10, 10, 10, 10, 5, 5, 5];
    
    const getSlotStatus = useCallback((day: Date, time: string): { status: 'available' | 'selected' | 'booked' | 'processing' | 'approved'; display: string } => {
        const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
        const booking = adSpaceData?.bookings?.[key];
        const price = prices[timeSlots.indexOf(time)];
    
        const priceDisplay = `${price} CHF`;
    
        if (!booking) {
            return { status: 'available', display: priceDisplay };
        }

        if (['processing', 'paid', 'approved'].includes(booking.status)) {
            if(booking.status === 'processing') return { status: 'processing', display: 'Processing' };
            if(booking.status === 'approved') return { status: 'approved', display: 'Approved' };
            return { status: 'booked', display: 'Booked' };
        }

        if (booking.status === 'reserved') {
            const reservedAt = booking.reservedAt?.toDate();
            if (reservedAt && Date.now() < reservedAt.getTime() + TEN_MINUTES_MS) {
                if (booking.sponsorId === user?.uid) {
                    return { status: 'selected', display: priceDisplay };
                } else {
                    return { status: 'booked', display: 'Reserved' };
                }
            }
        }
        
        return { status: 'available', display: priceDisplay };
    }, [adSpaceData, user, prices, timeSlots]);

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
                    if (existingBooking.sponsorId === user.uid && existingBooking.status === 'reserved') {
                        delete currentBookings[key];
                    } else if (existingBooking.status !== 'reserved' || (Date.now() > existingBooking.reservedAt.toDate().getTime() + TEN_MINUTES_MS)) {
                       currentBookings[key] = {
                            status: 'reserved',
                            sponsorId: user.uid,
                            price: price,
                            reservedAt: serverTimestamp(),
                        };
                    }
                    else {
                        throw new Error("Slot già prenotato o in elaborazione.");
                    }
                } else {
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
        
        const slotsToPurchase = Object.entries(adSpaceData?.bookings || {})
            .filter(([, booking]) => booking.sponsorId === user.uid && booking.status === 'reserved')
            .map(([key]) => key);

        if (slotsToPurchase.length === 0) {
             toast({
                variant: 'destructive',
                title: 'Nessuno slot selezionato',
                description: "Non ci sono slot validi da acquistare. Potrebbero essere scaduti.",
            });
            return;
        }

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
                        currentBookings[key].status = 'processing';
                        // Initialize content object
                        currentBookings[key].content = { title: '', link: '', fileUrl: '' }; 
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
        
        if (newSelectedSlots.size !== selectedSlots.size || Array.from(newSelectedSlots.keys()).some(k => !selectedSlots.has(k))) {
            setSelectedSlots(new Map(newSelectedSlots));
        }

    }, [adSpaceData, user, selectedSlots.size]);


    if (isAdSpaceLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                 <div className="flex justify-start p-4 pb-0">
                    <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Indietro
                    </Button>
                </div>
                <CardHeader className="pt-2">
                    <div className="flex justify-between items-center">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-center">
                          <CardTitle>{adSpaceData?.name}</CardTitle>
                          <CardDescription>{format(weekStart, 'd MMM', { locale: it })} - {format(weekEnd, 'd MMM yyyy', { locale: it })}</CardDescription>
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-[auto_repeat(7,minmax(60px,1fr))] gap-1 min-w-[600px]">
                            {/* Headers */}
                            <div className="sticky left-0 bg-card z-10" />
                            {weekDays.map(day => (
                                <div key={day.toString()} className={cn("p-1 rounded-md text-center font-semibold text-xs", isToday(day) && "bg-primary text-primary-foreground")}>
                                    <div>{format(day, 'eee', { locale: it })}</div>
                                    <div>{format(day, 'd')}</div>
                                </div>
                            ))}
                            {/* Time slots */}
                            {timeSlots.map(time => {
                                const startTimeNumber = parseInt(time.split(':')[0], 10);
                                const endTimeString = `${((startTimeNumber + 1) % 24).toString().padStart(2, '0')}:00`;
                                return (
                                <React.Fragment key={time}>
                                    <div className="p-1 h-6 text-xs text-muted-foreground text-center flex items-center justify-center sticky left-0 bg-card z-10 border-r">
                                        {time}–{endTimeString}
                                    </div>
                                    {weekDays.map(day => {
                                        const { status, display } = getSlotStatus(day, time);
                                        return (
                                            <div
                                                key={day.toString()}
                                                onClick={() => !['booked', 'processing', 'approved'].includes(status) && handleToggleSlot(day, time)}
                                                className={cn(
                                                    "p-1 h-6 border rounded-md text-center text-[10px] transition-colors flex items-center justify-center font-bold min-w-[60px]",
                                                    {
                                                        'cursor-pointer hover:bg-green-100': status === 'available',
                                                        'bg-green-200 text-green-800 cursor-pointer': status === 'selected',
                                                        'bg-muted text-muted-foreground cursor-not-allowed': status === 'booked',
                                                        'bg-yellow-400 text-yellow-900 cursor-not-allowed': status === 'processing',
                                                        'bg-green-600 text-white cursor-not-allowed': status === 'approved',
                                                        'border-dashed': status === 'available'
                                                    })}
                                            >
                                                {display}
                                            </div>
                                        )
                                    })}
                                </React.Fragment>
                            )})}
                        </div>
                    </div>
                </CardContent>
            </Card>

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
  const { user } = useUser();

  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'ad_spaces'),
      orderBy('page'),
      orderBy('cardIndex')
    );
  }, [firestore]);

  const { data: adSpaces, isLoading } = useCollection(adSpacesQuery);

  const reviewableSlots = useMemo(() => {
    if (!adSpaces || !user) return [];
    const slots: any[] = [];
    adSpaces.forEach(space => {
      if (!space.bookings) return;
      Object.entries(space.bookings).forEach(([key, booking]: [string, any]) => {
        if (['processing', 'rejected'].includes(booking.status) && booking.sponsorId === user.uid) {
          const [date, time] = key.split('_');
          slots.push({
            id: key,
            slotKey: key,
            adSpaceId: space.id,
            adSpaceName: space.name,
            pageName: space.page,
            date,
            time,
            status: booking.status,
            content: booking.content,
            adminComment: booking.adminComment,
            sponsorId: user.uid,
          });
        }
      });
    });
    return slots.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [adSpaces, user]);

  const approvedSlots = useMemo(() => {
    if (!adSpaces || !user) return [];
    const slots: any[] = [];
    adSpaces.forEach(space => {
      if (!space.bookings) return;
      Object.entries(space.bookings).forEach(([key, booking]: [string, any]) => {
        if (booking.status === 'approved' && booking.sponsorId === user.uid) {
          const [date, time] = key.split('_');
          slots.push({
            id: key,
            adSpaceName: space.name,
            pageName: space.page,
            date,
            time,
          });
        }
      });
    });
    return slots.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [adSpaces, user]);


  const handleSelectCard = (id: string) => {
    setSelectedAdSpaceId(id);
  };

  const handleBack = () => {
    setSelectedAdSpaceId(null);
  };
  
  return (
    <div className="space-y-6">
      {reviewableSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contenuti da Revisionare</CardTitle>
            <CardDescription>
              Completa i dati per gli slot prenotati o modifica quelli rifiutati per inviarli alla revisione.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {reviewableSlots.map((slot) => (
                <AccordionItem value={slot.id} key={slot.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-4">
                      <div>
                        <p className="font-semibold">{slot.adSpaceName} - {slot.pageName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(slot.date), 'eee dd MMM yyyy', {locale: it})} alle {slot.time}
                        </p>
                      </div>
                      {slot.status === 'rejected' ? (
                        <Badge variant="destructive">Rifiutato</Badge>
                      ) : (
                        <Badge variant="secondary">In attesa</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SponsorContentForm slot={slot} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {approvedSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slot Approvati</CardTitle>
            <CardDescription>
              Questi sono i tuoi slot pubblicitari approvati, passati e futuri.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedSlots.map((slot) => {
                const slotDate = new Date(slot.date);
                const isSlotInThePast = isPast(slotDate) && !isToday(slotDate);
                return (
                     <div key={slot.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <div>
                            <p className="font-semibold">{slot.adSpaceName} - {slot.pageName}</p>
                            <p className="text-sm text-muted-foreground">
                            {format(slotDate, 'eee dd MMM yyyy', {locale: it})} alle {slot.time}
                            </p>
                        </div>
                        {isSlotInThePast ? (
                             <Badge variant="outline" className="text-muted-foreground">
                                <CalendarClock className="mr-1 h-3 w-3" />
                                Passato
                            </Badge>
                        ) : (
                            <Badge className="bg-green-600 hover:bg-green-600/80 text-white">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Attivo/Futuro
                            </Badge>
                        )}
                    </div>
                )
            })}
          </CardContent>
        </Card>
      )}

      {selectedAdSpaceId ? (
        <BookingView adSpaceId={selectedAdSpaceId} onBack={handleBack} />
      ) : (
        <SelectionView onSelectCard={handleSelectCard} adSpaces={adSpaces} isLoading={isLoading} />
      )}
    </div>
  );
}
