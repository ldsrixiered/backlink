const headers = [
  'Domain',
  'URL',
  'Authority Score',
  'Category',
  'Outreach Status',
  'Contacted',
  'Notes',
  'Date Added'
];

export function toCsv(prospects) {
  const rows = prospects.map((item) => [
    item.domain,
    item.url,
    item.authorityScore,
    item.category,
    item.outreachStatus,
    item.contacted ? 'Yes' : 'No',
    item.notes,
    item.dateAdded
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
