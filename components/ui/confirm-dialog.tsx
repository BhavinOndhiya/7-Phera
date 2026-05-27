'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { brand } from '@/lib/emails/theme';

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  function finish(result: boolean) {
    setOpen(false);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(result);
  }

  const isDestructive = options?.variant === 'destructive';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) finish(false);
        }}
      >
        <DialogContent
          className="max-w-md gap-0 p-0 overflow-hidden border-rose-100"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => finish(false)}
        >
          <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50/80 px-6 pt-6 pb-4 border-b border-rose-100/80">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-500/90 mb-1">
              {brand.name}
            </p>
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-serif text-xl text-foreground pr-8">
                {options?.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {options?.description}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="gap-2 px-6 py-4 sm:justify-end bg-background">
            <Button type="button" variant="outline" onClick={() => finish(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              type="button"
              variant={isDestructive ? 'destructive' : 'default'}
              className={
                isDestructive
                  ? undefined
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }
              onClick={() => finish(true)}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
