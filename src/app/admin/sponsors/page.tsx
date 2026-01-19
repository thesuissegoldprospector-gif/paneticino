'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';

export default function AdminSponsorsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
             <Wrench className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">Pagina in Manutenzione</CardTitle>
          <CardDescription>
            La sezione per la gestione degli sponsor è in fase di ristrutturazione e sarà disponibile a breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/applications">Torna alla Dashboard Admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
