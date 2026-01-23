import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-8 text-foreground">
        <header className="text-center">
          <h1 className="text-4xl font-headline">Informativa sulla Privacy (Privacy Policy)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ultimo aggiornamento: 28 Luglio 2024
          </p>
        </header>

        <p className="text-center">
          La presente Informativa sulla Privacy descrive le modalità con cui questa piattaforma raccoglie, utilizza, conserva e protegge i dati personali degli utenti, nel rispetto del Regolamento UE 2016/679 (GDPR) e della normativa vigente.
        </p>
        <p className="text-center">
          Utilizzando il sito e i servizi offerti, l’utente dichiara di aver letto e compreso la presente informativa.
        </p>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1. Titolare del Trattamento</h2>
          <p>
            Il titolare del trattamento dei dati è:
            <br />
            <strong>KappelerIncorporate</strong>
            <br />
            Email di contatto: <strong>info@panedelivery.ch</strong>
          </p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">2. Tipologie di Dati Raccolti</h2>
          <p>
            A seconda dell’utilizzo della piattaforma, possono essere raccolti i seguenti dati personali:
          </p>
          <h3 className="font-semibold pt-2">Dati forniti direttamente dall’utente</h3>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>nome e cognome</li>
            <li>indirizzo email</li>
            <li>numero di telefono</li>
            <li>indirizzo di consegna</li>
            <li>credenziali di accesso</li>
            <li>informazioni del profilo (utente, panettiere, sponsor)</li>
          </ul>
          <h3 className="font-semibold pt-2">Dati relativi a ordini e consegne</h3>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>prodotti ordinati</li>
            <li>preferenze di consegna</li>
            <li>storico degli ordini</li>
            <li>comunicazioni legate alla spedizione</li>
          </ul>
           <h3 className="font-semibold pt-2">Dati relativi alle attività e sponsor</h3>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>contenuti caricati (testi, immagini, materiali pubblicitari)</li>
            <li>prenotazioni di spazi pubblicitari</li>
            <li>stato delle campagne</li>
          </ul>
          <h3 className="font-semibold pt-2">Dati tecnici</h3>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>indirizzo IP</li>
            <li>tipo di browser e dispositivo</li>
            <li>log di accesso</li>
            <li>dati di utilizzo del sito o dell’app</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">3. Finalità del Trattamento</h2>
          <p>I dati personali vengono trattati per le seguenti finalità:</p>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>registrazione e gestione degli account</li>
            <li>utilizzo dei servizi della piattaforma</li>
            <li>gestione di ordini, consegne e spedizioni di prodotti (es. pane)</li>
            <li>comunicazioni tra utenti e attività locali</li>
            <li>gestione e approvazione di contenuti pubblicitari</li>
            <li>assistenza clienti e supporto tecnico</li>
            <li>adempimento di obblighi legali e fiscali</li>
            <li>sicurezza e prevenzione di abusi o utilizzi impropri</li>
          </ul>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">4. Base Giuridica del Trattamento</h2>
          <p>Il trattamento dei dati si basa su:</p>
           <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>consenso espresso dell’utente</li>
            <li>esecuzione di un contratto o di misure precontrattuali</li>
            <li>obblighi legali</li>
            <li>legittimo interesse del titolare (sicurezza, miglioramento del servizio)</li>
          </ul>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">5. Modalità di Trattamento e Sicurezza</h2>
          <p>I dati sono trattati mediante strumenti digitali e organizzativi adeguati a garantire:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>riservatezza</li>
            <li>integrità</li>
            <li>disponibilità</li>
          </ul>
           <p>Sono adottate misure di sicurezza tecniche e organizzative per prevenire accessi non autorizzati, perdita o uso illecito dei dati.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">6. Conservazione dei Dati</h2>
          <p>I dati personali sono conservati:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>per il tempo necessario all’erogazione dei servizi</li>
            <li>fino alla cancellazione dell’account da parte dell’utente</li>
            <li>o per il periodo richiesto dalla normativa vigente</li>
          </ul>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">7. Condivisione dei Dati</h2>
          <p>I dati personali <strong>non vengono venduti</strong> a terzi.</p>

          <h3 className="font-semibold pt-2">Con panettieri e attività locali</h3>
          <p>In caso di <strong>ordini, consegne o spedizioni</strong>, alcuni dati dell’utente possono essere condivisi con l’attività incaricata dell’evasione dell’ordine, esclusivamente per finalità operative, tra cui:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>nome e cognome</li>
            <li>indirizzo di consegna</li>
            <li>recapiti di contatto</li>
            <li>dettagli dell’ordine</li>
          </ul>
          <p>Le attività locali utilizzano tali dati <strong>solo per la preparazione e la consegna dei prodotti</strong> e sono responsabili del loro corretto trattamento.</p>

          <h3 className="font-semibold pt-2">Con fornitori di servizi tecnici</h3>
          <p>Dati possono essere trattati da fornitori tecnici (hosting, autenticazione, database, email) esclusivamente per il funzionamento della piattaforma.</p>
          
          <h3 className="font-semibold pt-2">Obblighi di legge</h3>
          <p>I dati possono essere comunicati ad autorità competenti se richiesto dalla legge.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">8. Ruoli e Visibilità dei Dati</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Gli <strong>utenti</strong> visualizzano solo contenuti pubblici</li>
            <li>I <strong>panettieri</strong> visualizzano solo i dati necessari alla gestione degli ordini e delle consegne</li>
            <li>Gli <strong>sponsor</strong> accedono solo ai propri dati e campagne</li>
            <li>Gli <strong>amministratori</strong> accedono ai dati necessari alla gestione e sicurezza della piattaforma</li>
          </ul>
          <p>Non è consentito l’accesso ai dati di altri utenti senza autorizzazione.</p>
        </section>
        
        <Separator />
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">9. Diritti dell’Interessato</h2>
          <p>L’utente può esercitare in qualsiasi momento i seguenti diritti:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>accesso ai dati personali</li>
            <li>rettifica o aggiornamento</li>
            <li>cancellazione dei dati</li>
            <li>limitazione del trattamento</li>
            <li>opposizione al trattamento</li>
            <li>portabilità dei dati</li>
          </ul>
           <p>Le richieste possono essere inviate all’indirizzo email indicato nei contatti.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">10. Cookie e Tecnologie Simili</h2>
          <p>La piattaforma utilizza cookie tecnici e funzionali necessari al corretto funzionamento del servizio.</p>
          <p>Eventuali cookie di analisi o di terze parti saranno descritti in una specifica <strong>Cookie Policy</strong>.</p>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">11. Modifiche alla Privacy Policy</h2>
          <p>La presente Privacy Policy può essere aggiornata in qualsiasi momento. Le modifiche avranno effetto dalla data di pubblicazione.</p>
          <p>L’uso continuato della piattaforma implica l’accettazione dei nuovi termini.</p>
        </section>
        
        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">12. Contatti</h2>
          <p>Per qualsiasi informazione o richiesta relativa alla privacy puoi contattarci tramite:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>sezione <strong>Contatti</strong> della piattaforma</li>
            <li>email: <strong>info@panedelivery.ch</strong></li>
          </ul>
        </section>
        
        <Separator />
        
        <footer className="text-center text-muted-foreground">
            <p>Utilizzando la piattaforma, l’utente dichiara di aver letto, compreso e accettato la presente Informativa sulla Privacy.</p>
        </footer>
      </div>
    </div>
  );
}
