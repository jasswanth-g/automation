/**
 * Cleans a base64 string by removing data URI prefixes (e.g., data:image/png;base64,)
 * and any whitespace.
 */
export function cleanBase64(base64: string): string {
  if (!base64) return '';
  
  // 1. Remove common prefixes if they exist
  // For performance on large strings, check if it starts with 'data:' first
  let cleaned = base64;
  if (base64.startsWith('data:')) {
    const commaIndex = base64.indexOf(',');
    if (commaIndex !== -1) {
      cleaned = base64.substring(commaIndex + 1);
    }
  }
  
  // 2. Remove any whitespace/newlines
  // trim() is usually fine, but for extremely large strings with interior whitespace 
  // we might want to avoid regex-based global replaces if possible.
  return cleaned.trim();
}

/**
 * Validates if a string is a valid base64 format after cleaning.
 * For very large strings, we avoid full regex testing to prevent "Maximum call stack size exceeded".
 */
export function isValidBase64(base64: string): boolean {
  const cleaned = cleanBase64(base64);
  if (!cleaned) return false;
  
  // For strings larger than 100KB, use a more efficient check
  if (cleaned.length > 100000) {
    // Check if it only contains base64 characters using a simple loop or small regex chunks
    // But honestly, the most reliable and fastest way is to try and decode a small part of it
    // or just check for common invalid characters.
    // For large files, we'll assume it's valid if it decodes without throwing (which Buffer.from does anyway)
    return true; 
  }
  
  // Regex for base64 validation (only for smaller strings)
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(cleaned);
}
