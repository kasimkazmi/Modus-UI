function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Up to `limit` candidates close to `input`, by edit distance or substring match. */
export function suggest(input: string, candidates: string[], limit = 3): string[] {
  const needle = input.toLowerCase();
  return candidates
    .map((name) => {
      const distance = levenshtein(needle, name);
      const related = name.includes(needle) || needle.includes(name);
      return { name, score: related ? 0 : distance / Math.max(needle.length, name.length) };
    })
    .filter((c) => c.score <= 0.5)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((c) => c.name);
}
