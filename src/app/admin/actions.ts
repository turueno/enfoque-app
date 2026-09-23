'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_FLAG_COOKIE,
  generateAdminToken,
  getAdminCookieOptions,
  isAdminAuthenticated,
  verifyAdminPassword
} from '@/lib/adminAuth';

export async function loginAdminAction(password: string): Promise<{ success: boolean; error?: string }> {
  if (!password || password.trim() === '') {
    return { success: false, error: 'Por favor ingresa la contraseña de administrador.' };
  }

  const isValid = verifyAdminPassword(password);
  if (!isValid) {
    return { success: false, error: 'Contraseña de administrador incorrecta.' };
  }

  const token = generateAdminToken();
  const cookieStore = await cookies();
  
  // 1. Cookie HttpOnly criptográficamente firmada (seguridad en el servidor)
  cookieStore.set(ADMIN_COOKIE_NAME, token, getAdminCookieOptions());

  // 2. Cookie legible para el cliente (indicador visual inmediato sin parpadeo)
  cookieStore.set(ADMIN_FLAG_COOKIE, 'true', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function logoutAdminAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(ADMIN_FLAG_COOKIE);
  revalidatePath('/admin');
  return { success: true };
}

export async function getAdminStatusAction(): Promise<{ isAdmin: boolean }> {
  const isAuth = await isAdminAuthenticated();
  return { isAdmin: isAuth };
}
