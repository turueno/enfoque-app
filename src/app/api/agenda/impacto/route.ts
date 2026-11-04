import { NextRequest, NextResponse } from 'next/server';
import {
  getTemasImpacto,
  createTemaImpacto,
  updateTemaImpacto,
  linkEntidadToImpacto
} from '@/lib/impacto';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') || undefined;
    const frente_id = searchParams.get('frente_id') || undefined;
    const responsable_id = searchParams.get('responsable_id') || undefined;
    const horizonte = searchParams.get('horizonte') || undefined;

    const temas = getTemasImpacto({ estado, frente_id, responsable_id, horizonte });
    return NextResponse.json({ success: true, temas });
  } catch (error: any) {
    console.error('Error al obtener temas de impacto:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener temas de impacto' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'create', data, temaId, usuario = 'Colaborador' } = body;

    // 1. Crear nuevo tema de impacto
    if (action === 'create') {
      if (!data || !data.titulo || !data.titulo.trim()) {
        return NextResponse.json({ success: false, error: 'El título del tema es obligatorio' }, { status: 400 });
      }

      const nuevoTema = createTemaImpacto({
        titulo: data.titulo,
        descripcion: data.descripcion,
        horizonte_temporal: data.horizonte_temporal || '90 días',
        fecha_limite: data.fecha_limite,
        frente_id: data.frente_id,
        resultado_id: data.resultado_id,
        responsable_id: data.responsable_id,
        involucrados_ids: data.involucrados_ids,
        prioridad: data.prioridad || 'P1',
        usuario
      });

      return NextResponse.json({ success: true, tema: nuevoTema });
    }

    // 2. Actualizar tema existente (estado, prioridad, etc.)
    if (action === 'update') {
      if (!temaId) {
        return NextResponse.json({ success: false, error: 'ID de tema requerido' }, { status: 400 });
      }

      const ok = updateTemaImpacto(temaId, data, usuario);
      return NextResponse.json({ success: ok });
    }

    // 3. Derivar entidad (Decisión, Responsabilidad o Interfaz) y vincularla directamente
    if (action === 'derivar') {
      if (!temaId || !data || !data.tipoEntidad) {
        return NextResponse.json({ success: false, error: 'Parámetros insuficientes para derivación' }, { status: 400 });
      }

      const db = getDb();
      const tipo = data.tipoEntidad;

      if (tipo === 'decision') {
        const id = data.id?.trim() || `D${String(Date.now()).slice(-4)}`;
        const decisionText = data.decision?.trim() || 'Nueva decisión derivada de Impacto';
        db.prepare(`
          INSERT INTO decisiones (
            id, frente_id, decision, decisor_propuesto_id, decisor_validado_id,
            consultar_a_propuesto, momento_trigger, criterio_decision, estado_definicion, estado_validacion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Definido', 'DEFINIDO')
        `).run(
          id,
          data.frente_id || 'F01',
          decisionText,
          data.decisor_id || null,
          data.decisor_id || null,
          data.consultar_a || null,
          data.momento_trigger || null,
          data.criterio_decision || null
        );

        linkEntidadToImpacto(temaId, 'decision', id);
        logAudit(usuario, 'decision', id, 'creacion', null, decisionText, `Decisión derivada de Tema de Impacto (${temaId})`);
        return NextResponse.json({ success: true, entidadId: id, tipo: 'decision' });
      }

      if (tipo === 'responsabilidad') {
        const id = data.id?.trim() || `R${String(Date.now()).slice(-4)}`;
        const respText = data.responsabilidad?.trim() || 'Nueva responsabilidad derivada de Impacto';
        db.prepare(`
          INSERT INTO responsabilidades (
            id, frente_id, persona_id, responsabilidad_original, rol_propuesto, rol_validado,
            estado_revision, estado_validacion, comentario_propuesta
          ) VALUES (?, ?, ?, ?, ?, ?, 'Validado', 'DEFINIDO', ?)
        `).run(
          id,
          data.frente_id || 'F01',
          data.persona_id || 'P01',
          respText,
          data.rol || 'Owner / Ejecuta',
          data.rol || 'Owner / Ejecuta',
          `Generado desde Tema de Impacto ${temaId}`
        );

        linkEntidadToImpacto(temaId, 'responsabilidad', id);
        logAudit(usuario, 'responsabilidad', id, 'creacion', null, respText, `Responsabilidad derivada de Tema de Impacto (${temaId})`);
        return NextResponse.json({ success: true, entidadId: id, tipo: 'responsabilidad' });
      }

      if (tipo === 'interfaz') {
        const id = data.id?.trim() || `INT-${Date.now().toString().slice(-4)}`;
        db.prepare(`
          INSERT INTO interfaces (
            id, de_persona_id, de_persona_nombre, hacia_persona_id, hacia_persona_nombre,
            entrega_input, devuelve_output, frentes_relacionados, estado, estado_definicion, estado_validacion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Operativa', 'Definido', 'DEFINIDO')
        `).run(
          id,
          data.de_persona_id || null,
          data.de_persona_nombre || 'Colaborador',
          data.hacia_persona_id || null,
          data.hacia_persona_nombre || 'Colaborador',
          data.entrega_input?.trim() || 'Entrega requerida para destrabar tema',
          data.devuelve_output?.trim() || null,
          data.frente_id || null
        );

        linkEntidadToImpacto(temaId, 'interfaz', id);
        logAudit(usuario, 'interfaz', id, 'creacion', null, `${data.de_persona_nombre} -> ${data.hacia_persona_nombre}`, `Relación derivada de Tema de Impacto (${temaId})`);
        return NextResponse.json({ success: true, entidadId: id, tipo: 'interfaz' });
      }

      return NextResponse.json({ success: false, error: 'Tipo de entidad no soportado' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en API agenda/impacto:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar tema de impacto' },
      { status: 500 }
    );
  }
}
