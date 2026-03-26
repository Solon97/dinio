export function extractFirstName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}
