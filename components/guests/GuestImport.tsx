'use client';

import { useRef, useState, useTransition } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type { InsertTables, Side, AgeGroup } from '@/lib/types/database.types';

interface CsvRow {
  full_name?: string | number | null;
  side?: string | null;
  relation?: string | null;
  phone?: string | number | null;
  email?: string | null;
  address?: string | null;
  age_group?: string | null;
  plus_one?: string | boolean | number | null;
  party_size?: string | number | null;
}

const HEADER_ALIASES: Record<string, keyof CsvRow> = {
  full_name: 'full_name',
  fullname: 'full_name',
  name: 'full_name',
  guest: 'full_name',
  guest_name: 'full_name',
  side: 'side',
  party_side: 'side',
  relation: 'relation',
  relationship: 'relation',
  phone: 'phone',
  phone_number: 'phone',
  mobile: 'phone',
  contact: 'phone',
  email: 'email',
  email_address: 'email',
  address: 'address',
  age_group: 'age_group',
  age: 'age_group',
  plus_one: 'plus_one',
  plusone: 'plus_one',
  party_size: 'party_size',
  partysize: 'party_size',
  party: 'party_size',
  group_size: 'party_size',
};

function normalizeHeader(raw: unknown): keyof CsvRow | null {
  if (raw == null) return null;
  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return HEADER_ALIASES[key] ?? null;
}

function normalizeRows(rawRows: Record<string, unknown>[]): CsvRow[] {
  return rawRows.map((raw) => {
    const out: CsvRow = {};
    for (const [k, v] of Object.entries(raw)) {
      const mapped = normalizeHeader(k);
      if (!mapped) continue;
      if (v === undefined || v === null || v === '') continue;
      (out as Record<string, unknown>)[mapped] = v;
    }
    return out;
  });
}

function asString(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  const s = asString(v)?.toLowerCase();
  return s === 'true' || s === 'yes' || s === 'y' || s === '1';
}

const COLUMNS: {
  name: keyof CsvRow;
  required: boolean;
  description: string;
  example: string;
}[] = [
  {
    name: 'full_name',
    required: true,
    description: "Person or family name. e.g. 'Prachi Mehta' or 'The Patel Family'.",
    example: 'Prachi Mehta',
  },
  {
    name: 'side',
    required: true,
    description: "Which side. Must be 'bride' or 'groom' (lowercase).",
    example: 'bride',
  },
  {
    name: 'relation',
    required: true,
    description:
      'Relation. Recommended: Parent, Sibling, Grandparent, Uncle, Aunt, Cousin, Nephew, Niece, Friend, Colleague, Neighbor, Other.',
    example: 'Cousin',
  },
  {
    name: 'phone',
    required: false,
    description: 'Phone number with country code. Leave blank if unknown.',
    example: '+919876543210',
  },
  {
    name: 'email',
    required: false,
    description: 'Email address. Leave blank if unknown.',
    example: 'priya@example.com',
  },
  {
    name: 'address',
    required: false,
    description: 'Postal address. Wrap in quotes if it contains commas.',
    example: '"12 MG Road, Mumbai"',
  },
  {
    name: 'age_group',
    required: false,
    description: "'child', 'adult', or 'senior'. Defaults to 'adult'.",
    example: 'adult',
  },
  {
    name: 'plus_one',
    required: false,
    description: "'true' if they may bring a plus one. Defaults to 'false'.",
    example: 'true',
  },
  {
    name: 'party_size',
    required: false,
    description:
      "Number of people in this row. Use 1 for individual, 2-50 for families/groups.",
    example: '5',
  },
];

const SAMPLE_CSV = `full_name,side,relation,phone,email,address,age_group,plus_one,party_size
Prachi Mehta,bride,Cousin,+919876543210,prachi.cousin@example.com,"12 MG Road, Mumbai",adult,true,1
Rohan Joshi,groom,Friend,+919812345678,rohan@example.com,"Flat 4B, Whitefield, Bengaluru",adult,false,1
The Mehta Family,bride,Aunt,+919800001111,mehta.family@example.com,"45 Park Street, Delhi",adult,false,5
Joshi Family,groom,Family Friend,+919800002222,,"Sector 21, Ahmedabad",adult,false,4
Dadaji Mehta,bride,Grandparent,+919800003333,,,senior,false,1
Aarav Joshi,groom,Nephew,,,,child,false,1
`;

export function GuestImport({
  eventId,
  onDone,
}: {
  eventId?: string;
  onDone?: () => void;
}) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showRef, setShowRef] = useState(false);
  const [isPending, startTransition] = useTransition();

  function parseFile(file: File) {
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const sheetName = wb.SheetNames[0];
          if (!sheetName) {
            toast.error('Excel file has no sheets');
            return;
          }
          const sheet = wb.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet,
            { defval: '', raw: false }
          );
          const normalized = normalizeRows(rawRows).filter((r) =>
            Object.values(r).some((v) => v !== undefined && v !== null && v !== '')
          );
          setRows(normalized);
          toast.success(`Found ${normalized.length} rows`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'unknown error';
          toast.error(`Excel parse failed: ${msg}`);
        }
      };
      reader.onerror = () => toast.error('Failed to read file');
      reader.readAsArrayBuffer(file);
      return;
    }

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const normalized = normalizeRows(results.data).filter((r) =>
          Object.values(r).some((v) => v !== undefined && v !== null && v !== '')
        );
        setRows(normalized);
        toast.success(`Found ${normalized.length} rows`);
      },
      error: (err) => toast.error(`CSV parse failed: ${err.message}`),
    });
  }

  function downloadCsvSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadXlsxSample() {
    const headers = COLUMNS.map((c) => c.name);
    const sampleRows = Papa.parse<Record<string, string>>(SAMPLE_CSV, {
      header: true,
      skipEmptyLines: true,
    }).data;
    const aoa: (string | number | boolean)[][] = [headers as string[]];
    for (const r of sampleRows) {
      aoa.push(
        headers.map((h) => {
          const v = r[h] ?? '';
          if (h === 'plus_one') return v.toLowerCase() === 'true';
          if (h === 'party_size') return Number(v) || 1;
          return v;
        })
      );
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    XLSX.writeFile(wb, 'guests-sample.xlsx');
  }

  function doImport() {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return;
    }
    startTransition(async () => {
      const inserts: InsertTables<'guests'>[] = rows
        .filter((r) => asString(r.full_name) && asString(r.relation))
        .map((r) => {
          const sideRaw = asString(r.side)?.toLowerCase();
          const side: Side = sideRaw === 'groom' ? 'groom' : 'bride';
          const ageRaw = asString(r.age_group)?.toLowerCase();
          const age_group: AgeGroup =
            ageRaw === 'child' || ageRaw === 'senior' ? ageRaw : 'adult';
          const parsedPartySize = Number(r.party_size ?? 1);
          const party_size = Math.max(
            1,
            Math.min(50, isFinite(parsedPartySize) ? parsedPartySize : 1)
          );
          return {
            full_name: asString(r.full_name)!,
            side,
            relation: asString(r.relation)!,
            phone: asString(r.phone) ?? null,
            email: asString(r.email) ?? null,
            address: asString(r.address) ?? null,
            age_group,
            plus_one: asBool(r.plus_one),
            party_size,
            workspace_id: workspaceId,
          };
        });

      if (inserts.length === 0) {
        toast.error('No valid rows found. Need at least full_name and relation.');
        return;
      }

      const { data, error } = await supabase
        .from('guests')
        .insert(inserts)
        .select();
      if (error) {
        toast.error(error.message);
        return;
      }

      if (eventId && data && data.length > 0) {
        await supabase
          .from('event_guests')
          .insert(data.map((g) => ({ event_id: eventId, guest_id: g.id })));
      }

      toast.success(`Imported ${data?.length ?? 0} guests`);
      onDone?.();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-900">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-rose-500" />
        <p>
          Importing only adds guests to your list — no invitations are sent. You
          can send them later from the guest list by selecting guests and
          clicking <span className="font-medium">Send invitations</span>.
        </p>
      </div>
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-3 font-medium">Upload a CSV or Excel file</p>
        <p className="text-xs text-muted-foreground mt-1">
          Required: <span className="font-mono">full_name</span>,{' '}
          <span className="font-mono">side</span>,{' '}
          <span className="font-mono">relation</span> · Optional:{' '}
          <span className="font-mono">phone</span>,{' '}
          <span className="font-mono">email</span>,{' '}
          <span className="font-mono">address</span>,{' '}
          <span className="font-mono">age_group</span>,{' '}
          <span className="font-mono">plus_one</span>,{' '}
          <span className="font-mono">party_size</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Supports <span className="font-medium">.csv</span>,{' '}
          <span className="font-medium">.xlsx</span> and{' '}
          <span className="font-medium">.xls</span>. Column headers must match
          the names above (case-insensitive).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseFile(file);
            e.target.value = '';
          }}
        />
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          <Button variant="link" size="sm" onClick={downloadXlsxSample}>
            <Download className="h-3 w-3 mr-1" /> Excel sample
          </Button>
          <Button variant="link" size="sm" onClick={downloadCsvSample}>
            <Download className="h-3 w-3 mr-1" /> CSV sample
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowRef((s) => !s)}
          >
            <Info className="h-3 w-3 mr-1" />
            {showRef ? 'Hide column reference' : 'Show column reference'}
          </Button>
        </div>
      </div>

      {showRef && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 font-medium">Column</th>
                <th className="text-left p-2 font-medium">Required</th>
                <th className="text-left p-2 font-medium">What to put</th>
                <th className="text-left p-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((c) => (
                <tr key={c.name} className="border-t align-top">
                  <td className="p-2 font-mono whitespace-nowrap">{c.name}</td>
                  <td className="p-2">
                    {c.required ? (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </td>
                  <td className="p-2 text-muted-foreground">{c.description}</td>
                  <td className="p-2 font-mono text-muted-foreground">
                    {c.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fileName && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <FileText className="h-5 w-5 text-rose-500" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {rows.length} rows parsed
            </p>
          </div>
          <Badge variant="secondary">{rows.length}</Badge>
        </div>
      )}

      {rows.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Side</th>
                <th className="text-left p-2 font-medium">Relation</th>
                <th className="text-left p-2 font-medium">Party</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row, i) => {
                const name = asString(row.full_name);
                const side = asString(row.side);
                const relation = asString(row.relation);
                const size = Number(row.party_size ?? 1) || 1;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      {name ?? (
                        <span className="text-rose-500 italic">missing</span>
                      )}
                    </td>
                    <td className="p-2 capitalize">
                      {side ?? (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      {relation ?? (
                        <span className="text-rose-500 italic">missing</span>
                      )}
                    </td>
                    <td className="p-2">
                      {size > 1 ? `${size} people` : '1'}
                    </td>
                  </tr>
                );
              })}
              {rows.length > 20 && (
                <tr className="border-t">
                  <td colSpan={4} className="p-2 text-center text-muted-foreground text-xs">
                    + {rows.length - 20} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(() => {
        const validCount = rows.filter(
          (r) => asString(r.full_name) && asString(r.relation)
        ).length;
        return (
          <div className="flex flex-col gap-2 pt-2 border-t sm:flex-row sm:items-center sm:justify-between">
            {rows.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {validCount} of {rows.length} rows ready to import
                {validCount < rows.length &&
                  ` · ${rows.length - validCount} skipped (missing full_name or relation)`}
              </p>
            )}
            <div className="flex justify-end gap-2 sm:ml-auto">
              <Button variant="outline" onClick={onDone}>
                Cancel
              </Button>
              <Button
                onClick={doImport}
                disabled={validCount === 0 || isPending}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {validCount > 0 ? `${validCount} guests` : ''}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
