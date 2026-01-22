import { DeliveryZoneChecker } from '@/components/delivery-zone-checker';
import AdDisplay from '@/components/sponsors/AdDisplay';

export default function NearMePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-2 font-headline text-4xl text-foreground">Panettieri vicino a te</h1>
        <p className="mb-8 text-muted-foreground">
          Inserisci il tuo comune o CAP per scoprire quali panettieri consegnano nella tua zona.
        </p>
      </div>
      <DeliveryZoneChecker />
      <AdDisplay cardIndex={1} />
      <AdDisplay cardIndex={2} />
      <AdDisplay cardIndex={3} />
    </div>
  );
}
