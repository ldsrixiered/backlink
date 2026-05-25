import { parse } from 'csv-parse/sync';
import { cleanDomain, numberFrom } from '../utils/normalize.js';

const columnAliases = {
  domain: ['Domain', 'Source Domain', 'Root Domain'],
  url: ['URL', 'Source URL', 'Page URL'],
  authorityScore: ['Authority Score', 'AS', 'Domain Authority'],
  backlinks: ['Backlinks', 'External Links'],
  referringDomains: ['Referring Domains', 'Ref Domains'],
  anchorText: ['Anchor Text', 'Anchor'],
  country: ['Country', 'TLD Distribution'],
  firstSeen: ['First Seen', 'First seen'],
  lastSeen: ['Last Seen', 'Last seen'],
  spamScore: ['Spam Score', 'Toxic Score', 'Toxicity Score']
};

export async function parseSemrushCsv(buffer) {
  const records = parse(buffer.toString('utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  });

  return records.map((row) => {
    const domain = cleanDomain(pick(row, columnAliases.domain) || pickDomainFromUrl(pick(row, columnAliases.url)));
    return {
      id: crypto.randomUUID(),
      domain,
      url: pick(row, columnAliases.url),
      authorityScore: numberFrom(pick(row, columnAliases.authorityScore)),
      backlinks: numberFrom(pick(row, columnAliases.backlinks)),
      referringDomains: numberFrom(pick(row, columnAliases.referringDomains)),
      anchorText: pick(row, columnAliases.anchorText),
      country: pick(row, columnAliases.country),
      firstSeen: pick(row, columnAliases.firstSeen),
      lastSeen: pick(row, columnAliases.lastSeen),
      spamScore: numberFrom(pick(row, columnAliases.spamScore)),
      outreachStatus: 'New',
      contacted: false,
      notes: '',
      category: 'uncategorized',
      localSeo: false,
      dateAdded: new Date().toISOString().slice(0, 10)
    };
  }).filter((row) => row.domain);
}

function pick(row, names) {
  const normalized = Object.entries(row).reduce((acc, [key, value]) => {
    acc[key.trim().toLowerCase()] = value;
    return acc;
  }, {});

  for (const name of names) {
    const value = normalized[name.toLowerCase()];
    if (value !== undefined && value !== '') return String(value).trim();
  }

  return '';
}

function pickDomainFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}
