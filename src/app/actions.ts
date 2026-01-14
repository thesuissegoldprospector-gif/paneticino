'use server';

import { checkDeliveryZone, CheckDeliveryZoneInput } from '@/ai/flows/delivery-zone-checker';

export async function checkDeliveryZoneAction(
  input: CheckDeliveryZoneInput
): Promise<{ error?: string; data?: string[] }> {
  try {
    const result = await checkDeliveryZone(input);
    return { data: result.deliveringBakeries };
  } catch (e) {
    console.error(e);
    return { error: 'Si è verificato un errore durante la verifica della zona di consegna. Riprova più tardi.' };
  }
}
