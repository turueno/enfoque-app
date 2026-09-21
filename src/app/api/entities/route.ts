import { NextResponse } from 'next/server';
import { getDb, logAudit, queryOne } from '@/lib/db';
import { isUserAdmin } from '@/lib/auth';

/**
 * Creates a new organizational entity
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, data, usuario = 'Usuario Google Workspace', userId, userEmail } = body;

    if (!isUserAdmin(userId, userEmail)) {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores pueden dar de alta entidades.' }, { status: 403 });
    }

    const db = getDb();

    if (tipo === 'persona') {
      const id = data.id?.trim() || `P${String(Date.now()).slice(-3)}`;
      db.prepare(`
        INSERT INTO personas (id, nombre, email, rol_funcional_propuesto, territorio_principal, activo, nota, estado_validacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.nombre, data.email || null, data.rol_funcional || null, data.territorio || null, 1, data.nota || null, 'DEFINIDO');
      logAudit(usuario, 'persona', id, 'creacion', null, data.nombre, 'Creación desde panel administrativo');
      return NextResponse.json({ success: true, id });
    }

    if (tipo === 'frente' || tipo === 'proceso') {
      const id = data.id?.trim() || `F${String(Date.now()).slice(-2)}`;
      db.prepare(`
        INSERT INTO frentes (id, nombre_corto, nombre_original, tipo_frente, owner_id_propuesto, owner_id_validado, estado_definicion, estado_validacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.nombre_corto, data.nombre_original || data.nombre_corto, data.tipo_frente || 'Función permanente', data.owner_id || null, data.owner_id || null, 'Definido', 'DEFINIDO');
      logAudit(usuario, 'frente', id, 'creacion', null, data.nombre_corto, 'Creación desde panel administrativo');
      return NextResponse.json({ success: true, id });
    }

    if (tipo === 'responsabilidad') {
      const id = data.id?.trim() || `R${String(Date.now()).slice(-4)}`;
      db.prepare(`
        INSERT INTO responsabilidades (id, frente_id, persona_id, responsabilidad_original, rol_propuesto, rol_validado, estado_revision, estado_validacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.frente_id, data.persona_id, data.responsabilidad, data.rol || 'Ejecuta', data.rol || 'Ejecuta', 'Validado', 'DEFINIDO');
      logAudit(usuario, 'responsabilidad', id, 'creacion', null, data.responsabilidad, 'Creación desde panel administrativo');
      return NextResponse.json({ success: true, id });
    }

    if (tipo === 'decision') {
      const id = data.id?.trim() || `D${String(Date.now()).slice(-2)}`;
      db.prepare(`
        INSERT INTO decisiones (id, frente_id, decision, decisor_propuesto_id, decisor_validado_id, consultar_a_propuesto, momento_trigger, estado_definicion, estado_validacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.frente_id, data.decision, data.decisor_id || null, data.decisor_id || null, data.consultar_a || null, data.momento || null, 'Definido', 'DEFINIDO');
      logAudit(usuario, 'decision', id, 'creacion', null, data.decision, 'Creación desde panel administrativo');
      return NextResponse.json({ success: true, id });
    }

    if (tipo === 'interfaz') {
      const id = data.id?.trim() || `I${String(Date.now()).slice(-2)}`;
      db.prepare(`
        INSERT INTO interfaces (id, de_persona_id, de_persona_nombre, hacia_persona_id, hacia_persona_nombre, entrega_input, devuelve_output, frentes_relacionados, estado_definicion, estado, estado_validacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.de_id || null, data.de_nombre, data.hacia_id || null, data.hacia_nombre, data.entrega, data.devuelve || null, data.frentes || null, 'Definido', 'Operativa', 'DEFINIDO');
      logAudit(usuario, 'interfaz', id, 'creacion', null, `${data.de_nombre} -> ${data.hacia_nombre}`, 'Creación desde panel administrativo');
      return NextResponse.json({ success: true, id });
    }

    if (tipo === 'principio') {
      const id = data.id?.trim() || `PR${String(Date.now()).slice(-2)}`;
      db.prepare(`
        INSERT INTO principios (id, principio, texto_original, interpretacion_propuesta, donde_aplica, estado)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.principio,
        data.texto_original || null,
        data.interpretacion_propuesta || null,
        data.donde_aplica || 'Todos los frentes',
        data.estado || 'Por desarrollar'
      );

      // Vincular por defecto con los 7 frentes para consistencia en la matriz
      const frentes = db.prepare('SELECT id FROM frentes').all() as { id: string }[];
      const insertFP = db.prepare(`
        INSERT OR IGNORE INTO frente_principios (frente_id, principio_id, aplicacion)
        VALUES (?, ?, 'Aplica')
      `);
      for (const f of frentes) {
        insertFP.run(f.id, id);
      }

      logAudit(usuario, 'principio', id, 'creacion', null, data.principio, 'Creación desde panel administrativo');
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: 'Tipo desconocido' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error en POST /api/entities:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * Updates an existing organizational entity
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { tipo, id, data, usuario = 'Usuario Google Workspace', userId, userEmail } = body;

    if (!isUserAdmin(userId, userEmail)) {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores pueden editar entidades.' }, { status: 403 });
    }

    if (!id || !tipo) {
      return NextResponse.json({ error: 'Tipo e ID son requeridos' }, { status: 400 });
    }

    const db = getDb();

    if (tipo === 'persona') {
      const current = queryOne<Record<string, unknown>>('SELECT * FROM personas WHERE id = ?', id);
      if (!current) return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 });

      db.prepare(`
        UPDATE personas 
        SET nombre = ?, email = ?, rol_funcional_propuesto = ?, territorio_principal = ?, nota = ?, activo = ?
        WHERE id = ?
      `).run(
        data.nombre,
        data.email || null,
        data.rol_funcional || null,
        data.territorio || null,
        data.nota || null,
        data.activo !== undefined ? (data.activo ? 1 : 0) : 1,
        id
      );

      logAudit(usuario, 'persona', id, 'edicion_integral', String(current.nombre), data.nombre, 'Actualización desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'frente' || tipo === 'proceso') {
      const current = queryOne<Record<string, unknown>>('SELECT * FROM frentes WHERE id = ?', id);
      if (!current) return NextResponse.json({ error: 'Proceso no encontrado' }, { status: 404 });

      db.prepare(`
        UPDATE frentes 
        SET nombre_corto = ?, nombre_original = ?, tipo_frente = ?, owner_id_validado = ?
        WHERE id = ?
      `).run(
        data.nombre_corto,
        data.nombre_original || data.nombre_corto,
        data.tipo_frente || 'Función permanente',
        data.owner_id || null,
        id
      );

      logAudit(usuario, 'frente', id, 'edicion_integral', String(current.nombre_corto), data.nombre_corto, 'Actualización desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'decision') {
      const current = queryOne<Record<string, unknown>>('SELECT * FROM decisiones WHERE id = ?', id);
      if (!current) return NextResponse.json({ error: 'Decisión no encontrada' }, { status: 404 });

      db.prepare(`
        UPDATE decisiones 
        SET frente_id = ?, decision = ?, decisor_validado_id = ?, consultar_a_validado = ?, momento_trigger = ?
        WHERE id = ?
      `).run(
        data.frente_id,
        data.decision,
        data.decisor_id || null,
        data.consultar_a || null,
        data.momento || null,
        id
      );

      logAudit(usuario, 'decision', id, 'edicion_integral', String(current.decision), data.decision, 'Actualización desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'interfaz') {
      const current = queryOne<Record<string, unknown>>('SELECT * FROM interfaces WHERE id = ?', id);
      if (!current) return NextResponse.json({ error: 'Interfaz no encontrada' }, { status: 404 });

      db.prepare(`
        UPDATE interfaces 
        SET de_persona_id = ?, de_persona_nombre = ?, hacia_persona_id = ?, hacia_persona_nombre = ?,
            entrega_input = ?, devuelve_output = ?, frentes_relacionados = ?, estado = ?
        WHERE id = ?
      `).run(
        data.de_id || null,
        data.de_nombre,
        data.hacia_id || null,
        data.hacia_nombre,
        data.entrega,
        data.devuelve || null,
        data.frentes || null,
        data.estado || 'Operativa',
        id
      );

      logAudit(usuario, 'interfaz', id, 'edicion_integral', String(current.entrega_input), data.entrega, 'Actualización desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'responsabilidad') {
      const current = queryOne<Record<string, unknown>>('SELECT * FROM responsabilidades WHERE id = ?', id);
      if (!current) return NextResponse.json({ error: 'Responsabilidad no encontrada' }, { status: 404 });

      db.prepare(`
        UPDATE responsabilidades 
        SET frente_id = ?, persona_id = ?, responsabilidad_original = ?, rol_validado = ?
        WHERE id = ?
      `).run(
        data.frente_id,
        data.persona_id,
        data.responsabilidad,
        data.rol,
        id
      );

      logAudit(usuario, 'responsabilidad', id, 'edicion_integral', String(current.responsabilidad_original), data.responsabilidad, 'Actualización desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'principio') {
      const current = queryOne<Record<string, unknown>>('SELECT * FROM principios WHERE id = ?', id);
      if (!current) return NextResponse.json({ error: 'Principio no encontrado' }, { status: 404 });

      db.prepare(`
        UPDATE principios 
        SET principio = ?, texto_original = ?, interpretacion_propuesta = ?, donde_aplica = ?, estado = ?
        WHERE id = ?
      `).run(
        data.principio,
        data.texto_original || null,
        data.interpretacion_propuesta || null,
        data.donde_aplica || 'Todos los frentes',
        data.estado || 'Por desarrollar',
        id
      );

      logAudit(usuario, 'principio', id, 'edicion_integral', String(current.principio), data.principio, 'Actualización desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Tipo desconocido' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error en PUT /api/entities:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * Soft-deactivates or deletes an entity safely
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const id = searchParams.get('id');
    const usuario = searchParams.get('usuario') || 'Usuario Google Workspace';
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    if (!isUserAdmin(userId, userEmail)) {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores pueden eliminar entidades.' }, { status: 403 });
    }

    if (!id || !tipo) {
      return NextResponse.json({ error: 'Tipo e ID son requeridos' }, { status: 400 });
    }

    const db = getDb();

    if (tipo === 'persona') {
      // Soft delete: deactivate
      db.prepare('UPDATE personas SET activo = 0 WHERE id = ?').run(id);
      logAudit(usuario, 'persona', id, 'activo', '1', '0', 'Desactivación lógica desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'decision') {
      db.prepare('DELETE FROM decisiones WHERE id = ?').run(id);
      logAudit(usuario, 'decision', id, 'eliminacion', id, null, 'Eliminación desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'interfaz') {
      db.prepare('DELETE FROM interfaces WHERE id = ?').run(id);
      logAudit(usuario, 'interfaz', id, 'eliminacion', id, null, 'Eliminación desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'responsabilidad') {
      db.prepare('DELETE FROM responsabilidades WHERE id = ?').run(id);
      logAudit(usuario, 'responsabilidad', id, 'eliminacion', id, null, 'Eliminación desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    if (tipo === 'principio') {
      db.prepare('DELETE FROM frente_principios WHERE principio_id = ?').run(id);
      db.prepare('DELETE FROM principios WHERE id = ?').run(id);
      logAudit(usuario, 'principio', id, 'eliminacion', id, null, 'Eliminación desde panel administrativo');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Operación no permitida para este tipo' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error en DELETE /api/entities:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
