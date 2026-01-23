
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-8 text-foreground">
        <header className="text-center">
          <h1 className="text-4xl font-headline">Termini di Servizio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ultimo aggiornamento: 27 Luglio 2024
          </p>
        </header>

        <p className="text-center">
          L’accesso e l’utilizzo di questa piattaforma comportano l’accettazione dei presenti Termini di Servizio. Se non accetti anche solo una parte dei termini, ti invitiamo a non utilizzare il servizio.
        </p>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. Descrizione del Servizio</h2>
          <p>
            La piattaforma offre un sistema digitale che consente:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>agli <strong>utenti</strong> di navigare e interagire con contenuti pubblici;</li>
            <li>alle <strong>attività locali</strong> (es. panetterie) di creare un profilo dedicato;</li>
            <li>agli <strong>sponsor</strong> di prenotare spazi pubblicitari tramite un sistema di agenda;</li>
            <li>agli <strong>amministratori</strong> di gestire e moderare i contenuti pubblicitari.</li>
          </ul>
          <p>
            Il servizio può essere esteso in futuro ad altri settori commerciali.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">2. Registrazione e Account</h2>
          <p>
            Alcune funzionalità richiedono la creazione di un account. L’utente è responsabile di:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>fornire informazioni corrette e aggiornate;</li>
            <li>mantenere riservate le proprie credenziali di accesso;</li>
            <li>tutte le attività svolte tramite il proprio account.</li>
          </ul>
          <p>
            La piattaforma si riserva il diritto di sospendere o chiudere account in caso di violazioni.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3. Ruoli e Permessi</h2>
          <p>
            La piattaforma prevede diversi ruoli, tra cui:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Utente</li>
            <li>Panettiere / Attività</li>
            <li>Sponsor</li>
            <li>Amministratore</li>
          </ul>
          <p>
            Ogni ruolo ha funzionalità e permessi differenti. L’accesso a determinate aree o dati è limitato in base al ruolo assegnato.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">4. Spazi Pubblicitari e Prenotazioni</h2>
          <p>
            Gli sponsor possono prenotare spazi pubblicitari tramite un’agenda digitale con slot temporali.
          </p>
          <h3 className="font-semibold">Stati degli slot:</h3>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Disponibile</li>
            <li>In elaborazione</li>
            <li>Approvato</li>
            <li>Rifiutato</li>
          </ul>
          <p>
            Uno slot in elaborazione o approvato non è prenotabile da altri sponsor.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">5. Contenuti Pubblicitari e Approvazione</h2>
          <p>
            Tutti i contenuti pubblicitari sono soggetti a revisione da parte dell’amministratore. La piattaforma si riserva il diritto di:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>approvare o rifiutare i contenuti;</li>
            <li>richiedere modifiche;</li>
            <li>rimuovere contenuti non conformi ai presenti termini o alla normativa vigente.</li>
          </ul>
          <p>
            In caso di rifiuto, lo sponsor può correggere e reinviare il contenuto.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">6. Responsabilità dei Contenuti</h2>
          <p>
            Lo sponsor è l’unico responsabile dei contenuti caricati, inclusi testi, immagini, link e media. È vietato pubblicare contenuti:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>illegali, ingannevoli o offensivi;</li>
            <li>che violino diritti di terzi;</li>
            <li>contrari alla legge o al buon costume.</li>
          </ul>
           <p>
            La piattaforma non è responsabile per i contenuti forniti dagli utenti o sponsor.
          </p>
        </section>

         <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">7. Pagamenti e Servizi a Pagamento</h2>
          <p>
            Alcune funzionalità possono essere a pagamento. I dettagli relativi a prezzi, modalità di pagamento, eventuali rimborsi o penali saranno indicati chiaramente prima della conferma.
          </p>
          <p>
            La piattaforma si riserva il diritto di modificare i prezzi previo avviso.
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">8. Limitazione di Responsabilità</h2>
          <p>
            La piattaforma è fornita “così com’è”. Non garantiamo:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>assenza totale di errori o interruzioni;</li>
            <li>risultati specifici derivanti dall’uso del servizio.</li>
          </ul>
          <p>
            Nei limiti consentiti dalla legge, la piattaforma non è responsabile per danni diretti o indiretti derivanti dall’uso del servizio.
          </p>
        </section>

        <Separator />
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">9. Sospensione e Interruzione del Servizio</h2>
          <p>
            La piattaforma può:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>sospendere temporaneamente il servizio per manutenzione;</li>
            <li>interrompere o modificare funzionalità in qualsiasi momento;</li>
            <li>chiudere account in caso di violazioni gravi.</li>
          </ul>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">10. Privacy e Protezione dei Dati</h2>
          <p>
            Il trattamento dei dati personali avviene nel rispetto della normativa vigente. Per maggiori dettagli, consulta la nostra <strong>Informativa sulla Privacy</strong>.
          </p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">11. Modifiche ai Termini</h2>
          <p>
            I presenti Termini di Servizio possono essere aggiornati in qualsiasi momento. Le modifiche avranno effetto dalla data di pubblicazione.
          </p>
          <p>
            L’uso continuato della piattaforma implica l’accettazione dei nuovi termini.
          </p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">12. Contatti</h2>
          <p>
            Per qualsiasi informazione o chiarimento puoi contattarci tramite la sezione <strong>Contatti</strong> della piattaforma.
          </p>
        </section>
        
        <Separator />

        <footer className="text-center text-muted-foreground">
            <p>Utilizzando la piattaforma, dichiari di aver letto, compreso e accettato i presenti Termini di Servizio.</p>
        </footer>

      </div>
    </div>
  );
}
