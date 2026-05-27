import type { Guest } from '@/lib/types/database.types';
import { downloadCsv, downloadXlsx } from '@/lib/utils/spreadsheet';

const EXPORT_HEADERS = [
  'full_name',
  'side',
  'relation',
  'phone',
  'email',
  'address',
  'age_group',
  'plus_one',
  'party_size',
  'rsvp_status',
] as const;

function guestToRow(g: Guest): (string | number | boolean)[] {
  return [
    g.full_name,
    g.side,
    g.relation,
    g.phone ?? '',
    g.email ?? '',
    g.address ?? '',
    g.age_group,
    g.plus_one,
    g.party_size ?? 1,
    g.rsvp_status,
  ];
}

export function exportGuestsToXlsx(guests: Guest[], filename = 'guests.xlsx') {
  downloadXlsx(
    filename,
    'Guests',
    [...EXPORT_HEADERS],
    guests.map(guestToRow)
  );
}

export function exportGuestsToCsv(guests: Guest[], filename = 'guests.csv') {
  const lines = [
    EXPORT_HEADERS.join(','),
    ...guests.map((g) =>
      guestToRow(g)
        .map((cell) => {
          const s = String(cell);
          return s.includes(',') || s.includes('"')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(',')
    ),
  ];
  downloadCsv(filename, lines.join('\n'));
}
