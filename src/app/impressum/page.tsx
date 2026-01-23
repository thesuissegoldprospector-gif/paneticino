
import { Separator } from "@/components/ui/separator";

export default function ImpressumPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-8 text-foreground">
        <header className="text-center">
          <h1 className="text-4xl font-headline">Impressum</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informazioni ai sensi del diritto svizzero.
          </p>
        </header>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Fornitore del servizio</h2>
          <div className="space-y-1">
              <h3 className="font-semibold">Nome del progetto / piattaforma:</h3>
              <p className="text-muted-foreground">PaneDelivery</p>
          </div>
          <div className="space-y-1">
              <h3 className="font-semibold">Titolare / Responsabile:</h3>
              <p className="text-muted-foreground">KappelerIncorporate</p>
          </div>
           <div className="space-y-1">
              <h3 className="font-semibold">Indirizzo:</h3>
              <p className="text-muted-foreground">Via alle Bolle</p>
              <p className="text-muted-foreground">6997, Sessa</p>
              <p className="text-muted-foreground">Svizzera</p>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Contatti</h2>
          <div className="space-y-1">
              <h3 className="font-semibold">Email:</h3>
              <p className="text-muted-foreground">info@panedelivery.ch</p>
          </div>
           <div className="space-y-1">
              <h3 className="font-semibold">Telefono (facoltativo):</h3>
              <p className="text-muted-foreground">+41 91 123 45 67</p>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Informazioni legali (se applicabili)</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Forma giuridica: Ditta individuale</li>
            <li>Numero IDE (UID): Non presente</li>
            <li>Iscrizione al registro di commercio: Non applicabile</li>
            <li>Sede legale: Sessa, Ticino</li>
          </ul>
           <p className="text-xs text-muted-foreground pt-2">*(Le informazioni sopra sono obbligatorie solo se richieste dalla forma giuridica)*</p>
        </section>
        
        <Separator />
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Responsabilità dei contenuti</h2>
          <p>Il gestore della piattaforma si impegna a mantenere i contenuti aggiornati e corretti. Non viene tuttavia garantita l’accuratezza, completezza o attualità delle informazioni pubblicate.</p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Responsabilità per i link</h2>
           <p>La piattaforma può contenere collegamenti a siti web esterni di terzi. Il gestore non ha alcuna influenza sui contenuti di tali siti e non si assume responsabilità per essi.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Diritti d’autore</h2>
          <p>Tutti i contenuti pubblicati su questa piattaforma (testi, immagini, loghi, design) sono protetti dal diritto d’autore svizzero. Qualsiasi utilizzo non autorizzato è vietato senza il consenso scritto del titolare.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Protezione dei dati</h2>
          <p>Il trattamento dei dati personali avviene nel rispetto della <strong>Legge federale sulla protezione dei dati (LPD)</strong>.</p>
          <p>Per maggiori informazioni consultare:</p>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Privacy Policy</li>
            <li>Cookie Policy</li>
          </ul>
        </section>

        <Separator />
        
        <footer className="text-center text-sm text-muted-foreground">
            <p>Ultimo aggiornamento: 28 Luglio 2024</p>
        </footer>

      </div>
    </div>
  );
}
