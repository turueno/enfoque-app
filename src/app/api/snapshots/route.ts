import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDashboardSnapshots,
  createDashboardSnapshot,
  deleteDashboardSnapshot
} from '@/lib/snapshots';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshots = getAllDashboardSnapshots();
    return NextResponse.json({ success: true, snapshots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, notas, userId, userEmail, userName } = body;

    if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
      return NextResponse.json(
        { success: false, error: 'El título del corte es obligatorio' },
        { status: 400 }
      );
    }

    const snapshot = createDashboardSnapshot(
      titulo.trim(),
      notas ? notas.trim() : null,
      userName || userEmail || 'Colaborador',
      userId || null
    );

    return NextResponse.json({ success: true, snapshot });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al capturar snapshot' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: solo el administrador autenticado puede eliminar cortes históricos.'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userName = searchParams.get('userName');
    const userEmail = searchParams.get('userEmail');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de snapshot no proporcionado' },
        { status: 400 }
      );
    }

    const ok = deleteDashboardSnapshot(id, userName || userEmail || 'Administrador');
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Snapshot no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar snapshot' },
      { status: 500 }
    );
  }
}
