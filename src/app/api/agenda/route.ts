import { NextResponse } from 'next/server';
import {
  getAgendaSemanal,
  getAgendaBilateral,
  getAgendaProceso,
  toggleDestacadoSemana,
  setPrioridadManual,
  guardarMinutaReunion,
  getMinutasReuniones,
  quickSetInterfazStatus
} from '@/lib/agenda';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') || 'semanal';
    const semana = searchParams.get('semana') || undefined;

    if (tipo === 'minutas') {
      const minutas = getMinutasReuniones();
      return NextResponse.json({ success: true, minutas });
    }

    if (tipo === 'bilateral') {
      const personaA = searchParams.get('personaA') || '';
      const personaB = searchParams.get('personaB') || '';
      const data = getAgendaBilateral(personaA, personaB, semana);
      return NextResponse.json({ success: true, ...data });
    }

    if (tipo === 'proceso') {
      const frente = searchParams.get('frente') || '';
      const data = getAgendaProceso(frente, semana);
      return NextResponse.json({ success: true, ...data });
    }

    // Default: Semanal General
    const data = getAgendaSemanal(semana);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error al consultar agenda:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, entidadTipo, entidadId, prioridad, usuario, semana, minuta } = body;

    if (action === 'toggle_star') {
      if (!entidadTipo || !entidadId) {
        return NextResponse.json({ error: 'Faltan parámetros de entidad' }, { status: 400 });
      }
      const nuevoEstado = toggleDestacadoSemana(entidadTipo, entidadId, usuario, semana);
      return NextResponse.json({ success: true, destacado: nuevoEstado });
    }

    if (action === 'quick_status') {
      if (!entidadTipo || !entidadId || !body.estado) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
      }
      if (entidadTipo === 'interfaz') {
        quickSetInterfazStatus(entidadId, body.estado);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Operación no soportada para este tipo' }, { status: 400 });
    }

    if (action === 'set_priority') {
      if (!entidadTipo || !entidadId) {
        return NextResponse.json({ error: 'Faltan parámetros de entidad' }, { status: 400 });
      }
      setPrioridadManual(entidadTipo, entidadId, prioridad, usuario, semana);
      return NextResponse.json({ success: true });
    }

    if (action === 'guardar_minuta') {
      if (!minuta || !minuta.titulo || !minuta.participantes) {
        return NextResponse.json({ error: 'Datos de minuta incompletos' }, { status: 400 });
      }
      const guardada = guardarMinutaReunion({
        tipo_reunion: minuta.tipo_reunion || 'semanal_general',
        titulo: minuta.titulo,
        participantes: minuta.participantes,
        frente_id: minuta.frente_id || null,
        acuerdos: minuta.acuerdos || [],
        temas_tratados: minuta.temas_tratados || [],
        usuario: usuario || 'Usuario'
      });
      return NextResponse.json({ success: true, minuta: guardada });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('Error en API agenda:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
