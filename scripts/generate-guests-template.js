/* eslint-disable @typescript-eslint/no-var-requires */
const XLSX = require('xlsx');
const path = require('path');

const headers = [
  'full_name',
  'side',
  'relation',
  'phone',
  'email',
  'address',
  'age_group',
  'plus_one',
  'party_size',
];

const rows = [
  ['Prachi Mehta', 'bride', 'Cousin', '+919876543210', 'prachi.cousin@example.com', '12 MG Road, Mumbai', 'adult', true, 1],
  ['Rohan Joshi', 'groom', 'Friend', '+919812345678', 'rohan@example.com', 'Flat 4B, Whitefield, Bengaluru', 'adult', false, 1],
  ['The Mehta Family', 'bride', 'Aunt', '+919800001111', 'mehta.family@example.com', '45 Park Street, Delhi', 'adult', false, 5],
  ['Joshi Family', 'groom', 'Family Friend', '+919800002222', '', 'Sector 21, Ahmedabad', 'adult', false, 4],
  ['Dadaji Mehta', 'bride', 'Grandparent', '+919800003333', '', '', 'senior', false, 1],
  ['Aarav Joshi', 'groom', 'Nephew', '', '', '', 'child', false, 1],
];

const aoa = [headers, ...rows];
const ws = XLSX.utils.aoa_to_sheet(aoa);
ws['!cols'] = headers.map(() => ({ wch: 22 }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Guests');

const out = path.join(__dirname, '..', 'public', 'guests-template.xlsx');
XLSX.writeFile(wb, out);
console.log('Wrote', out);
