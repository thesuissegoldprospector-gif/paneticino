'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Qui si potrebbe loggare l'errore a un servizio di monitoraggio
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
            <Card className="max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive">Oops! Qualcosa è andato storto.</CardTitle>
                    <CardDescription>
                        Si è verificato un errore inaspettato durante il caricamento dell'applicazione.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p>
                        Puoi provare a ricaricare la pagina. Se il problema persiste, i dettagli tecnici sono disponibili qui sotto.
                    </p>
                    <Button onClick={() => reset()}>
                        Riprova
                    </Button>
                    <Accordion type="single" collapsible className="w-full text-left">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Dettagli Tecnici dell'Errore</AccordionTrigger>
                            <AccordionContent>
                                <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                                    <code className="text-destructive">{error.message}</code>
                                    {error.stack && <code className="mt-4 block text-xs">{error.stack}</code>}
                                </pre>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  );
}
