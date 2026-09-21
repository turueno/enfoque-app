import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { frente_id, principio_id, aplicacion, usuario = 'Usuario Google Workspace' } = body;

    const db = getDb();
    db.prepare(`
      INSERT INTO frente_principios (frente_id, principio_id, aplicacion)
      VALUES (?, ?, ?)
      ON CONFLICT(frente_id, principio_id) DO UPDATE SET aplicacion = excluded.aplicacion
    `).run(frente_id, principio_id, aplicacion);

    logAudit(usuario, 'principio_frente', `${frente_id}:${principio_id}`, 'aplicacion', null, aplicacion, 'Actualización de criterio transversal');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error en /api/principios:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
