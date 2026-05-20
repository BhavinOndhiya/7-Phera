import Link from 'next/link';
import { Heart } from 'lucide-react';

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t bg-background/60 backdrop-blur">
      <div className="px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-rose-600 transition-colors"
        >
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          <span className="font-serif font-semibold">Saath Phere</span>
        </Link>
        <p className="text-xs text-muted-foreground text-center">
          Crafted for Bhavin &amp; Prachi&apos;s big day — and yours.
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; {year} Saath Phere
        </p>
      </div>
    </footer>
  );
}
