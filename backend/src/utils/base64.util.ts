/**
 * Cleans a base64 string by removing data URI prefixes (e.g., data:image/png;base64,)
 * and any whitespace.
 */
export function cleanBase64(base64: string): string {
  // 1. Remove common prefixes if they exist
  // Regex matches: data:[mimetype];base64,
  const cleaned = base64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
  
  // 2. Remove any whitespace/newlines
  return cleaned.trim();
}

/**
 * Validates if a string is a valid base64 format after cleaning.
 */
export function isValidBase64(base64: string): boolean {
  const cleaned = cleanBase64(base64);
  if (!cleaned) return false;
  
  // Regex for base64 validation
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(cleaned);
}
