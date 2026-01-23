
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
  CheckCircle,
  ExternalLink,
  FileText,
  CalendarClock,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, getDocs, query, updateDoc, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SponsorAgenda from '@/components/sponsors/SponsorAgenda';
import { Textarea } from '@/components/ui/textarea';


// --- Admin Approval Queue ---
function AdminApprovalQueue() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);

  // State for rejection dialog
  const [rejectionItem, setRejectionItem] = useState<any | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchQueue = async () => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const adSpacesQuery = query(collection(firestore, 'ad_spaces'));
      const adSpacesSnapshot = await getDocs(adSpacesQuery);
      const adSpaces = adSpacesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sponsorsQuery = query(collection(firestore, 'sponsors'));
      const sponsorsSnapshot = await getDocs(sponsorsQuery);
      const sponsors = sponsorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const sponsorsMap = new Map(sponsors.map((s:any) => [s.userId, s.companyName]));
      
      const queue: any[] = [];
      adSpaces.forEach((space:any) => {
          if (!space.bookings) return;
          Object.entries(space.bookings).forEach(([key, booking]: [string, any]) => {
              if (booking.status === 'processing' && booking.content) {
              const [date, time] = key.split('_');
              queue.push({
                  slotKey: key,
                  adSpaceId: space.id,
                  sponsorId: booking.sponsorId,
                  sponsorName: sponsorsMap.get(booking.sponsorId) || 'Sponsor Sconosciuto',
                  adSpaceName: space.name,
                  pageName: space.page,
                  date,
                  time,
                  content: booking.content,
              });
              }
          });
      });
      
      setApprovalQueue(queue.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));

    } catch (error) {
      console.error("Failed to fetch approval queue:", error);
      toast({ variant: 'destructive', title: "Errore", description: "Impossibile caricare la coda di approvazione." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [firestore, toast]);
  
  async function handleApprove(adSpaceId: string, slotKey: string) {
    if (!firestore) return;
    const adSpaceRef = doc(firestore, 'ad_spaces', adSpaceId);
    const statusUpdatePath = `bookings.${slotKey}.status`;

    try {
      await runTransaction(firestore, async (transaction) => {
        const adSpaceDoc = await transaction.get(adSpaceRef);
        if (!adSpaceDoc.exists()) throw new Error("Spazio pubblicitario non trovato.");
        transaction.update(adSpaceRef, { [statusUpdatePath]: 'approved' });
      });
      toast({ title: "Slot approvato!", description: "Il contenuto è ora attivo." });
      setApprovalQueue(prev => prev.filter(item => item.slotKey !== slotKey));
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Errore", description: error.message });
    }
  }

  async function handleReject() {
    if (!firestore || !rejectionItem || !adminUser) return;
    setIsRejecting(true);
    const { adSpaceId, slotKey } = rejectionItem;
    const adSpaceRef = doc(firestore, 'ad_spaces', adSpaceId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const adSpaceDoc = await transaction.get(adSpaceRef);
        if (!adSpaceDoc.exists()) throw new Error("Spazio pubblicitario non trovato.");
        
        const bookingPathPrefix = `bookings.${slotKey}`;
        transaction.update(adSpaceRef, {
          [`${bookingPathPrefix}.status`]: 'rejected',
          [`${bookingPathPrefix}.adminComment`]: rejectionComment,
          [`${bookingPathPrefix}.reviewedAt`]: serverTimestamp(),
          [`${bookingPathPrefix}.reviewedBy`]: adminUser.uid,
        });
      });

      toast({ title: "Contenuto rifiutato", description: "Il feedback è stato inviato allo sponsor." });
      setApprovalQueue(prev => prev.filter(item => item.slotKey !== slotKey));
      setRejectionItem(null);
      setRejectionComment('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Errore durante il rifiuto", description: error.message });
    } finally {
      setIsRejecting(false);
    }
  }


  if (isLoading) {
    return <Card><CardContent className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>;
  }

  if (approvalQueue.length === 0) {
    return null; // Don't show the card if the queue is empty
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Coda di Approvazione Contenuti</CardTitle>
          <CardDescription>Revisiona e approva i contenuti inviati dagli sponsor.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <Accordion type="single" collapsible className="w-full">
            {approvalQueue.map(item => (
              <AccordionItem key={item.slotKey} value={item.slotKey}>
                <AccordionTrigger>
                  <div className="flex w-full items-center justify-between pr-4">
                    <div>
                      <p className="font-semibold">{item.adSpaceName} ({item.pageName})</p>
                      <p className="text-sm text-muted-foreground">
                        {item.sponsorName} - {format(new Date(item.date), 'dd MMM yyyy', {locale: it})} alle {item.time}
                      </p>
                    </div>
                    <Badge variant="secondary">In attesa</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/30 rounded-md">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Titolo Annuncio</h4>
                      <p>{item.content.title || '-'}</p>
                    </div>
                    {item.content.link && (
                      <div>
                        <h4 className="font-semibold">Link</h4>
                        <a href={item.content.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {item.content.link} <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                    {item.content.fileUrl && (
                      <div>
                        <h4 className="font-semibold">File Caricato</h4>
                        <a href={item.content.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          Visualizza file <FileText className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                       <Button variant="destructive" onClick={() => setRejectionItem(item)}>
                        <XCircle className="mr-2 h-4 w-4" /> Rifiuta
                      </Button>
                      <Button onClick={() => handleApprove(item.adSpaceId, item.slotKey)}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Approva
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      {/* Rejection Dialog */}
      <Dialog open={!!rejectionItem} onOpenChange={(open) => !open && setRejectionItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Contenuto</DialogTitle>
            <DialogDescription>
              Scrivi un commento per spiegare allo sponsor ({rejectionItem?.sponsorName}) il motivo del rifiuto. Questo commento sarà visibile.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo del rifiuto (es. immagine non conforme, testo non appropriato...)"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectionItem(null)}>Annulla</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || rejectionComment.trim().length < 5}
            >
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Invia Rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Admin Approved Slots ---
function AdminApprovedSlots() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [approvedSlots, setApprovedSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }
    const fetchSlots = async () => {
      setIsLoading(true);
      try {
        const adSpacesQuery = query(collection(firestore, 'ad_spaces'));
        const adSpacesSnapshot = await getDocs(adSpacesQuery);
        const adSpaces = adSpacesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sponsorsQuery = query(collection(firestore, 'sponsors'));
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        const sponsorsMap = new Map(sponsorsSnapshot.docs.map(d => [d.data().userId, d.data().companyName]));

        const slots: any[] = [];
        adSpaces.forEach((space: any) => {
          if (!space.bookings) return;
          Object.entries(space.bookings).forEach(([key, booking]: [string, any]) => {
            if (booking.status === 'approved') {
              const [date, time] = key.split('_');
              slots.push({
                id: key,
                adSpaceName: space.name,
                pageName: space.page,
                sponsorName: sponsorsMap.get(booking.sponsorId) || 'Sponsor Sconosciuto',
                date,
                time,
              });
            }
          });
        });

        setApprovedSlots(slots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));

      } catch (error) {
        console.error("Failed to fetch approved slots:", error);
        toast({ variant: 'destructive', title: "Errore", description: "Impossibile caricare gli slot approvati." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, [firestore, toast]);
  
  if (isLoading) {
    return <Card><CardContent className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>;
  }

  if (approvedSlots.length === 0) {
    return null; // Don't show the card if there are no approved slots
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slot Approvati (Tutti gli Sponsor)</CardTitle>
        <CardDescription>
          Riepilogo di tutti gli slot pubblicitari approvati sulla piattaforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {approvedSlots.map((slot) => {
          const slotDate = new Date(slot.date);
          const isSlotInThePast = isPast(slotDate) && !isToday(slotDate);
          return (
            <div key={slot.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <div>
                <p className="font-semibold">{slot.adSpaceName} - <span className="font-normal">{slot.sponsorName}</span></p>
                <p className="text-sm text-muted-foreground">
                  {format(slotDate, 'eee dd MMM yyyy', { locale: it })} alle {slot.time}
                </p>
              </div>
              {isSlotInThePast ? (
                <Badge variant="outline" className="text-muted-foreground">
                  <CalendarClock className="mr-1 h-3 w-3" />
                  Passato
                </Badge>
              ) : (
                <Badge className="bg-green-600 hover:bg-green-600/80 text-white">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Attivo/Futuro
                </Badge>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  );
}


// Types
type SponsorStatus = 'pending' | 'approved' | 'rejected';
type SponsorData = {
  id: string;
  userId: string;
  companyName: string;
  approvalStatus: SponsorStatus;
  email: string;
  registrationDate: string;
  address: string;
  firstName: string;
  lastName: string;
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
  const [dialogAction, setDialogAction] = useState<{ action: SponsorStatus; sponsor: SponsorData } | null>(null);
  const [detailsSponsor, setDetailsSponsor] = useState<SponsorData | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const fetchSponsors = async () => {
      setIsLoading(true);
      try {
        const sponsorsQuery = query(collection(firestore, 'sponsors'));
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        const sponsorProfiles = sponsorsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

        if (sponsorProfiles.length === 0) {
            setSponsors([]);
            setIsLoading(false);
            return;
        }

        const userIds = sponsorProfiles.map(s => s.userId).filter(Boolean);
        if (userIds.length === 0) {
            setSponsors([]);
            setIsLoading(false);
            return;
        }

        const usersQuery = query(collection(firestore, 'users'), where('__name__', 'in', userIds));
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
            address: profile.address || 'N/D',
            firstName: user?.firstName || 'N/D',
            lastName: user?.lastName || 'N/D',
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

      <AdminApprovalQueue />

      <AdminApprovedSlots />

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
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setDetailsSponsor(sponsor)}>
                              Apri Dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-green-600 focus:text-green-700'
                              disabled={sponsor.approvalStatus === 'approved'}
                              onSelect={() => setDialogAction({ action: 'approved', sponsor })}
                            >
                              Approva
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-yellow-600 focus:text-yellow-700'
                              disabled={sponsor.approvalStatus !== 'approved'}
                              onSelect={() => setDialogAction({ action: 'pending', sponsor })}
                            >
                              Sospendi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700"
                              disabled={sponsor.approvalStatus === 'rejected'}
                              onSelect={() => setDialogAction({ action: 'rejected', sponsor })}
                            >
                              Rifiuta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      
      <Card>
        <CardHeader>
            <CardTitle>Agenda Generale Sponsor</CardTitle>
            <CardDescription>
                Visualizza e prenota slot per conto di uno sponsor. Seleziona uno spazio per iniziare.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SponsorAgenda />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!dialogAction} onOpenChange={(open) => !open && setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Azione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler cambiare lo stato di <strong>{dialogAction?.sponsor.companyName}</strong> in "{statusConfig[dialogAction?.action || 'pending'].label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDialogAction(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialogAction) {
                  handleStatusUpdate(dialogAction.sponsor.id, dialogAction.action);
                  setDialogAction(null);
                }
              }}
              className={cn({
                  'bg-green-600 text-white hover:bg-green-700': dialogAction?.action === 'approved',
                  'bg-yellow-500 text-white hover:bg-yellow-600': dialogAction?.action === 'pending',
                  [buttonVariants({ variant: 'destructive' })]: dialogAction?.action === 'rejected',
              })}
            >
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={!!detailsSponsor} onOpenChange={(open) => !open && setDetailsSponsor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettagli Sponsor</DialogTitle>
            <DialogDescription>
              Dati di registrazione per <strong>{detailsSponsor?.companyName}</strong>.
            </DialogDescription>
          </DialogHeader>
          {detailsSponsor && (
            <div className="py-4 space-y-4">
              <div className="flex items-center">
                  <p className="w-32 text-sm text-muted-foreground">Azienda</p>
                  <p className="font-semibold">{detailsSponsor.companyName}</p>
              </div>
              <div className="flex items-center">
                  <p className="w-32 text-sm text-muted-foreground">Titolare</p>
                  <p className="font-semibold">{detailsSponsor.firstName} {detailsSponsor.lastName}</p>
              </div>
              <div className="flex items-center">
                  <p className="w-32 text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{detailsSponsor.email}</p>
              </div>
              <div className="flex items-center">
                  <p className="w-32 text-sm text-muted-foreground">Indirizzo</p>
                  <p className="font-semibold">{detailsSponsor.address}</p>
              </div>
              <div className="flex items-center">
                  <p className="w-32 text-sm text-muted-foreground">Registrato il</p>
                  <p className="font-semibold">{format(new Date(detailsSponsor.registrationDate), 'dd MMM yyyy', { locale: it })}</p>
              </div>
              <div className="flex items-center">
                  <p className="w-32 text-sm text-muted-foreground">Stato</p>
                  <StatusBadge status={detailsSponsor.approvalStatus} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsSponsor(null)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
