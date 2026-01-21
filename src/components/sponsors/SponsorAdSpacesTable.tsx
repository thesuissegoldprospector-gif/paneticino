'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdSpace = {
  id: string;
  name: string;
  price: number;
  status: 'available' | 'booked';
};

const statusConfig: Record<AdSpace['status'], { label: string; color: string }> = {
  available: { label: 'Disponibile', color: 'bg-green-500 hover:bg-green-500/80' },
  booked: { label: 'Prenotato', color: 'bg-yellow-500 hover:bg-yellow-500/80' },
};

const StatusBadge = ({ status }: { status: AdSpace['status'] }) => {
  const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
  return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
};

type SponsorAdSpacesTableProps = {
  mode: 'admin' | 'sponsor';
};

export function SponsorAdSpacesTable({ mode }: SponsorAdSpacesTableProps) {
  const firestore = useFirestore();

  const adSpacesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ad_spaces'));
  }, [firestore]);

  const { data: adSpaces, isLoading } = useCollection<AdSpace>(adSpacesQuery);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spazi Pubblicitari</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-4">Caricamento spazi...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spazi Pubblicitari</CardTitle>
        <CardDescription>
          {mode === 'admin'
            ? 'Visualizza e gestisci tutti gli spazi pubblicitari disponibili sulla piattaforma.'
            : 'Visualizza gli spazi pubblicitari disponibili e prenota la tua visibilità.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Spazio</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead className="text-right">Azione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!adSpaces || adSpaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nessuno spazio pubblicitario disponibile al momento.
                  </TableCell>
                </TableRow>
              ) : (
                adSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell className="font-medium">{space.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={space.status} />
                    </TableCell>
                    <TableCell>{space.price.toFixed(2)} CHF</TableCell>
                    <TableCell className="text-right">
                      {mode === 'admin' ? (
                        <Button variant="outline" size="sm" disabled>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifica
                        </Button>
                      ) : (
                        <Button
                          variant={space.status === 'available' ? 'default' : 'secondary'}
                          size="sm"
                          disabled
                        >
                          {space.status === 'available' ? 'Prenota' : 'Non disponibile'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
