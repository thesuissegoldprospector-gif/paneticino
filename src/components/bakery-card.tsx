import Link from 'next/link';
import Image from 'next/image';
import type { Bakery } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';

export function BakeryCard({ bakery }: { bakery: Bakery }) {
  return (
    <Link href={`/bakeries/${bakery.slug}`} className="block h-full w-full">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <Image
          src={bakery.coverImage.imageUrl}
          alt={`Cover image for ${bakery.name}`}
          width={bakery.coverImage.width}
          height={bakery.coverImage.height}
          className="h-32 w-full object-cover"
          data-ai-hint={bakery.coverImage.imageHint}
        />
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Image
              src={bakery.profileImage.imageUrl}
              alt={`Profile image for ${bakery.name}`}
              width={48}
              height={48}
              className="mt-[-32px] h-12 w-12 flex-shrink-0 rounded-full border-2 border-background object-cover bg-background ring-1 ring-border"
              data-ai-hint={bakery.profileImage.imageHint}
            />
            <div>
              <h3 className="font-semibold leading-tight text-lg">{bakery.name}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{bakery.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
