
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { User, Store, Megaphone, HelpCircle } from 'lucide-react';

const userFaqs = [
    {
        question: "Cos’è questa piattaforma?",
        answer: "È una piattaforma che mette in contatto attività locali e sponsor, offrendo agli utenti un modo semplice per scoprire contenuti, offerte e realtà del territorio."
    },
    {
        question: "Posso usare il sito senza registrarmi?",
        answer: "Sì. Puoi navigare liberamente come visitatore e visualizzare i contenuti pubblici senza creare un account."
    },
    {
        question: "Posso fare ordini o interazioni senza account?",
        answer: "Per alcune funzionalità avanzate (come ordini, preferiti o area personale) è richiesta la registrazione."
    },
    {
        question: "I miei dati personali sono al sicuro?",
        answer: "Sì. I dati sono protetti tramite sistemi di sicurezza avanzati e vengono utilizzati solo per il corretto funzionamento della piattaforma."
    },
    {
        question: "Come posso ricevere supporto?",
        answer: "Puoi contattarci tramite la sezione Contatti oppure tramite l’area personale se sei registrato."
    }
];

const bakerFaqs = [
    {
        question: "Chi può registrarsi come panettiere?",
        answer: "Qualsiasi panetteria o attività simile che voglia essere presente sulla piattaforma e avere un proprio profilo dedicato."
    },
    {
        question: "Che differenza c’è tra panettiere e sponsor?",
        answer: "Panettiere: ha un profilo dedicato alla propria attività, visibile agli utenti. Sponsor: acquista spazi pubblicitari per promuovere contenuti. Sono due ruoli distinti con funzionalità diverse."
    },
    {
        question: "Ho una dashboard personale?",
        answer: "Sì. Ogni panettiere ha una dashboard dedicata per gestire il proprio profilo e le informazioni della propria attività."
    },
    {
        question: "I panettieri possono acquistare spazi pubblicitari?",
        answer: "Sì, se registrati anche come sponsor oppure tramite un profilo sponsor separato."
    },
    {
        question: "I miei dati sono visibili agli altri?",
        answer: "No. Ogni panettiere gestisce il proprio profilo in modo indipendente e sicuro."
    }
];

const sponsorFaqs = [
    {
        question: "Come funziona l’agenda degli spazi pubblicitari?",
        answer: "Ogni spazio pubblicitario dispone di un’agenda con slot orari. Gli sponsor possono: vedere se uno slot è libero, in elaborazione o già occupato; prenotare slot disponibili; caricare i contenuti pubblicitari."
    },
    {
        question: "Cosa significa “in elaborazione” (processing)?",
        answer: "Significa che lo slot è stato prenotato, il contenuto è stato inviato ed è in attesa di approvazione da parte dell’amministratore. Lo slot resta bloccato finché il processo non è completato."
    },
    {
        question: "Chi approva i contenuti pubblicitari?",
        answer: "Un amministratore della piattaforma. Questo garantisce qualità, correttezza e conformità dei contenuti."
    },
    {
        question: "Cosa succede se un contenuto viene rifiutato?",
        answer: "Lo slot resta riservato allo sponsor, viene fornito un commento dell’amministratore e il contenuto può essere modificato e reinviato."
    },
    {
        question: "Gli altri sponsor vedono i miei contenuti?",
        answer: "No. Gli sponsor vedono solo lo stato degli slot, non i contenuti o i dati di altri sponsor."
    },
    {
        question: "Posso stampare o scaricare un report delle mie campagne?",
        answer: "Sì. Dalla dashboard sponsor puoi filtrare gli slot pubblicati per periodo, visualizzare un report e stampare o salvare il report in PDF."
    },
    {
        question: "I miei pagamenti e dati sono protetti?",
        answer: "Sì. La piattaforma applica regole di accesso rigorose e separazione dei ruoli per garantire sicurezza e affidabilità."
    }
];


export default function FaqPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-12">
            <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl font-headline text-foreground">Domande Frequenti (FAQ)</h1>
            <p className="mt-2 text-lg text-muted-foreground">Trova le risposte alle domande più comuni.</p>
        </div>

        <div className="space-y-10">
            {/* User FAQs */}
            <section>
                <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                    <User className="h-7 w-7 text-primary" />
                    <span>Per gli Utenti</span>
                </h2>
                <Accordion type="single" collapsible className="w-full">
                    {userFaqs.map((faq, index) => (
                        <AccordionItem value={`user-${index}`} key={`user-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>

            {/* Baker FAQs */}
            <section>
                <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                    <Store className="h-7 w-7 text-primary" />
                    <span>Per i Panettieri</span>
                </h2>
                <Accordion type="single" collapsible className="w-full">
                     {bakerFaqs.map((faq, index) => (
                        <AccordionItem value={`baker-${index}`} key={`baker-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>

            {/* Sponsor FAQs */}
            <section>
                <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                    <Megaphone className="h-7 w-7 text-primary" />
                    <span>Per gli Sponsor</span>
                </h2>
                <Accordion type="single" collapsible className="w-full">
                    {sponsorFaqs.map((faq, index) => (
                        <AccordionItem value={`sponsor-${index}`} key={`sponsor-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <ul className="list-disc pl-5 space-y-2">
                                    {faq.answer.split(';').map((point, i) => (
                                        <li key={i}>{point.trim()}</li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
        </div>

         <div className="mt-16 text-center text-muted-foreground">
            <p>Hai ancora domande?</p>
            <p>Contattaci in qualsiasi momento, siamo felici di aiutarti 😊</p>
        </div>

    </div>
  );
}
