/**
 * URL safety verifier against XSS attacks
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const cleaned = url.trim().toLowerCase();
  if (
    cleaned.startsWith('javascript:') ||
    cleaned.startsWith('vbscript:') ||
    cleaned.startsWith('data:') ||
    cleaned.startsWith('file:')
  ) {
    return false;
  }
  return true;
}
