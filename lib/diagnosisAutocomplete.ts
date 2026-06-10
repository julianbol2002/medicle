export function parseDiagnosisListText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function dedupeDiagnosisLabels(items: string[]): string[] {
  const map = new Map<string, string>();

  for (const raw of items) {
    const label = raw.trim();
    if (!label) continue;
    const key = normalizeAutocompleteKey(label);
    const prev = map.get(key);
    if (!prev || label.length > prev.length) {
      map.set(key, label);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

export function normalizeAutocompleteKey(input: string): string {
  const lower = input.toLowerCase().trim();
  const compact = lower.replace(/&/g, "and").replace(/\s+/g, " ");
  const stripped = compact.replace(/[^a-z0-9]+/g, "");

  if (stripped === "crohnsdisease") return "crohndisease";
  if (stripped === "hodgkinslymphoma") return "hodgkinlymphoma";
  if (stripped === "alzheimersdisease") return "alzheimerdisease";

  return stripped;
}

export function filterDiagnosisSuggestions(
  diagnoses: string[],
  query: string,
  limit = 12
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const qKey = normalizeAutocompleteKey(q);

  return diagnoses
    .filter((d) => {
      const dLower = d.toLowerCase();
      if (dLower.includes(q)) return true;
      return normalizeAutocompleteKey(d).includes(qKey);
    })
    .slice(0, limit);
}
