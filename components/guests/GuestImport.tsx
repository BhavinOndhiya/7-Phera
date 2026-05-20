'use client';

import { useRef, useState, useTransition } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type { InsertTables, Side, AgeGroup } from '@/lib/types/database.types';

interface CsvRow {
  full_name?: string;
  side?: string;
  relation?: string;
  phone?: string;
  email?: string;
  address?: string;
  age_group?: string;
  plus_one?: string;
  party_size?: string;
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
    description: "Person or family name. e.g. 'Priya Sharma' or 'The Verma Family'.",
    example: 'Priya Sharma',
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
Priya Sharma,bride,Cousin,+919876543210,priya@example.com,"12 MG Road, Mumbai",adult,true,1
Arjun Mehta,groom,Friend,+919812345678,arjun@example.com,"Flat 4B, Whitefield, Bengaluru",adult,false,1
The Verma Family,bride,Aunt,+919800001111,verma@example.com,"45 Park Street, Delhi",adult,false,5
Patel Family,groom,Family Friend,+919800002222,,"Sector 21, Ahmedabad",adult,false,4
Dadaji Sharma,bride,Grandparent,+919800003333,,,senior,false,1
Aarav Kumar,groom,Nephew,,,,child,false,1
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
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data);
        toast.success(`Found ${results.data.length} rows`);
      },
      error: (err) => toast.error(`CSV parse failed: ${err.message}`),
    });
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport() {
    if (!workspaceId) {
      toast.error('Pick a workspace first');
      return;
    }
    startTransition(async () => {
      const inserts: InsertTables<'guests'>[] = rows
        .filter((r) => r.full_name && r.relation)
        .map((r) => {
          const side: Side = r.side?.toLowerCase() === 'groom' ? 'groom' : 'bride';
          const ageRaw = r.age_group?.toLowerCase();
          const age_group: AgeGroup =
            ageRaw === 'child' || ageRaw === 'senior' ? ageRaw : 'adult';
          const parsedPartySize = Number(r.party_size ?? 1);
          const party_size = Math.max(
            1,
            Math.min(50, isFinite(parsedPartySize) ? parsedPartySize : 1)
          );
          return {
            full_name: r.full_name!.trim(),
            side,
            relation: r.relation!.trim(),
            phone: r.phone?.trim() || null,
            email: r.email?.trim() || null,
            address: r.address?.trim() || null,
            age_group,
            plus_one:
              r.plus_one?.toLowerCase() === 'true' || r.plus_one === '1',
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
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="mt-3 font-medium">Upload a CSV file</p>
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
          Tip: Excel users — fill in your sheet, then{' '}
          <span className="font-medium">File → Save As → CSV (UTF-8)</span>.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseFile(file);
          }}
        />
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          <Button variant="link" size="sm" onClick={downloadSample}>
            <Download className="h-3 w-3 mr-1" /> Download sample
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
                const size = Number(row.party_size ?? 1) || 1;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{row.full_name}</td>
                    <td className="p-2 capitalize">{row.side}</td>
                    <td className="p-2">{row.relation}</td>
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

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          onClick={doImport}
          disabled={rows.length === 0 || isPending}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Import {rows.length > 0 ? `${rows.length} guests` : ''}
        </Button>
      </div>
    </div>
  );
}
