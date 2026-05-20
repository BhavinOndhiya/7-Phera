import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-rose-500 via-rose-400 to-gold-400 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]"
          aria-hidden
        />
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-2xl font-semibold relative z-10"
        >
          <Heart className="h-7 w-7 fill-current" />
          Saath Phere
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-serif text-4xl font-semibold leading-tight">
            Every great love story deserves perfect planning.
          </h2>
          <p className="mt-4 text-white/85 text-lg">
            Track every guest, every rupee, every detail — beautifully
            organised from engagement to reception.
          </p>
        </div>
        <p className="text-sm text-white/70 relative z-10">
          &copy; {new Date().getFullYear()} Saath Phere
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 font-serif text-2xl font-semibold text-rose-500"
            >
              <Heart className="h-7 w-7 fill-current" />
              Saath Phere
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
