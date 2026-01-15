'use client';

import { useParams } from 'next/navigation';
import BakerReportClient from './BakerReportClient';

// Questa pagina ora funge solo da contenitore per il componente client.
// Tutta la logica di caricamento dati è stata spostata sul client
// per risolvere i problemi di autenticazione sul server.
export default function BakerReportPage() {
  const params = useParams();
  const bakerId = params.bakerId as string;

  return <BakerReportClient bakerId={bakerId} />;
}
