const blockedTlds = ['.xyz', '.ru'];
const spamTerms = [
  'adult',
  'porn',
  'casino',
  'betting',
  'gambling',
  'crypto',
  'bitcoin',
  'forex',
  'loan',
  'payday'
];
const englishCountrySignals = ['', 'us', 'usa', 'united states', 'uk', 'gb', 'united kingdom', 'ca', 'canada', 'au', 'australia', 'nz'];

export function filterProspects(rows) {
  return rows.filter((row) => {
    const domain = row.domain.toLowerCase();
    const combined = `${row.domain} ${row.url} ${row.anchorText}`.toLowerCase();
    const country = String(row.country || '').toLowerCase();

    if (row.authorityScore < 20) return false;
    if (row.spamScore && row.spamScore > 30) return false;
    if (blockedTlds.some((tld) => domain.endsWith(tld))) return false;
    if (spamTerms.some((term) => combined.includes(term))) return false;
    if (country && !englishCountrySignals.some((signal) => country.includes(signal))) return false;

    return true;
  });
}
