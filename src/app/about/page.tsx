
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wheat, Heart, Users, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-muted/50">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/about-hero/1920/1080"
            alt="Warm and inviting bakery interior"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-10"
            data-ai-hint="bakery interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <h1 className="font-headline text-4xl md:text-6xl text-primary">
            Chi Siamo
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-semibold text-foreground">
            La fragranza del pane artigianale, consegnata con amore.
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">
            PaneDelivery nasce dalla passione per i prodotti da forno di alta qualità e dal desiderio di sostenere le piccole realtà artigianali del nostro territorio. Siamo un ponte tra te e i migliori panettieri locali, portando la freschezza e il sapore autentico direttamente a casa tua.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://picsum.photos/seed/baker-portrait/800/800"
                alt="Portrait of a smiling baker holding bread"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                data-ai-hint="baker portrait"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-headline text-foreground mb-6">
                La Nostra Missione
              </h2>
              <p className="text-muted-foreground mb-4">
                In un mondo sempre più dominato dalla grande distribuzione, le piccole botteghe artigiane rischiano di scomparire. Noi di PaneDelivery crediamo nel valore insostituibile del lavoro manuale, della tradizione e degli ingredienti genuini.
              </p>
              <p className="text-muted-foreground mb-6">
                La nostra missione è duplice: offrire ai clienti un'esperienza comoda e di alta qualità, e fornire ai panettieri artigianali uno strumento digitale per raggiungere un pubblico più ampio, valorizzando il loro prezioso lavoro. Ogni acquisto sulla nostra piattaforma è un gesto concreto di supporto all'economia locale.
              </p>
              <Button asChild>
                <Link href="/bakeries">
                  Esplora i nostri panettieri
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline text-center mb-12">
            I Nostri Valori
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader className="items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Wheat className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Qualità Artigianale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Selezioniamo solo panettieri che utilizzano ingredienti di prima scelta e metodi tradizionali.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader className="items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Sostegno Locale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Crediamo in una comunità forte e supportiamo attivamente le piccole imprese del territorio.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader className="items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Comunità</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Uniamo clienti e produttori, creando un ecosistema virtuoso basato sulla fiducia e sulla passione condivisa.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-none bg-transparent">
              <CardHeader className="items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Innovazione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Offriamo strumenti moderni per rendere l'eccellenza artigianale accessibile a tutti, con semplicità.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-headline text-foreground">Unisciti a Noi</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Che tu sia un amante del buon pane o un panettiere orgoglioso delle proprie creazioni, c'è un posto per te nella famiglia di PaneDelivery.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" asChild>
                    <Link href="/signup">Registrati come Cliente</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/baker-application">Diventa un Panettiere Partner</Link>
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
}
