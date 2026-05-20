import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  description?: string;
  accent?: 'rose' | 'gold' | 'emerald' | 'blue' | 'purple';
  className?: string;
}

const ACCENTS = {
  rose: 'bg-rose-100 text-rose-600',
  gold: 'bg-gold-100 text-gold-700',
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  accent = 'rose',
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.positive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn('rounded-xl p-3', ACCENTS[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
