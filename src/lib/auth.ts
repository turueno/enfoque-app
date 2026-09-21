/**
 * Administrative Access Control for ENFOQUE CMS
 */

// Authorized administrator identifiers (Emails or User IDs)
export const ADMIN_IDENTIFIERS = new Set([
  'P04', // José Antonio Turueño (ID interno)
  'turueno@gmail.com',
  'jose.antonio.turueno@enfoque.io',
  'joseantonioturueno@gmail.com',
  'admin@enfoque.io'
]);

/**
 * Checks if a given user ID or email has administrative privileges
 */
export function isUserAdmin(userId?: string | null, userEmail?: string | null): boolean {
  if (userId && ADMIN_IDENTIFIERS.has(userId)) return true;
  if (userEmail && ADMIN_IDENTIFIERS.has(userEmail.toLowerCase())) return true;
  return false;
}
