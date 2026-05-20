import { Heart } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50">
      <div className="flex flex-col items-center gap-3 text-rose-500">
        <Heart className="h-12 w-12 fill-rose-500 text-rose-500 animate-pulse" />
        <p className="font-serif text-lg">Loading…</p>
      </div>
    </div>
  );
}
