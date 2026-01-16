'use client';

import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';


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
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [commissionPercentage, setCommissionPercentage] = useState(15);
  const [subscriptionFee, setSubscriptionFee] = useState(0);

  // Fetch baker details on the client by querying for the userId
  const bakerQuery = useMemoFirebase(() => {
    if (!firestore || !bakerUserId) return null;
    return query(collection(firestore, 'bakers'), where('userId', '==', bakerUserId));
  }, [firestore, bakerUserId]);
  const { data: bakerCollection, isLoading: isLoadingBaker } = useCollection(bakerQuery);
  const baker = useMemo(() => bakerCollection?.[0], [bakerCollection]);


  // Fetch orders for this baker on the client
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !bakerUserId) return null;
    return query(
      collection(firestore, "orders"),
      where("bakerId", "==", bakerUserId)
    );
  }, [firestore, bakerUserId]);
  const { data: unsortedOrders, isLoading: isLoadingOrders } = useCollection(ordersQuery);
  
  // Sort on the client
  const orders = useMemo(() => {
    if (!unsortedOrders) return [];
    return [...unsortedOrders].sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
    });
  }, [unsortedOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        if (!order.createdAt) return false; // Make sure createdAt exists
        if (!date?.from && !date?.to) return true;
        
        const orderDate = order.createdAt.toDate();
        
        if (date.from && orderDate < date.from) return false;

        if (date.to) {
            const toDate = new Date(date.to);
            toDate.setHours(23, 59, 59, 999); // Set to end of day
            if (orderDate > toDate) return false;
        }
        
        return true;
    });
  }, [orders, date]);


  if (isLoadingBaker || isLoadingOrders) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Caricamento report...</p>
      </div>
    );
  }

  if (!baker) {
     return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <p className="text-destructive">Impossibile trovare il profilo del panettiere per ID: {bakerUserId}</p>
      </div>
    );
  }
  
  // Calculate summary stats based on filtered orders
  const completedOrders = filteredOrders.filter(order => order.status === 'completed');
  const totalRevenueCompleted = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  // New calculations for commission and total
  const commissionAmount = totalRevenueCompleted * (commissionPercentage / 100);
  const totalToBaker = totalRevenueCompleted - commissionAmount - subscriptionFee;
  
  const subscriptionOptions = [
    { label: 'Prova 1 Mese', value: 0 },
    { label: 'Base', value: 19.90 },
    { label: 'Standard', value: 29.90 },
    { label: 'Premium', value: 39.90 },
  ];

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
          <CardDescription>Riepilogo degli ordini. Filtra per data per periodi specifici.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Date filter section */}
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
                 <Button variant="ghost" onClick={() => setDate(undefined)}>Reset</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Incasso (Completati nel periodo)</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">€{totalRevenueCompleted.toFixed(2)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ordini nel periodo</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{filteredOrders.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completati nel periodo</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{completedOrders.length}</p></CardContent>
                </Card>
            </div>

            {/* Orders Table */}
            <h3 className="text-lg font-semibold mb-4">Dettaglio Ordini (Filtrato)</h3>
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
                        {filteredOrders.map(order => (
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
                {filteredOrders.length === 0 && <p className="text-center text-muted-foreground p-8">Nessun ordine trovato per questo periodo.</p>}
            </div>

             {/* Calculator Section */}
            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Calcolo Competenze</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Commission Calculator */}
                    <div>
                        <Card>
                            <CardHeader><CardTitle>Commissioni e Abbonamento</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Percentuale Commissione (%)</Label>
                                    <Input 
                                        id="commission"
                                        type="number"
                                        value={commissionPercentage}
                                        onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                                        className="w-24"
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Piano di Abbonamento</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {subscriptionOptions.map(opt => (
                                            <Button 
                                                key={opt.label}
                                                variant={subscriptionFee === opt.value ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSubscriptionFee(opt.value)}
                                            >
                                                {opt.label} (€{opt.value.toFixed(2)})
                                            </Button>
                                        ))}
                                    </div>
                                    <Button size="sm" variant="ghost" className="mt-2 text-xs h-auto p-1" onClick={() => setSubscriptionFee(0)}>Rimuovi abbonamento</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Final Summary */}
                    <div>
                        <Card>
                            <CardHeader><CardTitle>Riepilogo Finale</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-right">
                                     <p className="flex justify-between"><span>Incasso Lordo (nel periodo):</span> <span className="font-semibold font-mono">{totalRevenueCompleted.toFixed(2)}€</span></p>
                                     <Separator />
                                     <p className="flex justify-between text-destructive"><span>- Commissioni ({commissionPercentage}%):</span> <span className="font-semibold font-mono">{commissionAmount.toFixed(2)}€</span></p>
                                     <p className="flex justify-between text-destructive"><span>- Abbonamento:</span> <span className="font-semibold font-mono">{subscriptionFee.toFixed(2)}€</span></p>
                                     <Separator />
                                     <p className="flex justify-between font-bold text-lg pt-2 mt-2"><span>Totale Netto per Panettiere:</span> <span className="font-semibold font-mono">{totalToBaker.toFixed(2)}€</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}
