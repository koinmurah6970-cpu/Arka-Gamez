const ACRONYM_MAP: Record<string, string> = {
  gta: "grand theft auto",
  re: "resident evil",
  cod: "call of duty",
  nfs: "need for speed",
  ac: "assassin's creed",
  rdr: "red dead redemption",
  pes: "pro evolution soccer",
  mh: "monster hunter",
  fifa: "ea sports fc",
  ff: "final fantasy",
  dmc: "devil may cry",
  gow: "god of war",
  tomb: "tomb raider",
  mc: "minecraft",
  cs: "counter-strike",
  pubg: "playerunknown's battlegrounds",
};

export function expandSearchQuery(q: string): string[] {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const terms = new Set<string>();
  terms.add(trimmed);

  for (const [acronym, full] of Object.entries(ACRONYM_MAP)) {
    const escapedFull = full.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    
    const acronymRegex = new RegExp(`\\b${acronym}\\b`, "i");
    const fullRegex = new RegExp(`\\b${escapedFull}\\b`, "i");

    if (acronymRegex.test(trimmed)) {
      terms.add(trimmed.replace(acronymRegex, full));
    }
    if (fullRegex.test(trimmed)) {
      terms.add(trimmed.replace(fullRegex, acronym));
    }
  }

  return Array.from(terms);
}

export function applySearchFilter(queryBuilder: any, fieldName: string, q: string) {
  const terms = expandSearchQuery(q);
  if (terms.length > 1) {
    const orCondition = terms.map((t) => `${fieldName}.ilike.%${t}%`).join(",");
    return queryBuilder.or(orCondition);
  }
  return queryBuilder.ilike(fieldName, `%${q.trim()}%`);
}
