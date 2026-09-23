import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'enfoque_admin_token';
export const ADMIN_FLAG_COOKIE = 'enfoque_admin_logged';
const TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días

function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || 'provokers2026';
}

/**
 * Genera un token firmado con timestamp y HMAC-SHA256
 */
export function generateAdminToken(): string {
  const secret = getAdminSecret();
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${hmac}`;
}

/**
 * Valida un token comprobando la firma criptográfica y su expiración
 */
export function validateAdminToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, receivedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Comprobar expiración (30 días)
  const ageSeconds = (Date.now() - timestamp) / 1000;
  if (ageSeconds < 0 || ageSeconds > TOKEN_MAX_AGE_SECONDS) {
    return false;
  }

  const secret = getAdminSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestampStr).digest('hex');

  try {
    const receivedBuffer = Buffer.from(receivedHmac, 'hex');
    const expectedBuffer = Buffer.from(expectedHmac, 'hex');
    if (receivedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifica si la contraseña provista coincide con la clave de administración
 */
export function verifyAdminPassword(password: string): boolean {
  const secret = getAdminSecret();
  if (!password || password.trim() === '') return false;
  
  try {
    const passBuffer = Buffer.from(password.trim());
    const secretBuffer = Buffer.from(secret.trim());
    if (passBuffer.length !== secretBuffer.length) return false;
    return crypto.timingSafeEqual(passBuffer, secretBuffer);
  } catch {
    return password.trim() === secret.trim();
  }
}

/**
 * Revisa si la petición actual posee una sesión válida de administrador (Server-side)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return validateAdminToken(token);
  } catch {
    return false;
  }
}

/**
 * Opciones para guardar la cookie de sesión en el navegador
 */
export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_MAX_AGE_SECONDS
  };
}
