'use client';

import Link from 'next/link';
import { Copyright, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Footer() {
  // Initialize state to null. This will be the same on server and client initial render.
  const [year, setYear] = useState<number | null>(null);

  // This effect runs only on the client, after hydration.
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-black text-neutral-400 pb-24 md:pb-0 no-print">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">PaneDelivery</h3>
            <p className="text-sm">
              Ordina pane fresco e dolci dai migliori forni artigianali della Svizzera, consegnati direttamente a casa tua.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4">Link Utili</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white hover:underline">Chi Siamo</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">FAQ</Link></li>
              <li><Link href="/baker-application" className="hover:text-white hover:underline">Diventa un Panettiere</Link></li>
              <li><Link href="/sponsors" className="hover:text-white hover:underline">Spazio Sponsor</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Termini di Servizio</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4">Legale</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white hover:underline">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Cookie Policy</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Impressum</Link></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4">Contatti</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>KappelerIncorporate, Via Fittizia 123, 6900 Lugano, Svizzera</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <a href="mailto:info@panedelivery.ch" className="hover:text-white">info@panedelivery.ch</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>+41 91 123 45 67</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs">
          {/* Only render the year once it's available on the client to prevent hydration mismatch */}
          <p className="flex items-center justify-center gap-1.5 h-4">
            {year && (
              <>
                <Copyright className="h-4 w-4" /> {year} KappelerIncorporate Svizzera. Tutti i diritti riservati.
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
