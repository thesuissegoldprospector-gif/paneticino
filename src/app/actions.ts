'use server';

import { checkDeliveryZone, CheckDeliveryZoneInput } from '@/ai/flows/delivery-zone-checker';

export async function checkDeliveryZoneAction(
  input: CheckDeliveryZoneInput
): Promise<{ error?: string; data?: string[] }> {
  try {
    const result = await checkDeliveryZone(input);
    return { data: result.deliveringBakeries };
  } catch (e: any) {
    console.error(e);
    // Return the specific error message instead of a generic one.
    return { error: e.message || 'Si è verificato un errore durante la verifica della zona di consegna. Riprova più tardi.' };
  }
}
