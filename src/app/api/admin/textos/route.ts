import { NextResponse } from 'next/server';
import { getAllTextosSistema, updateTextoSistema, resetTextoSistema } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function GET() {
  try {
    const textos = getAllTextosSistema();
    return NextResponse.json({ success: true, textos });
  } catch (error) {
    console.error('Error al obtener textos_sistema:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Verificar sesión de administrador segura en el servidor
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Acceso denegado: se requiere sesión activa de administrador.' }, { status: 401 });
    }

    const body = await req.json();
    const { clave, valor, usuario = 'Administrador', reset = false } = body;

    if (!clave) {
      return NextResponse.json({ error: 'La clave de texto es obligatoria' }, { status: 400 });
    }

    let ok = false;
    if (reset) {
      ok = resetTextoSistema(clave, usuario);
    } else {
      ok = updateTextoSistema(clave, valor ?? '', usuario);
    }

    if (!ok) {
      return NextResponse.json({ error: 'No se encontró el texto especificado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar texto_sistema:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
