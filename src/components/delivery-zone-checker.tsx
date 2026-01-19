'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { BakeryCard } from '@/components/bakeries/bakery-card';

const formSchema = z.object({
  location: z.string().min(2, { message: 'Inserisci almeno 2 caratteri.' }),
});


export function DeliveryZoneChecker() {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
    },
  });

  const bakeriesQuery = useMemoFirebase(() => {
    if (!firestore || !searchTerm) return null;
    return query(
      collection(firestore, "bakers"),
      where("deliveryZones", "array-contains", searchTerm)
    );
  }, [firestore, searchTerm]);

  const { data: bakeries, isLoading } = useCollection(bakeriesQuery);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSearchTerm(values.location.trim().toLowerCase());
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
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
                        <Input placeholder="es.lugano o 6900" {...field} />
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

      {bakeries !== null && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Risultati per "{searchTerm}"</CardTitle>
          </CardHeader>
          <CardContent>
            {bakeries && bakeries.length > 0 ? (
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {bakeries.map((bakery) => (
                        <BakeryCard key={bakery.id} bakery={bakery} />
                    ))}
                </div>
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
