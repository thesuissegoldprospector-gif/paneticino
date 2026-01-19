
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ChevronRight,
  Search,
  Users,
  Clock,
  PlusCircle,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Types
type SponsorStatus = 'pending' | 'approved' | 'rejected';
type SponsorData = {
  id: string;
  userId: string;
  companyName: string;
  approvalStatus: SponsorStatus;
  email: string;
  registrationDate: string;
};

// --- Sub-components ---

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: number; icon: React.ElementType; isLoading: boolean }) => (
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

const statusConfig: Record<SponsorStatus, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'bg-yellow-500 hover:bg-yellow-500/80' },
  approved: { label: 'Approvato', color: 'bg-green-500 hover:bg-green-500/80' },
  rejected: { label: 'Rifiutato', color: 'bg-red-500 hover:bg-red-500/80' },
};

const StatusBadge = ({ status }: { status: SponsorStatus }) => {
  const config = statusConfig[status] || { label: 'Sconosciuto', color: 'bg-gray-400' };
  return <Badge className={cn('text-white', config.color)}>{config.label}</Badge>;
};

// --- Main Component ---

export default function AdminSponsorsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SponsorStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!firestore) return;

    const fetchSponsors = async () => {
      setIsLoading(true);
      try {
        const sponsorsQuery = query(collection(firestore, 'sponsors'));
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        const sponsorProfiles = sponsorsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const userIds = sponsorProfiles.map(s => s.userId).filter(Boolean);
        if (userIds.length === 0) {
            setSponsors([]);
            setIsLoading(false);
            return;
        }

        const usersQuery = query(collection(firestore, 'users'), where('id', 'in', userIds));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map(usersSnapshot.docs.map(d => [d.id, d.data()]));

        const mergedData: SponsorData[] = sponsorProfiles.map(profile => {
          const user = usersMap.get(profile.userId);
          return {
            id: profile.id,
            userId: profile.userId,
            companyName: profile.companyName,
            approvalStatus: profile.approvalStatus as SponsorStatus,
            email: user?.email || 'N/D',
            registrationDate: user?.registrationDate || new Date().toISOString(),
          };
        });

        setSponsors(mergedData);
      } catch (error) {
        console.error('Failed to fetch sponsors:', error);
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Impossibile caricare i dati degli sponsor.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, [firestore, toast]);

  const handleStatusUpdate = async (sponsorId: string, newStatus: SponsorStatus) => {
    if (!firestore) return;
    const sponsorRef = doc(firestore, 'sponsors', sponsorId);
    try {
      await updateDoc(sponsorRef, { approvalStatus: newStatus });
      setSponsors(prev =>
        prev.map(s => (s.id === sponsorId ? { ...s, approvalStatus: newStatus } : s))
      );
      toast({
        title: 'Stato aggiornato!',
        description: `Lo sponsor è stato ${newStatus === 'approved' ? 'approvato' : newStatus === 'rejected' ? 'rifiutato' : 'messo in attesa'}.`,
      });
    } catch (error) {
      console.error('Failed to update sponsor status:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Impossibile aggiornare lo stato dello sponsor.',
      });
    }
  };

  const filteredSponsors = useMemo(() => {
    return sponsors
      .filter(s => filter === 'all' || s.approvalStatus === filter)
      .filter(
        s =>
          s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
  }, [sponsors, filter, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: sponsors.length,
      pending: sponsors.filter(s => s.approvalStatus === 'pending').length,
    };
  }, [sponsors]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/admin/applications" className="hover:underline">Admin</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Dashboard Sponsor</span>
        </div>
        <h1 className="text-3xl font-bold mt-1">Dashboard Sponsor</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Sponsor Totali" value={stats.total} icon={Users} isLoading={isLoading} />
        <StatCard title="Richieste in Attesa" value={stats.pending} icon={Clock} isLoading={isLoading} />
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Sponsor</CardTitle>
          <CardDescription>
            Revisiona e gestisci le richieste di sponsorizzazione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative w-full md:w-auto md:flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o email..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select onValueChange={value => setFilter(value as any)} defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="approved">Approvato</SelectItem>
                <SelectItem value="rejected">Rifiutato</SelectItem>
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crea Sponsor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Sponsor</DialogTitle>
                  <DialogDescription>
                    Questa funzionalità è in fase di sviluppo.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogTrigger asChild><Button variant="outline">Chiudi</Button></DialogTrigger>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data Registrazione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredSponsors.length > 0 ? (
                  filteredSponsors.map(sponsor => (
                    <TableRow key={sponsor.id}>
                      <TableCell className="font-medium">{sponsor.companyName}</TableCell>
                      <TableCell>
                        <StatusBadge status={sponsor.approvalStatus} />
                      </TableCell>
                      <TableCell>{sponsor.email}</TableCell>
                      <TableCell>
                        {format(new Date(sponsor.registrationDate), 'dd MMM yyyy', { locale: it })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>Apri Dettagli</DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className={cn(
                                    sponsor.approvalStatus !== 'approved' && 'text-green-600 focus:bg-green-100 focus:text-green-700'
                                  )}
                                  disabled={sponsor.approvalStatus === 'approved'}
                                  onClick={(e) => e.preventDefault()}
                                >
                                  Approva
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className={cn(
                                    sponsor.approvalStatus === 'approved' && 'text-yellow-600 focus:bg-yellow-100 focus:text-yellow-700'
                                  )}
                                  disabled={sponsor.approvalStatus !== 'approved'}
                                  onClick={(e) => e.preventDefault()}
                                >
                                  Sospendi
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600 focus:bg-red-100 focus:text-red-700"
                                  disabled={sponsor.approvalStatus === 'rejected'}
                                  onClick={(e) => e.preventDefault()}
                                >
                                  Rifiuta
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Seleziona la nuova azione per <strong>{sponsor.companyName}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              {sponsor.approvalStatus !== 'approved' &&
                                <AlertDialogAction onClick={() => handleStatusUpdate(sponsor.id, 'approved')}>
                                  Approva
                                </AlertDialogAction>
                              }
                              {sponsor.approvalStatus === 'approved' &&
                                <AlertDialogAction className={cn(buttonVariants({ variant: "secondary" }))} onClick={() => handleStatusUpdate(sponsor.id, 'pending')}>
                                  Sospendi
                                </AlertDialogAction>
                              }
                              {sponsor.approvalStatus !== 'rejected' &&
                                <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleStatusUpdate(sponsor.id, 'rejected')}>
                                  Rifiuta
                                </AlertDialogAction>
                              }
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nessun sponsor trovato con i criteri selezionati.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
