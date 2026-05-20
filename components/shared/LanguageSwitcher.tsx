'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/config';
import { setLocaleAction } from '@/app/actions/locale';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  function pick(value: Locale) {
    if (value === locale) return;
    startTransition(async () => {
      await setLocaleAction(value);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Change language"
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => pick(l)}
            className="cursor-pointer"
          >
            <span className="flex-1">{LOCALE_LABELS[l]}</span>
            {locale === l && <Check className="h-3.5 w-3.5 text-rose-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
