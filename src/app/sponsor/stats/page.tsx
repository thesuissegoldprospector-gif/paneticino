'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SponsorStatsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/sponsor/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Dashboard
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Statistiche Sponsor</CardTitle>
          <CardDescription>Questa funzionalità è in fase di sviluppo.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
