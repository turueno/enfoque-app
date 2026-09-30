import { NextRequest, NextResponse } from 'next/server';
import { recordTelemetria, getTelemetriaLog, getTelemetriaStats } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      // Soporte para navigator.sendBeacon (suele enviar text/plain)
      const text = await req.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
        }
      }
    }

    if (!body || !body.tipo_evento) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const saved = recordTelemetria({
      session_id: body.session_id,
      persona_id: body.persona_id,
      persona_nombre: body.persona_nombre,
      persona_rol: body.persona_rol,
      tipo_evento: body.tipo_evento,
      modulo_ruta: body.modulo_ruta,
      detalles: typeof body.detalles === 'object' ? JSON.stringify(body.detalles) : body.detalles,
      duracion_segundos: typeof body.duracion_segundos === 'number' ? body.duracion_segundos : undefined
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (error: any) {
    console.error('Error registrando telemetría:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 200;
    const persona_id = searchParams.get('persona_id') || undefined;
    const tipo_evento = searchParams.get('tipo_evento') || undefined;
    const withStats = searchParams.get('stats') === 'true';

    const logs = getTelemetriaLog({ limit, persona_id, tipo_evento });
    const stats = withStats ? getTelemetriaStats() : undefined;

    return NextResponse.json({ logs, stats });
  } catch (error: any) {
    console.error('Error consultando telemetría:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
