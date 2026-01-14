import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Heart, ShoppingBag } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8 flex flex-col items-center">
        <Avatar className="mb-4 h-24 w-24">
          <AvatarImage src="https://picsum.photos/seed/userprofile/200/200" data-ai-hint="profile person" />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">Mario Rossi</h1>
        <p className="text-muted-foreground">mario.rossi@email.com</p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> I miei indirizzi
            </CardTitle>
            <CardDescription>Gestisci i tuoi indirizzi di consegna.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Casa: Via Roma, 1, 00184 Roma, RM</p>
              <p>Ufficio: Piazza del Colosseo, 1, 00184 Roma, RM</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Panettieri preferiti
            </CardTitle>
            <CardDescription>I tuoi forni del cuore.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc">
              <li>Il Forno Incantato</li>
              <li>Panificio Nonna Rosa</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" /> Storico ordini
            </CardTitle>
            <CardDescription>Rivedi i tuoi ordini passati.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between font-semibold">
                  <p>Ordine #12345</p>
                  <p>€15.70</p>
                </div>
                <p className="text-sm text-muted-foreground">01/07/2024 - Il Forno Incantato</p>
              </div>
              <Separator />
              <div>
                <div className="flex justify-between font-semibold">
                  <p>Ordine #12301</p>
                  <p>€8.50</p>
                </div>
                <p className="text-sm text-muted-foreground">28/06/2024 - Panificio Nonna Rosa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
