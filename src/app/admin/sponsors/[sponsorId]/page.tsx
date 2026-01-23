
'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building, User, Mail, MapPin, Calendar as CalendarIcon, Shield, Printer } from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';


const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'bg-yellow-500' },
  approved: { label: 'Approvato', color: 'bg-green-500' },
  rejected: { label: 'Rifiutato', color: 'bg-red-500' },
};

const StatusBadge = ({ status }: { status: string }) => {
    if (!status) return null;
    const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
    return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
};

export default function SponsorDetailsPage() {
    const params = useParams();
    const sponsorId = params.sponsorId as string;
    const firestore = useFirestore();

    const [date, setDate] = useState<DateRange | undefined>(undefined);

    // --- Data Fetching ---
    const sponsorDocRef = useMemo(() => {
        if (!firestore || !sponsorId) return null;
        return doc(firestore, 'sponsors', sponsorId);
    }, [firestore, sponsorId]);
    const { data: sponsorProfile, isLoading: isSponsorLoading } = useDoc(sponsorDocRef);
    
    const userDocRef = useMemo(() => {
        if (!firestore || !sponsorId) return null;
        return doc(firestore, 'users', sponsorId);
    }, [firestore, sponsorId]);
    const { data: userProfile, isLoading: isUserLoading } = useDoc(userDocRef);

    const adSpacesQuery = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'ad_spaces');
    }, [firestore]);
    const { data: adSpaces, isLoading: isAdSpacesLoading } = useCollection(adSpacesQuery);
    
    // --- Data Processing ---
    const sponsorPurchases = useMemo(() => {
        if (!adSpaces || !sponsorId) return [];
        
        const purchases: any[] = [];
        adSpaces.forEach(space => {
            if (!space.bookings) return;
            Object.entries(space.bookings).forEach(([key, booking]: [string, any]) => {
                // We consider a purchase if it's processing or approved
                if (booking.sponsorId === sponsorId && ['processing', 'approved'].includes(booking.status)) {
                    const [dateStr, time] = key.split('_');
                    purchases.push({
                        id: key,
                        adSpaceName: space.name,
                        date: new Date(dateStr),
                        time,
                        price: booking.price || 0,
                        status: booking.status,
                    });
                }
            });
        });

        return purchases.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [adSpaces, sponsorId]);

    const filteredPurchases = useMemo(() => {
        if (!sponsorPurchases) return [];
        return sponsorPurchases.filter(purchase => {
            if (!date?.from) return true; // Show all if no date is selected
            const purchaseDate = purchase.date;
            
            if (purchaseDate < date.from) return false;
            
            if (date.to) {
                const toDate = new Date(date.to);
                toDate.setHours(23, 59, 59, 999);
                if (purchaseDate > toDate) return false;
            } else {
                 const fromDateEnd = new Date(date.from);
                 fromDateEnd.setHours(23, 59, 59, 999);
                 if (purchaseDate > fromDateEnd) return false;
            }

            return true;
        });
    }, [sponsorPurchases, date]);
    
    const totalCost = useMemo(() => {
        return filteredPurchases.reduce((sum, purchase) => sum + purchase.price, 0);
    }, [filteredPurchases]);

    const isLoading = isSponsorLoading || isUserLoading || isAdSpacesLoading;
    
    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!sponsorProfile || !userProfile) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
                <h2 className="text-2xl font-bold">Sponsor non trovato</h2>
                <p className="text-muted-foreground">
                Impossibile trovare i dettagli per questo sponsor.
                </p>
                <Button asChild>
                <Link href="/admin/sponsors">Torna alla lista</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    main { padding-top: 0 !important; }
                    .print-container { max-width: 100% !important; border: none; box-shadow: none; }
                    body, .print-container { background: #fff !important; color: #000 !important; }
                }
            `}</style>
            
            <div className="mb-6 no-print">
                <Button variant="outline" asChild>
                    <Link href="/admin/sponsors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna alla Lista Sponsor
                    </Link>
                </Button>
            </div>

            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Dettagli Sponsor</CardTitle>
                    <CardDescription>
                        Dati di registrazione per <strong>{sponsorProfile.companyName}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center gap-4">
                        <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Azienda</p>
                            <p className="font-semibold">{sponsorProfile.companyName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Titolare</p>
                            <p className="font-semibold">{userProfile.firstName} {userProfile.lastName}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-semibold">{userProfile.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Indirizzo</p>
                            <p className="font-semibold">{sponsorProfile.address}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Data Registrazione</p>
                            <p className="font-semibold">{format(new Date(userProfile.registrationDate), 'dd MMMM yyyy', { locale: it })}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Stato Account</p>
                            <StatusBadge status={sponsorProfile.approvalStatus} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Purchases Report Card */}
            <Card className="mt-8 print-container">
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Riepilogo Acquisti</CardTitle>
                            <CardDescription>Slot acquistati da {sponsorProfile.companyName}.</CardDescription>
                        </div>
                        <Button onClick={() => window.print()} variant="outline" size="icon" className="no-print">
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-6 no-print items-center">
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
                        <Button variant="ghost" onClick={() => setDate(undefined)} className="no-print">Reset</Button>
                    </div>
                    
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Spazio</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Orario</TableHead>
                                    <TableHead className="text-right">Prezzo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPurchases.length > 0 ? (
                                    filteredPurchases.map(purchase => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{purchase.adSpaceName}</TableCell>
                                            <TableCell>{format(purchase.date, 'dd/MM/yyyy', { locale: it })}</TableCell>
                                            <TableCell>{purchase.time}</TableCell>
                                            <TableCell className="text-right">{purchase.price.toFixed(2)} CHF</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">Nessun acquisto trovato per questo periodo.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Separator className="my-4" />
                    <div className="text-right">
                        <p className="text-muted-foreground">Totale per il periodo selezionato</p>
                        <p className="font-bold text-2xl">{totalCost.toFixed(2)} CHF</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

