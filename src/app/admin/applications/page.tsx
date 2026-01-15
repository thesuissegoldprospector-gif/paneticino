'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, getDocs, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldX, AlertTriangle, Users, ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfWeek, startOfMonth, subDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

// ---------- SUB-COMPONENTS ----------

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'In attesa', color: 'bg-yellow-500 hover:bg-yellow-500/80' },
    approved: { label: 'Approvato', color: 'bg-green-500 hover:bg-green-500/80' },
    rejected: { label: 'Rifiutato', color: 'bg-red-500 hover:bg-red-500/80' },
};
const OrderStatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
    return <Badge className={cn("text-white", config.color)}>{config.label}</Badge>;
};

const OrdersChart = ({ orders, isLoading }: { orders: any[], isLoading: boolean }) => {
  const [timeRange, setTimeRange] = useState('7days');

  const data = useMemo(() => {
    if (!orders) return [];

    const now = new Date();
    let startDate: Date;

    if (timeRange === '7days') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
    } else if (timeRange === '30days') {
      startDate = startOfMonth(now);
    } else { // '24hours'
      startDate = subDays(now, 1);
    }
    
    const filteredOrders = orders.filter(o => o.createdAt && o.createdAt.toDate() >= startDate);

    const groupedData = filteredOrders.reduce((acc, order) => {
        const date = order.createdAt.toDate();
        const key = timeRange === '24hours' ? format(date, 'HH:00') : format(date, 'dd MMM', { locale: it });
        
        if (!acc[key]) {
            acc[key] = { name: key, ordini: 0 };
        }
        acc[key].ordini++;
        return acc;
    }, {} as Record<string, { name: string, ordini: number }>);
    
    return Object.values(groupedData).sort((a,b) => a.name.localeCompare(b.name));

  }, [orders, timeRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Andamento Ordini</CardTitle>
        <CardDescription>
            <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] h-8 mt-2">
                    <SelectValue placeholder="Seleziona periodo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="24hours">Ultime 24 ore</SelectItem>
                    <SelectItem value="7days">Questa settimana</SelectItem>
                    <SelectItem value="30days">Questo mese</SelectItem>
                </SelectContent>
            </Select>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex h-[300px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ordini" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};


const BakerOrdersDrawer = ({ baker, open, onOpenChange }: { baker: any | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const firestore = useFirestore();
    const [filter, setFilter] = useState('all');

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !baker) return null;
        let q = query(collection(firestore, 'orders'), where('bakerId', '==', baker.id), orderBy('createdAt', 'desc'));
        if (filter !== 'all') {
             // 'pending' and 'accepted' are considered "in attesa"
            if (filter === 'pending') {
                q = query(q, where('status', 'in', ['pending', 'accepted', 'preparing', 'delivering']));
            } else { // 'completed'
                q = query(q, where('status', '==', 'completed'));
            }
        }
        return q;
    }, [firestore, baker, filter]);

    const { data: orders, isLoading } = useCollection(ordersQuery);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <div className="container mx-auto max-w-4xl py-4">
                    <DrawerHeader>
                        <DrawerTitle>Ordini per {baker?.companyName}</DrawerTitle>
                        <DrawerDescription>
                             <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[180px] h-8 mt-2">
                                    <SelectValue placeholder="Filtra per stato" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutti gli ordini</SelectItem>
                                    <SelectItem value="pending">In attesa</SelectItem>
                                    <SelectItem value="completed">Evasi</SelectItem>
                                </SelectContent>
                            </Select>
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="overflow-y-auto px-4">
                        {isLoading ? <Loader2 className="animate-spin mx-auto my-8" /> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Stato</TableHead>
                                        <TableHead className="text-right">Totale</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders?.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>{order.customerName}</TableCell>
                                            <TableCell>{order.createdAt ? format(order.createdAt.toDate(), 'dd/MM/yy HH:mm') : ''}</TableCell>
                                            <TableCell>{order.status}</TableCell>
                                            <TableCell className="text-right">{order.total.toFixed(2)}€</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!isLoading && orders?.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun ordine trovato per questo filtro.</p>}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

// ---------- MAIN DASHBOARD COMPONENT ----------

function AdminDashboard() {
  const firestore = useFirestore();
  const [selectedBaker, setSelectedBaker] = useState<any | null>(null);

  // Queries
  const allBakersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'bakers')) : null, [firestore]);
  const allOrdersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders')) : null, [firestore]);
  const allCustomersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'customer')) : null, [firestore]);

  // Data fetching
  const { data: bakers, isLoading: isLoadingBakers } = useCollection(allBakersQuery);
  const { data: orders, isLoading: isLoadingOrders } = useCollection(allOrdersQuery);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection(allCustomersQuery);
  
  // Memoized calculations for performance
  const stats = useMemo(() => {
    if (!orders || !bakers) return { total: 0, completed: 0, pending: 0 };
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status !== 'completed' && o.status !== 'rejected').length
    };
  }, [orders, bakers]);
  
  const bakersWithOrderCounts = useMemo(() => {
    if (!bakers || !orders) return [];
    return bakers.map(baker => {
      const bakerOrders = orders.filter(o => o.bakerId === baker.id);
      return {
        ...baker,
        pendingOrders: bakerOrders.filter(o => o.status !== 'completed' && o.status !== 'rejected').length,
        completedOrders: bakerOrders.filter(o => o.status === 'completed').length,
      };
    });
  }, [bakers, orders]);

  const isLoading = isLoadingBakers || isLoadingOrders || isLoadingCustomers;

  const handleApproval = async (bakerId: string, currentStatus: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    const bakerRef = doc(firestore, 'bakers', bakerId);
    
    try {
        await updateDoc(bakerRef, { approvalStatus: newStatus });
    } catch (e) {
        console.error("Failed to update approval status", e);
    }
  };

  return (
    <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Clienti Totali" value={customers?.length ?? 0} icon={Users} isLoading={isLoading} />
            <StatCard title="Ordini Totali" value={stats.total} icon={ShoppingCart} isLoading={isLoading} />
            <StatCard title="Ordini Evasi" value={stats.completed} icon={CheckCircle} isLoading={isLoading} />
            <StatCard title="Ordini in Attesa" value={stats.pending} icon={Clock} isLoading={isLoading} />
        </div>
        
        {/* Chart */}
        <OrdersChart orders={orders || []} isLoading={isLoadingOrders} />

        {/* Bakers Table */}
        <Card>
            <CardHeader>
                <CardTitle>Gestione Panettieri</CardTitle>
                <CardDescription>Revisiona, approva o rifiuta le richieste e monitora gli ordini.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingBakers ? <Loader2 className="animate-spin" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Panettiere</TableHead>
                                <TableHead>Stato</TableHead>
                                <TableHead>Ordini in Attesa</TableHead>
                                <TableHead>Ordini Evasi</TableHead>
                                <TableHead>Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bakersWithOrderCounts.map(baker => (
                                <TableRow key={baker.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedBaker(baker)}>
                                    <TableCell className="font-medium">{baker.companyName}</TableCell>
                                    <TableCell><OrderStatusBadge status={baker.approvalStatus} /></TableCell>
                                    <TableCell>{baker.pendingOrders}</TableCell>
                                    <TableCell>{baker.completedOrders}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant={baker.approvalStatus === 'approved' ? 'secondary' : 'default'} size="sm" onClick={(e) => e.stopPropagation()}>
                                                {baker.approvalStatus === 'approved' ? 'Sospendi' : 'Approva'}
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Stai per cambiare lo stato di approvazione per <strong>{baker.companyName}</strong>.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleApproval(baker.id, baker.approvalStatus)}>
                                                Conferma
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        
        {/* Drawer for Baker Orders */}
        <BakerOrdersDrawer baker={selectedBaker} open={!!selectedBaker} onOpenChange={(open) => !open && setSelectedBaker(null)} />
    </div>
  );
}


// ---------- PAGE WRAPPER AND AUTH GUARD ----------

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef);

  const isLoading = isUserLoading || isAdminLoading;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Autenticazione richiesta</h2>
        <p className="text-muted-foreground">
          Devi effettuare l'accesso per visualizzare questa pagina.
        </p>
        <Button asChild>
          <Link href="/login">Vai al Login</Link>
        </Button>
      </div>
    );
  }

  if (!adminDoc) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShieldX className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Accesso Negato</h2>
        <p className="text-muted-foreground">
          Non disponi delle autorizzazioni necessarie per visualizzare questa pagina.
        </p>
         <Button asChild variant="outline">
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
        <AdminDashboard />
    </div>
  );
}
