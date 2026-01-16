'use client';

import { useParams } from 'next/navigation';
import BakeryDetailClient from './BakeryDetailClient';

/**
 * This page now acts as a client-side wrapper.
 * It extracts the bakery ID from the URL and passes it to the 
 * BakeryDetailClient component, which is now responsible for all data fetching.
 * This resolves production build issues related to server-side Firebase initialization.
 */
export default function BakeryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) {
    // This case should be handled by Next.js routing, but as a fallback:
    return <div>Caricamento...</div>;
  }

  return <BakeryDetailClient bakeryId={id} />;
}
