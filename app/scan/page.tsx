import Link from 'next/link';
import { Heart, LayoutDashboard } from 'lucide-react';
import { ScanClient } from './ScanClient';

export const metadata = { title: 'Scan guest QR' };

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500 shrink-0" />
            <span className="font-serif text-lg sm:text-xl font-semibold truncate">
              Venue scanner
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 shrink-0"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>
      <div className="container py-6 sm:py-10 max-w-md mx-auto">
        <ScanClient />
      </div>
    </main>
  );
}
