'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  Loader2,
  FileText,
  Info,
  IndianRupee,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import { useGuestContributions } from '@/lib/hooks/useGuestContributions';
import { useGuests } from '@/lib/hooks/useGuests';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { normalizeGuestNameKey } from '@/lib/utils/guestNameKey';
import {
  downloadCsv,
  downloadXlsx,
  normalizeSpreadsheetHeader,
  parseSpreadsheetFile,
} from '@/lib/utils/spreadsheet';
import { formatINR } from '@/lib/utils/formatting';
import type { Guest } from '@/lib/types/database.types';

const HEADER_ALIASES: Record<string, 'full_name' | 'amount_inr' | 'notes' | 'received_at'> = {
  full_name: 'full_name',
  fullname: 'full_name',
  name: 'full_name',
  guest: 'full_name',
  guest_name: 'full_name',
  amount_inr: 'amount_inr',
  amount: 'amount_inr',
  rupees: 'amount_inr',
  rupee: 'amount_inr',
  inr: 'amount_inr',
  cash: 'amount_inr',
  shagun: 'amount_inr',
  gift: 'amount_inr',
  gift_amount: 'amount_inr',
  notes: 'notes',
  note: 'notes',
  remarks: 'notes',
  received_at: 'received_at',
  date: 'received_at',
  received_date: 'received_at',
};

type ImportRow = {
  full_name?: string;
  amount_inr?: string | number;
  notes?: string;
  received_at?: string;
};

const SAMPLE_CSV = `full_name,amount_inr,notes,received_at
Prachi Mehta,5100,Shagun envelope,2026-01-15
Rohan Joshi,2100,UPI from Rohan,2026-01-15
The Mehta Family,11000,Family gift,2026-01-16
`;

function asString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function parseAmount(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const cleaned = String(v).replace(/[₹,\s]/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeImportRows(
  rawRows: Record<string, unknown>[]
): ImportRow[] {
  return rawRows.map((raw) => {
    const out: ImportRow = {};
    for (const [k, v] of Object.entries(raw)) {
      const mapped = HEADER_ALIASES[normalizeSpreadsheetHeader(k)];
      if (!mapped) continue;
      if (v === undefined || v === null || v === '') continue;
      out[mapped] = v as never;
    }
    return out;
  });
}

export function GuestCashGifts({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const canEdit = ws?.can('edit_guest') ?? false;
  const { guests } = useGuests({ eventId });
  const { rows, loading, totalInr, deleteContribution, refresh } =
    useGuestContributions(eventId);
  const { confirm } = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const guestsByName = useMemo(() => {
    const map = new Map<string, Guest>();
    for (const g of guests) {
      map.set(normalizeGuestNameKey(g.full_name), g);
    }
    return map;
  }, [guests]);

  const contributedGuestIds = useMemo(
    () => new Set(rows.map((r) => r.guest_id)),
    [rows]
  );

  async function parseFile(file: File) {
    setFileName(file.name);
    try {
      const raw = await parseSpreadsheetFile(file);
      const normalized = normalizeImportRows(raw).filter((r) =>
        Object.values(r).some((v) => v !== undefined && v !== '')
      );
      setParsedRows(normalized);
      toast.success(`Found ${normalized.length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Parse failed');
    }
  }

  function downloadSample() {
    downloadCsv('cash-gifts-sample.csv', SAMPLE_CSV);
  }

  function downloadSampleXlsx() {
    downloadXlsx('cash-gifts-sample.xlsx', 'Cash gifts', ['full_name', 'amount_inr', 'notes', 'received_at'], [
      ['Prachi Mehta', 5100, 'Shagun envelope', '2026-01-15'],
      ['Rohan Joshi', 2100, 'UPI from Rohan', '2026-01-15'],
    ]);
  }

  function exportContributions() {
    const headers = [
      'full_name',
      'side',
      'relation',
      'amount_inr',
      'notes',
      'received_at',
      'phone',
      'email',
    ];
    const data = rows.map((r) => [
      r.guest.full_name,
      r.guest.side,
      r.guest.relation,
      Number(r.amount_inr),
      r.notes ?? '',
      r.received_at ?? '',
      r.guest.phone ?? '',
      r.guest.email ?? '',
    ]);
    if (data.length === 0) {
      toast.error('No cash gift entries to export yet');
      return;
    }
    downloadXlsx(`cash-gifts-${eventId.slice(0, 8)}.xlsx`, 'Cash gifts', headers, data);
    toast.success('Downloaded Excel file');
  }

  function doImport() {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return;
    }
    startTransition(async () => {
      const seenNames = new Set<string>();
      let imported = 0;
      let skippedDuplicateFile = 0;
      let skippedNoGuest = 0;
      let skippedInvalid = 0;

      const upserts: {
        workspace_id: string;
        event_id: string;
        guest_id: string;
        amount_inr: number;
        notes: string | null;
        received_at: string | null;
      }[] = [];

      for (const row of parsedRows) {
        const name = asString(row.full_name);
        const amount = parseAmount(row.amount_inr);
        if (!name || amount === null) {
          skippedInvalid++;
          continue;
        }
        const key = normalizeGuestNameKey(name);
        if (seenNames.has(key)) {
          skippedDuplicateFile++;
          continue;
        }
        seenNames.add(key);

        const guest = guestsByName.get(key);
        if (!guest) {
          skippedNoGuest++;
          continue;
        }

        upserts.push({
          workspace_id: workspaceId,
          event_id: eventId,
          guest_id: guest.id,
          amount_inr: amount,
          notes: asString(row.notes) ?? null,
          received_at: asString(row.received_at) ?? null,
        });
      }

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('guest_contributions')
          .upsert(upserts, { onConflict: 'event_id,guest_id' });
        if (error) {
          toast.error(error.message);
          return;
        }
        imported = upserts.length;
        await refresh();
      }

      const parts = [`Imported ${imported} entries`];
      if (skippedDuplicateFile > 0) {
        parts.push(`${skippedDuplicateFile} duplicate names in file skipped`);
      }
      if (skippedNoGuest > 0) {
        parts.push(
          `${skippedNoGuest} skipped (guest not on this event — add them to the guest list first)`
        );
      }
      if (skippedInvalid > 0) {
        parts.push(`${skippedInvalid} invalid rows skipped`);
      }
      toast.success(parts.join(' · '));
      setImportOpen(false);
      setParsedRows([]);
      setFileName(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
        <p>
          Record shagun / cash gifts from each guest for your memory. Match guests
          by <span className="font-medium">exact name</span> (same as your guest
          list). Import a spreadsheet with <span className="font-mono">full_name</span>{' '}
          and <span className="font-mono">amount_inr</span> columns.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {rows.length} guests recorded · Total received
          </p>
          <p className="font-serif text-2xl font-semibold text-rose-700 flex items-center gap-1">
            <IndianRupee className="h-5 w-5" />
            {formatINR(totalInr)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportContributions}>
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </Button>
          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" /> Import Excel / CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No cash gifts recorded yet. Import a spreadsheet or add amounts after
          guests are on this event.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead>Notes</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.guest.full_name}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {row.guest.side}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatINR(Number(row.amount_inr))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {row.notes ?? '—'}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Remove entry',
                            description: `Remove cash gift record for ${row.guest.full_name}?`,
                            confirmLabel: 'Remove',
                            variant: 'destructive',
                          });
                          if (ok) await deleteContribution(row.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {guests.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {guests.length - contributedGuestIds.size} guests on this event have no
          amount recorded yet.
        </p>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import cash gifts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void parseFile(file);
                e.target.value = '';
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
              <Button variant="link" size="sm" onClick={downloadSampleXlsx}>
                Excel sample
              </Button>
              <Button variant="link" size="sm" onClick={downloadSample}>
                CSV sample
              </Button>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-rose-500" />
                <span>{fileName}</span>
                <Badge variant="secondary">{parsedRows.length} rows</Badge>
              </div>
            )}
            {parsedRows.length > 0 && (
              <Button
                className="w-full bg-rose-500 hover:bg-rose-600"
                disabled={isPending}
                onClick={doImport}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import amounts
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
