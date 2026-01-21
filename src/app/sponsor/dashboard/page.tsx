'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDocs, collection, query, where } from 'firebase/firestore';
import { useFirestore, useDoc, useUser, useCollection } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, XCircle, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';


const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const prices = [5, 5, 5, 5, 5, 5, 10, 10, 15, 15, 15, 20, 20, 10, 10, 10, 15, 15, 15, 10, 10, 5, 5, 5];

const adSpaces = timeSlots.map((time, index) => ({
  id: `slot-${index}`,
  name: `Banner in Homepage - ${time}`,
  price: prices[index],
  status: Math.random() > 0.7 ? 'booked' : 'available',
}));


function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemo(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

// --- Main Page Component ---
export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const sponsorDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);
  
  const { data: adSpacesFromDB, isLoading: isAdSpacesLoading } = useCollection(
    firestore ? query(collection(firestore, 'ad_spaces')) : null
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const isLoading = isUserLoading || isUserDocLoading || isSponsorProfileLoading || isAdSpacesLoading;

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
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <CardTitle>Agenda Spazi Pubblicitari</CardTitle>
                    <CardDescription>Visualizza gli slot disponibili e prenota la tua visibilità.</CardDescription>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-2">
                    <Button variant="ghost" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-5 w-5" /></Button>
                    <div className="text-center">
                        <p className="text-sm font-medium">Settimana</p>
                        <p className="text-xs text-muted-foreground">
                            {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: it })}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextWeek}><ChevronRight className="h-5 w-5" /></Button>
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
                        {adSpaces.map(space => (
                          <div key={space.id} className="relative h-12 border-b">
                            <Button
                              variant={space.status === 'available' ? 'outline' : 'secondary'}
                              className={cn("absolute inset-0.5 h-auto w-auto rounded-sm text-xs", {
                                'border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800': space.status === 'available',
                                'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-not-allowed': space.status === 'booked'
                              })}
                              disabled
                            >
                              {space.price} CHF
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
