'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

type Props = {
  bakerUserId: string;
};

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'In attesa', color: 'bg-yellow-500' },
    accepted: { label: 'Accettato', color: 'bg-blue-500' },
    preparing: { label: 'In preparazione', color: 'bg-indigo-500' },
    delivering: { label: 'In consegna', color: 'bg-purple-500' },
    completed: { label: 'Completato', color: 'bg-green-500' },
    rejected: { label: 'Rifiutato', color: 'bg-red-500' },
};

const OrderStatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
    return <Badge className={cn("text-white", config.color)}>{config.label}</Badge>;
};


export default function BakerReportClient({ bakerUserId }: Props) {
  const firestore = useFirestore();

  // Fetch baker details on the client by querying for the userId
  const bakerQuery = useMemoFirebase(() => {
    if (!firestore || !bakerUserId) return null;
    return query(collection(firestore, 'bakers'), where('userId', '==', bakerUserId), orderBy('__name__'));
  }, [firestore, bakerUserId]);
  const { data: bakerCollection, isLoading: isLoadingBaker } = useCollection(bakerQuery);
  const baker = useMemo(() => bakerCollection?.[0], [bakerCollection]);


  // Fetch orders for this baker on the client
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !bakerUserId) return null;
    return query(
      collection(firestore, "orders"),
      where("bakerId", "==", bakerUserId),
      orderBy("createdAt", "desc")
    );
  }, [firestore, bakerUserId]);
  const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);

  if (isLoadingBaker || isLoadingOrders) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Caricamento report...</p>
      </div>
    );
  }

  if (!baker) {
    // We don't call notFound() here because it's a client component.
    // Instead, we show a message. This could happen if the userId is wrong.
     return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <p className="text-destructive">Impossibile trovare il profilo del panettiere per ID: {bakerUserId}</p>
      </div>
    );
  }
  
  const safeOrders = orders || [];

  // Calculate summary stats
  const totalRevenue = safeOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const completedOrders = safeOrders.filter(order => order.status === 'completed');
  const totalRevenueCompleted = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <style jsx global>{`
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .no-print {
                    display: none;
                }
                main {
                    padding-top: 0 !important;
                }
                .print-container {
                    padding: 0 !important;
                    max-width: 100% !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                 body, .print-card {
                    background: #fff !important;
                    color: #000 !important;
                }
            }
        `}</style>

        <div className="flex items-center justify-between mb-6 no-print">
            <Button variant="outline" asChild>
                <Link href="/admin/applications">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Torna alla Dashboard
                </Link>
            </Button>
             <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Stampa Report
            </Button>
        </div>

      <Card className="print-card">
        <CardHeader>
          <CardTitle>Report Contabile per {baker.companyName}</CardTitle>
          <CardDescription>Riepilogo di tutti gli ordini ricevuti fino ad oggi.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Incasso Totale (Completati)</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">€{totalRevenueCompleted.toFixed(2)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ordini Totali</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{safeOrders.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ordini Completati</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{completedOrders.length}</p></CardContent>
                </Card>
            </div>

            {/* Orders Table */}
            <h3 className="text-lg font-semibold mb-4">Dettaglio Ordini</h3>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Data Ordine</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Indirizzo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Totale</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {safeOrders.map(order => (
                        <TableRow key={order.id}>
                            <TableCell>{order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yy HH:mm', { locale: it }) : 'N/A'}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.deliveryAddress}</TableCell>
                            <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                            <TableCell className="text-right">€{order.total.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {safeOrders.length === 0 && <p className="text-center text-muted-foreground p-8">Nessun ordine trovato per questo panettiere.</p>}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
