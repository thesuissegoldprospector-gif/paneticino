'use client';

import { useParams } from 'next/navigation';
import BakerReportClient from './BakerReportClient';

// Questa pagina ora funge solo da contenitore per il componente client.
// Tutta la logica di caricamento dati è stata spostata sul client
// per risolvere i problemi di autenticazione e garantire la coerenza dei dati.
export default function BakerReportPage() {
  const params = useParams();
  const bakerUserId = params.bakerId as string;

  return <BakerReportClient bakerUserId={bakerUserId} />;
}
