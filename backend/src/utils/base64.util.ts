/**
 * Cleans a base64 string by removing data URI prefixes (e.g., data:image/png;base64, or data:audio/mp3;base64,)
 * and any surrounding whitespace without regex backtracking overhead.
 */
export function cleanBase64(base64: string): string {
  if (!base64 || typeof base64 !== 'string') return '';
  const commaIndex = base64.indexOf(',');
  const raw = commaIndex !== -1 ? base64.slice(commaIndex + 1) : base64;
  return raw.trim();
}

/**
 * Validates if a string is a valid non-empty base64 format after cleaning.
 * Uses a linear non-backtracking character check to prevent stack overflow on large files.
 */
export function isValidBase64(base64: string): boolean {
  if (!base64 || typeof base64 !== 'string') return false;
  const cleaned = cleanBase64(base64);
  if (!cleaned || cleaned.length === 0) return false;
  
  // Fast linear check: return false if any non-base64 character exists
  return !/[^A-Za-z0-9+/=]/.test(cleaned);
}
