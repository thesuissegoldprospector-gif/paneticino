'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { checkDeliveryZoneAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';

const formSchema = z.object({
  location: z.string().min(2, { message: 'Inserisci almeno 2 caratteri.' }),
});

export function DeliveryZoneChecker() {
  const [isLoading, setIsLoading] = useState(false);
  const [bakeries, setBakeries] = useState<string[] | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setBakeries(null);
    const result = await checkDeliveryZoneAction(values);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Oh no! Qualcosa è andato storto.',
        description: result.error,
      });
    } else {
      setBakeries(result.data || []);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comune o CAP</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Es. Roma o 00100" {...field} />
                      </FormControl>
                      <Button type="submit" disabled={isLoading} aria-label="Cerca">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Sto cercando...</p>
        </div>
      )}

      {bakeries !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Risultati della ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            {bakeries.length > 0 ? (
              <ul className="list-inside list-disc space-y-2">
                {bakeries.map((bakery, index) => (
                  <li key={index} className="text-foreground">
                    {bakery}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-muted-foreground">
                Nessun panettiere trovato che consegna in questa zona. Prova un'altra località.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
