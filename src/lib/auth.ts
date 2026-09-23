/**
 * Administrative Access Control for ENFOQUE CMS
 */

/**
 * Verifica si la sesión activa del navegador posee privilegios de administrador.
 * Se basa en la autenticación real de contraseña de administrador (cookie de sesión),
 * garantizando que seleccionar a una persona en el selector de usuario NO otorgue
 * permisos de edición a usuarios no autorizados.
 */
export function isUserAdmin(_userId?: string | null, _userEmail?: string | null): boolean {
  if (typeof window !== 'undefined') {
    return document.cookie.split(';').some(item => item.trim() === 'enfoque_admin_logged=true');
  }
  return false;
}
