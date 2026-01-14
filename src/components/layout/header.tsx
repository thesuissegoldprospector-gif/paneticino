import Link from 'next/link';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-center">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">
          PaneDelivery
        </Link>
      </div>
    </header>
  );
}
