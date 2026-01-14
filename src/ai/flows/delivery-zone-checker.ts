'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking if local bakeries deliver to a specified area.
 *
 * The flow takes a 'comune' or 'CAP' (postal code) as input and returns a list of bakeries that deliver to that area.
 *
 * @function checkDeliveryZone - The main function to check the delivery zone.
 * @typedef {CheckDeliveryZoneInput} CheckDeliveryZoneInput - The input type for the checkDeliveryZone function.
 * @typedef {CheckDeliveryZoneOutput} CheckDeliveryZoneOutput - The output type for the checkDeliveryZone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckDeliveryZoneInputSchema = z.object({
  location: z
    .string()
    .describe("The 'comune' (municipality) or 'CAP' (postal code) to check for delivery availability."),
});

export type CheckDeliveryZoneInput = z.infer<typeof CheckDeliveryZoneInputSchema>;

const CheckDeliveryZoneOutputSchema = z.object({
  deliveringBakeries: z
    .array(z.string())
    .describe('A list of bakeries that deliver to the specified location.'),
});

export type CheckDeliveryZoneOutput = z.infer<typeof CheckDeliveryZoneOutputSchema>;

export async function checkDeliveryZone(input: CheckDeliveryZoneInput): Promise<CheckDeliveryZoneOutput> {
  return checkDeliveryZoneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deliveryZoneCheckerPrompt',
  input: {schema: CheckDeliveryZoneInputSchema},
  output: {schema: CheckDeliveryZoneOutputSchema},
  prompt: `You are a delivery zone checker for local bakeries.

  Based on the user's location input, you will determine which bakeries deliver to that area.

  Input location: {{{location}}}

  Return a list of bakeries that deliver to the specified location.
  If you don't know any bakeries that deliver to the specified location, return an empty list.

  Please be as accurate as possible.
  `,
});

const checkDeliveryZoneFlow = ai.defineFlow(
  {
    name: 'checkDeliveryZoneFlow',
    inputSchema: CheckDeliveryZoneInputSchema,
    outputSchema: CheckDeliveryZoneOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
