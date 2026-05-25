export function dedupeProspects(incoming, existing = []) {
  const seen = new Set(existing.map((item) => item.domain.toLowerCase()));
  const kept = [];

  for (const item of incoming) {
    const key = item.domain.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(item);
  }

  return kept;
}
