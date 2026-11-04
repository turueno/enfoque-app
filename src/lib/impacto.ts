import { getDb, queryAll, queryOne, logAudit } from './db';
import { TemaImpacto, PriorityLevel } from './types';
import { getAllPersonas, getAllFrentes } from './queries';

/**
 * Returns all impact items with optional filtering.
 */
export function getTemasImpacto(options?: {
  estado?: string;
  frente_id?: string;
  responsable_id?: string;
  horizonte?: string;
}): TemaImpacto[] {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.estado && options.estado !== 'ALL') {
    conditions.push('estado = ?');
    params.push(options.estado);
  }

  if (options?.frente_id && options.frente_id !== 'ALL') {
    conditions.push('frente_id = ?');
    params.push(options.frente_id);
  }

  if (options?.responsable_id && options.responsable_id !== 'ALL') {
    conditions.push('responsable_id = ?');
    params.push(options.responsable_id);
  }

  if (options?.horizonte && options.horizonte !== 'ALL') {
    conditions.push('horizonte_temporal = ?');
    params.push(options.horizonte);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT * FROM temas_impacto
    ${whereClause}
    ORDER BY 
      CASE estado
        WHEN 'Bloqueado' THEN 1
        WHEN 'Requiere Atención' THEN 2
        WHEN 'En curso' THEN 3
        WHEN 'Resuelto' THEN 4
        ELSE 5
      END,
      created_at DESC
  `;

  const rows = queryAll<TemaImpacto>(sql, ...params);
  const personas = getAllPersonas();
  const frentes = getAllFrentes();

  const personasMap = new Map<string, string>();
  for (const p of personas) {
    personasMap.set(p.id, p.nombre);
  }

  const frentesMap = new Map<string, string>();
  for (const f of frentes) {
    frentesMap.set(f.id, f.nombre_corto);
  }

  return rows.map(r => {
    let involucradosIds: string[] = [];
    try {
      involucradosIds = JSON.parse(r.involucrados_ids_json || '[]');
    } catch {}

    const involucradosNombres = involucradosIds
      .map(id => personasMap.get(id))
      .filter(Boolean) as string[];

    let frentesIds: string[] = [];
    try {
      if (r.frentes_ids_json) {
        frentesIds = JSON.parse(r.frentes_ids_json);
      }
    } catch {}

    if ((!frentesIds || frentesIds.length === 0) && r.frente_id) {
      // Soporta formato separado por comas o id simple
      frentesIds = r.frente_id.split(',').map(s => s.trim()).filter(Boolean);
    }

    const frentesNombres = frentesIds
      .map(id => frentesMap.get(id))
      .filter(Boolean) as string[];

    const principalNombre = frentesNombres.length > 0 ? frentesNombres.join(', ') : (r.frente_id ? frentesMap.get(r.frente_id) : undefined);

    return {
      ...r,
      frente_nombre: principalNombre,
      frentes_ids: frentesIds,
      frentes_nombres: frentesNombres,
      responsable_nombre: r.responsable_id ? personasMap.get(r.responsable_id) : undefined,
      involucrados_nombres: involucradosNombres
    };
  });
}

/**
 * Creates a new Tema de Impacto
 */
export function createTemaImpacto(data: {
  titulo: string;
  descripcion?: string | null;
  horizonte_temporal: '30 días' | '60 días' | '90 días' | 'Fin de año' | 'Personalizado';
  fecha_limite?: string | null;
  frente_id?: string | null;
  frentes_ids?: string[];
  resultado_id?: string | null;
  responsable_id?: string | null;
  involucrados_ids?: string[];
  prioridad?: 'P1' | 'P2';
  usuario?: string;
}): TemaImpacto {
  const db = getDb();
  const id = `IMP-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const now = new Date().toISOString();
  const user = data.usuario || 'Colaborador';
  const involucradosJson = JSON.stringify(data.involucrados_ids || []);

  const frentesList = data.frentes_ids && data.frentes_ids.length > 0
    ? data.frentes_ids
    : (data.frente_id ? [data.frente_id] : []);
  const frentesJson = JSON.stringify(frentesList);
  const primaryFrenteId = frentesList[0] || data.frente_id || null;

  const stmt = db.prepare(`
    INSERT INTO temas_impacto (
      id, titulo, descripcion, horizonte_temporal, fecha_limite,
      frente_id, frentes_ids_json, resultado_id, responsable_id, involucrados_ids_json,
      estado, prioridad, decisiones_generadas_ids_json,
      responsabilidades_generadas_ids_json, interfaces_generadas_ids_json,
      created_at, created_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'En curso', ?, '[]', '[]', '[]', ?, ?, ?)
  `);

  stmt.run(
    id,
    data.titulo.trim(),
    data.descripcion?.trim() || null,
    data.horizonte_temporal,
    data.fecha_limite || null,
    primaryFrenteId,
    frentesJson,
    data.resultado_id || null,
    data.responsable_id || null,
    involucradosJson,
    data.prioridad || 'P1',
    now,
    user,
    now
  );

  logAudit(
    user,
    'tema_impacto',
    id,
    'creacion',
    null,
    data.titulo,
    `Tema de impacto creado: ${data.titulo} (${data.horizonte_temporal})`
  );

  const created = queryOne<TemaImpacto>('SELECT * FROM temas_impacto WHERE id = ?', id);
  return created!;
}

/**
 * Updates a Tema de Impacto status or details
 */
export function updateTemaImpacto(
  id: string,
  updates: Partial<TemaImpacto>,
  usuario = 'Colaborador'
): boolean {
  const db = getDb();
  const current = queryOne<TemaImpacto>('SELECT * FROM temas_impacto WHERE id = ?', id);
  if (!current) return false;

  const now = new Date().toISOString();
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.titulo !== undefined) {
    fields.push('titulo = ?');
    params.push(updates.titulo.trim());
  }
  if (updates.descripcion !== undefined) {
    fields.push('descripcion = ?');
    params.push(updates.descripcion ? updates.descripcion.trim() : null);
  }
  if (updates.estado !== undefined) {
    fields.push('estado = ?');
    params.push(updates.estado);
  }
  if (updates.prioridad !== undefined) {
    fields.push('prioridad = ?');
    params.push(updates.prioridad);
  }
  if (updates.horizonte_temporal !== undefined) {
    fields.push('horizonte_temporal = ?');
    params.push(updates.horizonte_temporal);
  }
  if (updates.fecha_limite !== undefined) {
    fields.push('fecha_limite = ?');
    params.push(updates.fecha_limite);
  }
  if (updates.frente_id !== undefined) {
    fields.push('frente_id = ?');
    params.push(updates.frente_id);
  }
  if (updates.resultado_id !== undefined) {
    fields.push('resultado_id = ?');
    params.push(updates.resultado_id);
  }
  if (updates.responsable_id !== undefined) {
    fields.push('responsable_id = ?');
    params.push(updates.responsable_id);
  }
  if (updates.involucrados_ids_json !== undefined) {
    fields.push('involucrados_ids_json = ?');
    params.push(updates.involucrados_ids_json);
  }

  if (fields.length === 0) return true;

  fields.push('updated_at = ?');
  params.push(now);

  params.push(id);

  const sql = `UPDATE temas_impacto SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...params);

  if (updates.estado && updates.estado !== current.estado) {
    logAudit(usuario, 'tema_impacto', id, 'estado', current.estado, updates.estado, 'Actualización de estatus de tema de impacto');
  }

  return true;
}

/**
 * Links an entity (decision, responsabilidad, interfaz) to a Tema de Impacto
 */
export function linkEntidadToImpacto(
  temaId: string,
  tipo: 'decision' | 'responsabilidad' | 'interfaz',
  entidadId: string
): boolean {
  const db = getDb();
  const tema = queryOne<TemaImpacto>('SELECT * FROM temas_impacto WHERE id = ?', temaId);
  if (!tema) return false;

  const now = new Date().toISOString();

  if (tipo === 'decision') {
    let ids: string[] = [];
    try {
      ids = JSON.parse(tema.decisiones_generadas_ids_json || '[]');
    } catch {}
    if (!ids.includes(entidadId)) {
      ids.push(entidadId);
      db.prepare('UPDATE temas_impacto SET decisiones_generadas_ids_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(ids), now, temaId);
    }
  } else if (tipo === 'responsabilidad') {
    let ids: string[] = [];
    try {
      ids = JSON.parse(tema.responsabilidades_generadas_ids_json || '[]');
    } catch {}
    if (!ids.includes(entidadId)) {
      ids.push(entidadId);
      db.prepare('UPDATE temas_impacto SET responsabilidades_generadas_ids_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(ids), now, temaId);
    }
  } else if (tipo === 'interfaz') {
    let ids: string[] = [];
    try {
      ids = JSON.parse(tema.interfaces_generadas_ids_json || '[]');
    } catch {}
    if (!ids.includes(entidadId)) {
      ids.push(entidadId);
      db.prepare('UPDATE temas_impacto SET interfaces_generadas_ids_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(ids), now, temaId);
    }
  }

  return true;
}
