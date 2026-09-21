import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDashboardSnapshots,
  createDashboardSnapshot,
  deleteDashboardSnapshot
} from '@/lib/snapshots';
import { isUserAdmin } from '@/lib/auth';

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

    // Verificar permisos de administrador
    if (!isUserAdmin(userId, userEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: solo los administradores autorizados pueden capturar cortes de gobernanza.'
        },
        { status: 403 }
      );
    }

    const snapshot = createDashboardSnapshot(
      titulo.trim(),
      notas ? notas.trim() : null,
      userName || userEmail || 'Administrador',
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');
    const userName = searchParams.get('userName');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de snapshot no proporcionado' },
        { status: 400 }
      );
    }

    if (!isUserAdmin(userId, userEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: solo los administradores pueden eliminar cortes históricos.'
        },
        { status: 403 }
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
