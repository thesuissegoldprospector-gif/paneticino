'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, collection, query } from 'firebase/firestore';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, CheckCircle, XCircle, LogOut, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { addDays, format, startOfWeek, subDays, eachDayOfInterval, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemo(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

// --- Hardcoded data matching the image ---
const bookingData: { [key: string]: { status: 'Libero' | 'Prenotato' | 'In Revisione' | 'Non Disponibile' | 'Libero-no-price', price?: number } } = {
  // Lunedì 24
  '2024-06-24_01:00 - 02:00': { status: 'Libero-no-price' },
  '2024-06-24_06:00 - 07:00': { status: 'Libero', price: 8 },
  '2024-06-24_07:00 - 08:00': { status: 'Libero', price: 8 },
  '2024-06-24_08:00 - 09:00': { status: 'Libero', price: 10 },
  '2024-06-24_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-24_10:00 - 11:00': { status: 'Libero', price: 12 },
  '2024-06-24_11:00 - 12:00': { status: 'Libero', price: 12 },
  '2024-06-24_18:00 - 19:00': { status: 'Libero', price: 9 },
  '2024-06-24_19:00 - 20:00': { status: 'Prenotato' },

  // Martedì 25
  '2024-06-25_06:00 - 07:00': { status: 'Libero', price: 8 },
  '2024-06-25_07:00 - 08:00': { status: 'Prenotato' },
  '2024-06-25_08:00 - 09:00': { status: 'Libero', price: 10 },
  '2024-06-25_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-25_10:00 - 11:00': { status: 'Prenotato' },
  '2024-06-25_11:00 - 12:00': { status: 'Prenotato' },

  // Mercoledì 26
  '2024-06-26_06:00 - 07:00': { status: 'Prenotato' }, // This one is orange in the image
  '2024-06-26_07:00 - 08:00': { status: 'In Revisione' },
  '2024-06-26_08:00 - 09:00': { status: 'Libero', price: 10 },
  '2024-06-26_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-26_10:00 - 11:00': { status: 'Libero', price: 12 },
  '2024-06-26_11:00 - 12:00': { status: 'Libero', price: 12 },
  '2024-06-26_22:00 - 23:00': { status: 'Libero', price: 5 },


  // Giovedì 27
  '2024-06-27_06:00 - 07:00': { status: 'Libero', price: 8 },
  '2024-06-27_07:00 - 08:00': { status: 'Libero', price: 8 },
  '2024-06-27_08:00 - 09:00': { status: 'Libero', price: 10 },
  '2024-06-27_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-27_10:00 - 11:00': { status: 'Libero', price: 12 },
  '2024-06-27_11:00 - 12:00': { status: 'Libero', price: 12 },

  // Venerdì 28
  '2024-06-28_06:00 - 07:00': { status: 'Libero', price: 8 },
  '2024-06-28_07:00 - 08:00': { status: 'Prenotato' },
  '2024-06-28_08:00 - 09:00': { status: 'Prenotato' }, // This one is red/orange
  '2024-06-28_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-28_10:00 - 11:00': { status: 'Libero', price: 12 },
  '2024-06-28_11:00 - 12:00': { status: 'Libero', price: 12 },
  '2024-06-28_23:00 - 24:00': { status: 'In Revisione' },


  // Sabato 29
  '2024-06-29_06:00 - 07:00': { status: 'Libero', price: 8 },
  '2024-06-29_07:00 - 08:00': { status: 'Libero', price: 8 },
  '2024-06-29_08:00 - 09:00': { status: 'Libero', price: 10 },
  '2024-06-29_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-29_10:00 - 11:00': { status: 'Libero', price: 12 },
  '2024-06-29_11:00 - 12:00': { status: 'Libero', price: 12 },

  // Domenica 30
  '2024-06-30_00:00 - 01:00': { status: 'Non Disponibile' },
  '2024-06-30_06:00 - 07:00': { status: 'Libero', price: 8 },
  '2024-06-30_07:00 - 08:00': { status: 'Libero', price: 8 },
  '2024-06-30_08:00 - 09:00': { status: 'Libero', price: 10 },
  '2024-06-30_09:00 - 10:00': { status: 'Libero', price: 15 },
  '2024-06-30_10:00 - 11:00': { status: 'Libero-no-price' },
  '2024-06-30_11:00 - 12:00': { status: 'Non Disponibile' },
};

// --- New Calendar Component ---
const SponsorBookingCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date('2024-06-24'));
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const weekStartsOn = 1; // Monday
    const start = startOfWeek(currentDate, { weekStartsOn });
    const end = addDays(start, 6);
    const weekDays = eachDayOfInterval({ start, end });

    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const startHour = i.toString().padStart(2, '0');
        const endHour = (i + 1).toString().padStart(2, '0');
        return `${startHour}:00 - ${endHour}:00`;
    });
    
    const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    const toggleSlotSelection = (slotKey: string) => {
        const slotData = bookingData[slotKey];
        if (slotData?.status !== 'Libero' && slotData?.status !== 'Libero-no-price') return;

        setSelectedSlots(prev => 
            prev.includes(slotKey) ? prev.filter(s => s !== slotKey) : [...prev, slotKey]
        );
    };

    const getStatusClass = (status: string, key: string, isOrange: boolean) => {
        const isSelected = selectedSlots.includes(key);
        const baseClass = 'w-full h-full text-xs font-semibold text-white p-1 rounded-md flex flex-col justify-center items-center text-center';
        
        if (isSelected) return cn(baseClass, 'ring-2 ring-offset-2 ring-blue-500 bg-green-600');

        switch (status) {
            case 'Libero':
            case 'Libero-no-price':
                return cn(baseClass, 'bg-green-500 hover:bg-green-600');
            case 'Prenotato':
                if (isOrange) return cn(baseClass, 'bg-orange-500 cursor-not-allowed');
                // The image shows a red-ish one too, let's make a special case
                if (key === '2024-06-28_08:00 - 09:00') return cn(baseClass, 'bg-red-500 cursor-not-allowed');
                return cn(baseClass, 'bg-gray-400 cursor-not-allowed');
            case 'In Revisione':
                return cn(baseClass, 'bg-yellow-500 cursor-not-allowed');
            case 'Non Disponibile':
                return cn(baseClass, 'bg-gray-300 !text-gray-600 cursor-not-allowed');
            default:
                return cn(baseClass, 'bg-gray-200 !text-gray-500');
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Seleziona Pagina:</label>
                    <Select defaultValue="home">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="home">Home</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Seleziona Slot:</label>
                    <Select defaultValue="card1">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="card1">Card 1</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Settimana Precedente</span>
              </Button>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Settimana</p>
                <p className="font-semibold">{format(start, 'd')} - {format(end, 'd MMMM yyyy', { locale: it })}</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Settimana Successiva</span>
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-auto relative border rounded-md max-h-[60vh]">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 min-w-[900px]">
                    {/* Header Row */}
                    <div className="sticky top-0 bg-background z-10" /> {/* Empty corner */}
                    {weekDays.map(day => (
                        <div key={day.toString()} className="text-center font-semibold p-2 capitalize sticky top-0 bg-card z-10 border-b">
                           {format(day, 'eeee d', { locale: it })}
                        </div>
                    ))}

                    {/* Time Slot Rows */}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-sm text-muted-foreground p-2 text-right sticky left-0 bg-card border-r">{time}</div>
                            {weekDays.map(day => {
                                const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
                                const slotData = bookingData[key];
                                const isBookedOrange = key === '2024-06-26_06:00 - 07:00';
                                
                                return (
                                    <div key={key} className="p-1 h-16 border-b border-r">
                                        {slotData ? (
                                            <button 
                                                className={getStatusClass(slotData.status, key, isBookedOrange)}
                                                onClick={() => toggleSlotSelection(key)}
                                                disabled={slotData.status !== 'Libero' && slotData.status !== 'Libero-no-price'}
                                            >
                                                <span>{slotData.status.replace('-no-price', '')}</span>
                                                {slotData.price && <span>CHF {slotData.price}</span>}
                                            </button>
                                        ) : <div className="w-full h-full bg-gray-100 rounded-md" />}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

             {/* Action Button */}
            <div className="flex justify-end pt-4">
                <Button size="lg" disabled={selectedSlots.length === 0}>
                    Prenota Spazio
                </Button>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // User and Sponsor profile fetching
  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const sponsorDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);
  
  // Note: The logic for fetching ad_spaces has been removed as it was violating
  // React's Rules of Hooks and the data was not being used by the component's UI,
  // which currently renders a static calendar.

  // Combined loading state
  const isLoading = isUserLoading || isUserDocLoading || isSponsorProfileLoading;

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  if (isLoading) {
    return (
        <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>;
  }
  if (userDoc?.role !== 'sponsor') {
    router.replace('/profile');
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>;
  }

  if (!sponsorProfile) {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle /> Profilo Sponsor non trovato</CardTitle></CardHeader>
                <CardContent><p>Non abbiamo trovato un profilo sponsor associato al tuo account.</p></CardContent>
            </Card>
        </div>
    );
  }

  const status = sponsorProfile.approvalStatus;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-8">
            {status === 'pending' && (
                <Card className="border-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600"><Clock /> Richiesta in Revisione</CardTitle>
                        <CardDescription>Il tuo profilo sponsor è in attesa di approvazione. Riceverai una notifica non appena sarà stato revisionato.</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {status === 'approved' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gestione Spazi Pubblicitari</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <SponsorBookingCalendar />
                    </CardContent>
                </Card>
            )}

            {status === 'rejected' && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><XCircle /> Richiesta Rifiutata</CardTitle>
                        <CardDescription>Purtroppo, la tua richiesta di sponsorizzazione non è stata approvata. Contatta il supporto per maggiori informazioni.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
        <div className="mt-8 flex justify-center">
            <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Esci
            </Button>
        </div>
    </div>
  );
}
