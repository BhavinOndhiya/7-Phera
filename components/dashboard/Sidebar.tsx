'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  Store,
  ListChecks,
  Clock,
  FileText,
  Image as ImageIcon,
  Gift,
  Settings,
  Heart,
  ScanLine,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/events', key: 'events', icon: Calendar },
  { href: '/guests', key: 'guests', icon: Users },
  { href: '/checkins', key: 'checkins', icon: UserCheck },
  { href: '/scan', key: 'scanner', icon: ScanLine },
  { href: '/budget', key: 'budget', icon: Wallet },
  { href: '/vendors', key: 'vendors', icon: Store },
  { href: '/tasks', key: 'tasks', icon: ListChecks },
  { href: '/timeline', key: 'timeline', icon: Clock },
  { href: '/documents', key: 'documents', icon: FileText },
  { href: '/gallery', key: 'gallery', icon: ImageIcon },
  { href: '/gifts', key: 'gifts', icon: Gift },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const tNav = useTranslations('Nav');
  const tBrand = useTranslations('Brand');

  return (
    <aside className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
        <span className="font-serif text-xl font-semibold">{tBrand('name')}</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tNav(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-rose-50 text-rose-700'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          {tNav('settings')}
        </Link>
      </div>
    </aside>
  );
}
