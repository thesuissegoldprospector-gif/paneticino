import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, CalendarCheck, Lock, Mail, ShieldCheck, UploadCloud, UserPlus } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    icon: <UserPlus className="h-8 w-8 text-primary" />,
    title: '1. Registrati',
    description: "Crea il tuo account sponsor fornendo i dati della tua azienda. L'accesso è semplice e veloce.",
  },
  {
    icon: <CalendarCheck className="h-8 w-8 text-primary" />,
    title: '2. Scegli lo Spazio',
    description: 'Naviga tra le pagine disponibili e prenota gli slot di visibilità che preferisci tramite il nostro calendario interattivo.',
  },
  {
    icon: <UploadCloud className="h-8 w-8 text-primary" />,
    title: '3. Carica il Materiale',
    description: "Invia facilmente la tua immagine promozionale, un breve testo e il link al tuo sito web direttamente dalla tua area personale.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: '4. Vai Online',
    description: "Dopo una rapida approvazione da parte del nostro team, la tua sponsorizzazione sarà attiva e visibile a migliaia di utenti.",
  },
];

export default function SponsorsPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-muted/50">
        <div className="absolute inset-0">
            <Image 
                src="https://picsum.photos/seed/sponsor-hero/1920/1080"
                alt="Sponsor background"
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-10"
                data-ai-hint="business meeting"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <h1 className="font-headline text-4xl md:text-6xl text-primary">
            Spazio Sponsor
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-semibold text-foreground">
            Visibilità locale per aziende che fanno la differenza.
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">
            Entra in contatto con una clientela locale attenta alla qualità e al territorio. Con PaneDelivery, la tua azienda può guadagnare visibilità mirata, raggiungendo migliaia di utenti appassionati di prodotti artigianali, inizialmente in tutto il Ticino. La nostra piattaforma offre spazi pubblicitari esclusivi, prenotabili in modo semplice e trasparente tramite un'agenda dedicata, in attesa di approvazione da parte nostra per garantire la massima coerenza con i nostri valori.
          </p>
        </div>
      </section>

      {/* "Come funziona" Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline text-center mb-12">
            Come Funziona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center transition-transform duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    {step.icon}
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Registration/Login Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
           <Card className="max-w-lg mx-auto shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Richiedi Accesso</CardTitle>
                    <CardDescription>
                        Entra a far parte della nostra rete di sponsor.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Nome Azienda</Label>
                        <div className="relative">
                             <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="companyName" placeholder="La Tua Azienda SRL" className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" placeholder="contatto@la-tua-azienda.ch" className="pl-10"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="password" type="password" placeholder="••••••••" className="pl-10" />
                        </div>
                    </div>
                    <Button className="w-full">Richiedi Accesso</Button>
                    <p className="pt-2 text-center text-xs text-muted-foreground">
                        Il tuo account sarà in attesa di approvazione prima di poter acquistare spazi sponsor.
                    </p>
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
