// Roster pasted from a spreadsheet (tab) or CSV (comma): 이름, 팀. A header row is skipped.
export type RosterRow = { name: string; team: string };

export function parseRoster(text: string): { rows: RosterRow[]; duplicates: string[] } {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,/).map((cell) => cell.trim()))
    .filter(([name], i) => name && !(i === 0 && /^(이름|성명|name)$/i.test(name)))
    .map(([name, team = ""]) => ({ name, team }));
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const { name, team } of rows) {
    const key = team ? `${name} · ${team}` : name;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return { rows, duplicates: [...duplicates] };
}
