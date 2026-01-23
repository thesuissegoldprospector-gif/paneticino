
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, collection } from 'firebase/firestore';
import { useFirestore, useDoc, useUser, useCollection } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Clock, XCircle, LogOut, Printer, Calendar as CalendarIcon } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import SponsorAgenda from '@/components/sponsors/SponsorAgenda';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { format, isPast, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


function useUserDoc(userId?: string) {
  const firestore = useFirestore();
  const userRef = useMemo(() => (firestore && userId ? doc(firestore, 'users', userId) : null), [firestore, userId]);
  return useDoc(userRef);
}

// --- Helper components ---

type SponsorStatus = 'pending' | 'approved' | 'rejected';

const statusConfig: Record<SponsorStatus, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'bg-yellow-500 hover:bg-yellow-500/80' },
  approved: { label: 'Approvato', color: 'bg-green-500 hover:bg-green-500/80' },
  rejected: { label: 'Rifiutato', color: 'bg-red-500 hover:bg-red-500/80' },
};

const formatTimeRange = (time: string) => {
    if (!time || !time.includes(':')) return time;
    const startTimeNumber = parseInt(time.split(':')[0], 10);
    const endTimeString = `${((startTimeNumber + 1) % 24).toString().padStart(2, '0')}:00`;
    return `${time}–${endTimeString}`;
};

const StatusBadge = ({ status }: { status: SponsorStatus }) => {
  if (!status) return null;
  const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
  return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
};

function SponsorProfileCard({ user, sponsorProfile }) {
    if (!user || !sponsorProfile) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Il Tuo Profilo Sponsor</CardTitle>
                <CardDescription>
                    Questi sono i dati associati al tuo account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="w-40 text-muted-foreground">Nome Azienda</p>
                    <p className="font-semibold">{sponsorProfile.companyName}</p>
                </div>
                {sponsorProfile.address && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="w-40 text-muted-foreground">Indirizzo Azienda</p>
                        <p className="font-semibold">{sponsorProfile.address}</p>
                    </div>
                )}
                 {user.displayName && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="w-40 text-muted-foreground">Titolare</p>
                        <p className="font-semibold">{user.displayName}</p>
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="w-40 text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="w-40 text-muted-foreground">Stato Account</p>
                    <StatusBadge status={sponsorProfile.approvalStatus} />
                </div>
            </CardContent>
        </Card>
    );
}

function ApprovedSlotsReport({ approvedSlots, isLoading }: { approvedSlots: any[], isLoading: boolean }) {
    const [date, setDate] = useState<DateRange | undefined>(undefined);

    const filteredSlots = useMemo(() => {
        if (!approvedSlots) return [];
        return approvedSlots.filter(slot => {
            if (!slot.date) return false;
            if (!date?.from && !date?.to) return true;
            
            const slotDate = new Date(slot.date);
            
            if (date.from && slotDate < date.from) return false;

            if (date.to) {
                const toDate = new Date(date.to);
                toDate.setHours(23, 59, 59, 999);
                if (slotDate > toDate) return false;
            }
            
            return true;
        });
    }, [approvedSlots, date]);

    if (isLoading) {
        return <Card><CardContent className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>;
    }
    
    if (approvedSlots.length === 0) {
        return null;
    }
    
    return (
        <>
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                     main {
                        padding-top: 0 !important;
                        background: #fff !important;
                     }
                }
            `}</style>

            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Report Slot Pubblicati</CardTitle>
                    <CardDescription>
                        Filtra e stampa un report dei tuoi slot pubblicitari approvati.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full sm:w-[200px] justify-start text-left font-normal", !date?.from && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? format(date.from, "dd LLL y", { locale: it }) : <span>Da (data)</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={date?.from} onSelect={(d) => setDate(prev => ({...prev, from: d}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <span className="hidden sm:block">-</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full sm:w-[200px] justify-start text-left font-normal", !date?.to && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.to ? format(date.to, "dd LLL y", { locale: it }) : <span>A (data)</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={date?.to} onSelect={(d) => setDate(prev => ({...prev, to: d}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                         <Button variant="ghost" onClick={() => setDate(undefined)}>Reset</Button>
                    </div>
                </CardContent>
                 <CardFooter>
                     <Button onClick={() => window.print()} disabled={filteredSlots.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        Stampa Report
                    </Button>
                 </CardFooter>
            </Card>

            <div className="hidden print-container">
                 <Card>
                    <CardHeader>
                        <CardTitle>Report Slot Pubblicitari</CardTitle>
                        <CardDescription>
                            Periodo: {date?.from ? format(date.from, "dd LLL y", { locale: it }) : 'Inizio'} - {date?.to ? format(date.to, "dd LLL y", { locale: it }) : 'Fine'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Spazio</TableHead>
                                    <TableHead>Pagina</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Orario</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSlots.map((slot) => (
                                    <TableRow key={slot.id}>
                                        <TableCell>{slot.adSpaceName}</TableCell>
                                        <TableCell>{slot.pageName}</TableCell>
                                        <TableCell>{format(new Date(slot.date), 'eee dd MMM yyyy', { locale: it })}</TableCell>
                                        <TableCell>{formatTimeRange(slot.time)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {filteredSlots.length === 0 && <p className="text-center text-muted-foreground p-8">Nessun slot trovato per il periodo selezionato.</p>}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}


// --- Main Page Component ---
export default function SponsorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const { data: userDoc, isLoading: isUserDocLoading } = useUserDoc(user?.uid);
  const sponsorDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'sponsors', user.uid);
  }, [firestore, user]);
  const { data: sponsorProfile, isLoading: isSponsorProfileLoading } = useDoc(sponsorDocRef);

  // Correctly query the ad_spaces collection
  const adSpacesCollectionQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'ad_spaces');
  }, [firestore]);
  const { data: adSpaces, isLoading: isAdSpacesLoading } = useCollection(adSpacesCollectionQuery);

  const isLoading = isUserLoading || isUserDocLoading || isSponsorProfileLoading || isAdSpacesLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (userDoc?.role !== 'sponsor') {
      router.replace('/profile');
    }
  }, [user, userDoc, isLoading, router]);
  
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

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  if (isLoading || !user || userDoc?.role !== 'sponsor') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {userDoc && userDoc.role !== 'sponsor' && <p className="ml-4 text-muted-foreground">Reindirizzamento...</p>}
      </div>
    );
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
        <SponsorProfileCard user={user} sponsorProfile={sponsorProfile} />

        {status === 'pending' && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600"><Clock /> Richiesta in Revisione</CardTitle>
              <CardDescription>Il tuo profilo sponsor è in attesa di approvazione. Riceverai una notifica non appena sarà stato revisionato.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {status === 'approved' && (
          <>
            <ApprovedSlotsReport approvedSlots={approvedSlots} isLoading={isAdSpacesLoading} />
            <SponsorAgenda />
          </>
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
