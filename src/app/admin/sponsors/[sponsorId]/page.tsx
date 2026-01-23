
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building, User, Mail, MapPin, Calendar, Shield } from "lucide-react";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

    const sponsorDocRef = useMemo(() => {
        if (!firestore || !sponsorId) return null;
        // The ID passed is the userId, which is also the document ID for sponsors and users.
        return doc(firestore, 'sponsors', sponsorId);
    }, [firestore, sponsorId]);
    const { data: sponsorProfile, isLoading: isSponsorLoading } = useDoc(sponsorDocRef);
    
    const userDocRef = useMemo(() => {
        if (!firestore || !sponsorId) return null;
        return doc(firestore, 'users', sponsorId);
    }, [firestore, sponsorId]);
    const { data: userProfile, isLoading: isUserLoading } = useDoc(userDocRef);

    const isLoading = isSponsorLoading || isUserLoading;

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
            <div className="mb-6">
                <Button variant="outline" asChild>
                    <Link href="/admin/sponsors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna alla Lista Sponsor
                    </Link>
                </Button>
            </div>
            <Card>
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
                        <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
        </div>
    );
}
