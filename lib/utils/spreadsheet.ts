import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function normalizeSpreadsheetHeader(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function parseSpreadsheetFile(
  file: File
): Promise<Record<string, unknown>[]> {
  const lower = file.name.toLowerCase();
  const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls');

  if (isExcel) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const sheetName = wb.SheetNames[0];
          if (!sheetName) {
            reject(new Error('Excel file has no sheets'));
            return;
          }
          const sheet = wb.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet,
            { defval: '', raw: false }
          );
          resolve(rawRows);
        } catch (err) {
          reject(
            err instanceof Error ? err : new Error('Excel parse failed')
          );
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const aoa: (string | number | boolean)[][] = [headers];
  for (const row of rows) {
    aoa.push(
      row.map((cell) => {
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'boolean') return cell;
        return cell;
      }) as (string | number | boolean)[]
    );
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
