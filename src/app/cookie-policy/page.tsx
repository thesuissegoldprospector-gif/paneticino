
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-8 text-foreground">
        <header className="text-center">
          <h1 className="text-4xl font-headline">Cookie Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ultimo aggiornamento: 28 Luglio 2024
          </p>
        </header>

        <p className="text-center">
          La presente Cookie Policy spiega cosa sono i cookie, come vengono utilizzati da questa piattaforma e come l’utente può gestirli, in conformità alla normativa vigente (Regolamento UE 2016/679 – GDPR e Direttiva ePrivacy).
        </p>
        <p className="text-center">
            Utilizzando il sito, l’utente acconsente all’uso dei cookie secondo quanto descritto nella presente informativa, salvo diversa configurazione delle preferenze.
        </p>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti web inviano al dispositivo dell’utente (computer, smartphone, tablet) durante la navigazione. Servono a migliorare l’esperienza di utilizzo, ricordare preferenze e garantire il corretto funzionamento del sito.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">2. Tipologie di cookie utilizzate</h2>
          <h3 className="font-semibold pt-2">Cookie tecnici (necessari)</h3>
          <p>
            Questi cookie sono indispensabili per il corretto funzionamento della piattaforma e non richiedono il consenso dell’utente. Esempi di utilizzo:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>autenticazione e accesso all’account</li>
            <li>gestione della sessione utente</li>
            <li>sicurezza e prevenzione di accessi non autorizzati</li>
            <li>salvataggio delle preferenze di base</li>
          </ul>
          <p>
            Senza questi cookie, alcune funzionalità del sito potrebbero non essere disponibili.
          </p>

          <h3 className="font-semibold pt-2">Cookie funzionali</h3>
          <p>
            Questi cookie permettono di migliorare l’esperienza dell’utente ricordando alcune scelte effettuate (es. lingua, preferenze di visualizzazione). Il loro utilizzo può essere subordinato al consenso dell’utente, se richiesto dalla normativa.
          </p>

          <h3 className="font-semibold pt-2">Cookie di analisi (statistici)</h3>
          <p>
            La piattaforma può utilizzare cookie di analisi, anche di terze parti, per raccogliere informazioni aggregate e anonime sull’utilizzo del sito, come:
          </p>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>numero di visitatori</li>
            <li>pagine visitate</li>
            <li>tempo di permanenza</li>
          </ul>
          <p>Questi dati servono esclusivamente a migliorare il servizio.</p>

          <h3 className="font-semibold pt-2">Cookie di terze parti</h3>
          <p>
            Alcuni servizi esterni integrati nella piattaforma (es. strumenti di analisi, servizi di autenticazione, mappe o contenuti incorporati) possono installare cookie di terze parti. L’uso di tali cookie è regolato dalle informative delle rispettive terze parti.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3. Cookie utilizzati dalla piattaforma</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo di cookie</TableHead>
                <TableHead>Finalità</TableHead>
                <TableHead>Durata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Tecnici</TableCell>
                <TableCell>Funzionamento e sicurezza</TableCell>
                <TableCell>Sessione / Persistente</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Funzionali</TableCell>
                <TableCell>Migliorare l’esperienza utente</TableCell>
                <TableCell>Variabile</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Analitici</TableCell>
                <TableCell>Statistiche anonime</TableCell>
                <TableCell>Variabile</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Terze parti</TableCell>
                <TableCell>Servizi esterni</TableCell>
                <TableCell>Variabile</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground pt-2">*(L’elenco può essere aggiornato in base ai servizi attivi)*</p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">4. Gestione del consenso</h2>
          <p>Alla prima visita, l’utente può:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>accettare tutti i cookie</li>
            <li>rifiutare i cookie non necessari</li>
            <li>personalizzare le preferenze</li>
          </ul>
          <p>Il consenso può essere modificato o revocato in qualsiasi momento tramite il banner di gestione cookie o le impostazioni del browser.</p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">5. Come disabilitare i cookie dal browser</h2>
          <p>L’utente può gestire o disabilitare i cookie direttamente dalle impostazioni del proprio browser. La disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento del sito. I principali browser offrono istruzioni dedicate:</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Safari</li>
                <li>Microsoft Edge</li>
            </ul>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">6. Collegamento con la Privacy Policy</h2>
          <p>Per maggiori informazioni sul trattamento dei dati personali, l’utente è invitato a consultare la <strong>Privacy Policy</strong> della piattaforma.</p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">7. Modifiche alla Cookie Policy</h2>
          <p>La presente Cookie Policy può essere aggiornata in qualsiasi momento. Le modifiche avranno effetto dalla data di pubblicazione.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">8. Contatti</h2>
          <p>Per qualsiasi informazione relativa ai cookie o alla privacy è possibile contattarci tramite la sezione <strong>Contatti</strong> della piattaforma o via email a <strong>info@panedelivery.ch</strong>.</p>
        </section>

        <Separator />

        <footer className="text-center text-muted-foreground">
            <p>Utilizzando la piattaforma, l’utente dichiara di aver letto e compreso la presente Cookie Policy.</p>
        </footer>
      </div>
    </div>
  );
}
