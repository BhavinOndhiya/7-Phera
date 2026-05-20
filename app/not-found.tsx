import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50 p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <Heart className="h-12 w-12 mx-auto fill-rose-500 text-rose-500" />
        <h1 className="font-serif text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for has wandered off to the wedding.
        </p>
        <Button asChild className="bg-rose-500 hover:bg-rose-600">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
