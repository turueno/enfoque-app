import { NextResponse } from 'next/server';
import { auditarEstrategiaConAI, generarAuditoriaEstrategicaHeuristica, conversarConAsistenteEstrategico } from '@/lib/auditorEstrategico';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    if (mode === 'heuristico') {
      const result = generarAuditoriaEstrategicaHeuristica();
      return NextResponse.json({ success: true, data: result });
    }

    const report = await auditarEstrategiaConAI();
    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error en /api/auditor-estrategico GET:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al procesar auditoría estratégica' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mensajes, contextoItem } = body;

    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un arreglo de mensajes' },
        { status: 400 }
      );
    }

    const respuesta = await conversarConAsistenteEstrategico(mensajes, contextoItem);
    return NextResponse.json({ success: true, respuesta });
  } catch (error: any) {
    console.error('Error en /api/auditor-estrategico POST:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al conversar con el Asistente' },
      { status: 500 }
    );
  }
}
