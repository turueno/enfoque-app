import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      entidadTipo,
      id,
      accion, // 'APROBADO' | 'RECHAZADO' | 'MODIFICADO' | 'PENDIENTE'
      usuario = 'Usuario Google Workspace',
      comentario = '',
      cambios = {}
    } = body;

    if (!entidadTipo || !id || !accion) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const estadoFinal = accion === 'APROBADO' ? 'APROBADO' : accion === 'RECHAZADO' ? 'REQUIERE REVISIÓN' : accion === 'MODIFICADO' ? 'DEFINIDO' : 'POR VALIDAR';

    if (entidadTipo === 'responsabilidad') {
      const current = db.prepare('SELECT * FROM responsabilidades WHERE id = ?').get(id) as Record<string, unknown>;
      if (!current) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

      const rolValidado = cambios.rol_validado !== undefined ? cambios.rol_validado : (current.rol_validado || current.rol_propuesto);

      db.prepare(`
        UPDATE responsabilidades 
        SET rol_validado = ?, estado_validacion = ?, validado_por = ?, fecha_validacion = ?, comentario_validacion = ?
        WHERE id = ?
      `).run(rolValidado, estadoFinal, usuario, now, comentario, id);

      logAudit(usuario, 'responsabilidad', id, 'estado_validacion', String(current.estado_validacion), estadoFinal, comentario);
      if (cambios.rol_validado && cambios.rol_validado !== current.rol_validado) {
        logAudit(usuario, 'responsabilidad', id, 'rol_validado', String(current.rol_validado || ''), String(cambios.rol_validado), 'Modificación en validación');
      }
    } else if (entidadTipo === 'frente') {
      const current = db.prepare('SELECT * FROM frentes WHERE id = ?').get(id) as Record<string, unknown>;
      if (!current) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

      const ownerId = cambios.owner_id !== undefined ? cambios.owner_id : (current.owner_id_validado || current.owner_id_propuesto);

      db.prepare(`
        UPDATE frentes 
        SET owner_id_validado = ?, estado_validacion = ?, validado_por = ?, fecha_validacion = ?, comentario_validacion = ?
        WHERE id = ?
      `).run(ownerId, estadoFinal, usuario, now, comentario, id);

      logAudit(usuario, 'frente', id, 'owner_id_validado', String(current.owner_id_validado || ''), String(ownerId), comentario);
    } else if (entidadTipo === 'resultado') {
      const current = db.prepare('SELECT * FROM resultados WHERE id = ?').get(id) as Record<string, unknown>;
      if (!current) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

      const resVal = cambios.resultado_validado !== undefined ? cambios.resultado_validado : (current.resultado_validado || current.resultado_propuesto);
      const indVal = cambios.indicador_validado !== undefined ? cambios.indicador_validado : (current.indicador_validado || current.indicador_sugerido);
      const meta = cambios.meta !== undefined ? cambios.meta : current.meta;
      const estado = cambios.estado !== undefined ? cambios.estado : current.estado;

      db.prepare(`
        UPDATE resultados 
        SET resultado_validado = ?, indicador_validado = ?, meta = ?, estado = ?, estado_validacion = ?, validado_por = ?, fecha_validacion = ?, comentario_validacion = ?
        WHERE id = ?
      `).run(resVal, indVal, meta, estado, estadoFinal, usuario, now, comentario, id);

      logAudit(usuario, 'resultado', id, 'estado_validacion', String(current.estado_validacion), estadoFinal, comentario);
    } else if (entidadTipo === 'decision') {
      const current = db.prepare('SELECT * FROM decisiones WHERE id = ?').get(id) as Record<string, unknown>;
      if (!current) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

      const decVal = cambios.decisor_validado_id !== undefined ? cambios.decisor_validado_id : (current.decisor_validado_id || current.decisor_propuesto_id);
      const conVal = cambios.consultar_a_validado !== undefined ? cambios.consultar_a_validado : (current.consultar_a_validado || current.consultar_a_propuesto);

      db.prepare(`
        UPDATE decisiones 
        SET decisor_validado_id = ?, consultar_a_validado = ?, estado_validacion = ?, validado_por = ?, fecha_validacion = ?, comentario_validacion = ?
        WHERE id = ?
      `).run(decVal, conVal, estadoFinal, usuario, now, comentario, id);

      logAudit(usuario, 'decision', id, 'estado_validacion', String(current.estado_validacion), estadoFinal, comentario);
    } else if (entidadTipo === 'interfaz') {
      const current = db.prepare('SELECT * FROM interfaces WHERE id = ?').get(id) as Record<string, unknown>;
      if (!current) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });

      const output = cambios.devuelve_output !== undefined ? cambios.devuelve_output : current.devuelve_output;
      const estado = cambios.estado !== undefined ? cambios.estado : current.estado;

      db.prepare(`
        UPDATE interfaces 
        SET devuelve_output = ?, estado = ?, estado_validacion = ?, validado_por = ?, fecha_validacion = ?, comentario_validacion = ?
        WHERE id = ?
      `).run(output, estado, estadoFinal, usuario, now, comentario, id);

      logAudit(usuario, 'interfaz', id, 'estado_validacion', String(current.estado_validacion), estadoFinal, comentario);
    } else {
      return NextResponse.json({ error: `Tipo de entidad no soportado: ${entidadTipo}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, id, estado: estadoFinal });
  } catch (error: unknown) {
    console.error('Error en /api/validate:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
