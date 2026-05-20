import Link from 'next/link';
import {
  Heart,
  Users,
  Wallet,
  Calendar,
  Camera,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Palette,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Calendar,
    title: 'All your events in one place',
    description:
      'Engagement, haldi, mehendi, sangeet, wedding, reception — manage every ceremony from a single dashboard.',
  },
  {
    icon: Users,
    title: 'Smart guest management',
    description:
      "Track bride's and groom's side separately, manage RSVPs, dietary needs, plus-ones, and seating arrangements.",
  },
  {
    icon: Wallet,
    title: 'Budget without surprises',
    description:
      'Track every rupee across 11 categories, link expenses to vendors, and never miss a payment deadline.',
  },
  {
    icon: Store,
    title: 'Vendor directory',
    description:
      'Save all your vendors with contracts, ratings, and contact info. Compare quotes side-by-side.',
  },
  {
    icon: Palette,
    title: 'Theme & decor planner',
    description:
      'Pick from gorgeous preset themes or design your own colour palette for every event.',
  },
  {
    icon: Camera,
    title: 'Documents & inspiration',
    description:
      'Upload contracts, invoices, and inspiration boards. Everything searchable, everything safe.',
  },
];

const HIGHLIGHTS = [
  'Built for Indian weddings — INR, DD/MM/YYYY, bride/groom sides',
  'Beautiful, mobile-friendly interface',
  'Real-time updates across family members',
  'Export guest lists and budgets as PDF',
  'QR-code based check-in at events',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-30 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            <span className="font-serif text-xl font-semibold">Saath Phere</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="#features">Features</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-rose-500 hover:bg-rose-600">
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 via-white to-gold-50"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,rgba(251,46,99,0.12),transparent_50%)]"
          aria-hidden
        />
        <div className="container py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-gold-500" />
            Built for Indian weddings, top to bottom
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto text-balance">
            Plan the wedding of your{' '}
            <span className="bg-gradient-to-r from-rose-500 to-gold-500 bg-clip-text text-transparent">
              dreams
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            From guest lists to budget tracking, vendor management to seating
            charts — everything you need to plan a stress-free, beautiful
            wedding.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              size="xl"
              className="bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
            >
              <Link href="/signup">
                Start planning free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free forever • No credit card required
          </p>
        </div>
      </section>

      <section id="features" className="container py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Six powerful modules working together so you can focus on what
            matters — your love story.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border bg-card p-6 hover:shadow-lg hover:border-rose-200 transition-all"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-br from-rose-50 to-gold-50 border-y">
        <div className="container py-20 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold">
              Designed for the great Indian wedding
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We get it. Big families, multiple events, complicated logistics.
              Saath Phere is built from the ground up for the realities of
              Indian weddings.
            </p>
          </div>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-20 md:py-28 text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-semibold max-w-3xl mx-auto">
          Ready to start planning the most beautiful day of your life?
        </h2>
        <Button
          asChild
          size="xl"
          className="mt-10 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
        >
          <Link href="/signup">
            Create your free account <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>

      <footer className="border-t bg-muted/30">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            <span className="font-serif font-semibold">Saath Phere</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Saath Phere — made with love.
          </p>
        </div>
      </footer>
    </main>
  );
}
