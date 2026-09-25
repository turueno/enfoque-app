import { getDb, queryAll, queryOne } from './db';
import {
  getAllInterfaces,
  getAllDecisiones,
  getAllResponsabilidades,
  getAllPersonas,
  getAllFrentes,
  getAllPrincipios,
  getStructuralAlerts
} from './queries';
import {
  AgendaItem,
  PrioridadAgenda,
  PriorityLevel,
  ReunionMinuta,
  Persona,
  Frente
} from './types';

/**
 * Returns current week cycle string, e.g. "2026-W38"
 */
export function getCurrentSemanaCiclo(): string {
  const d = new Date();
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Retrieves all manual priorities/pins stored for a given week cycle.
 */
export function getPrioridadesAgenda(semana?: string): PrioridadAgenda[] {
  const ciclo = semana || getCurrentSemanaCiclo();
  return queryAll<PrioridadAgenda>(
    'SELECT * FROM prioridades_agenda WHERE semana_ciclo = ?',
    ciclo
  );
}

/**
 * Toggles or sets the ⭐ pin status of an entity for the current week.
 */
export function toggleDestacadoSemana(
  entidadTipo: PrioridadAgenda['entidad_tipo'],
  entidadId: string,
  usuario?: string,
  semana?: string
): boolean {
  const db = getDb();
  const ciclo = semana || getCurrentSemanaCiclo();
  const now = new Date().toISOString();

  const existing = queryOne<PrioridadAgenda>(
    'SELECT * FROM prioridades_agenda WHERE entidad_tipo = ? AND entidad_id = ? AND semana_ciclo = ?',
    entidadTipo,
    entidadId,
    ciclo
  );

  if (existing) {
    const nextVal = existing.destacado_semana === 1 ? 0 : 1;
    db.prepare(`
      UPDATE prioridades_agenda
      SET destacado_semana = ?, actualizado_por = ?, updated_at = ?
      WHERE id = ?
    `).run(nextVal, usuario || 'Usuario', now, existing.id);
    return nextVal === 1;
  } else {
    const id = `PRIOR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO prioridades_agenda (id, entidad_tipo, entidad_id, prioridad_manual, destacado_semana, semana_ciclo, actualizado_por, updated_at)
      VALUES (?, ?, ?, NULL, 1, ?, ?, ?)
    `).run(id, entidadTipo, entidadId, ciclo, usuario || 'Usuario', now);
    return true;
  }
}

/**
 * Manually overrides the priority level (P1, P2, P3 or reset to NULL) of an entity.
 */
export function setPrioridadManual(
  entidadTipo: PrioridadAgenda['entidad_tipo'],
  entidadId: string,
  prioridad: PriorityLevel | null,
  usuario?: string,
  semana?: string
): boolean {
  const db = getDb();
  const ciclo = semana || getCurrentSemanaCiclo();
  const now = new Date().toISOString();

  const existing = queryOne<PrioridadAgenda>(
    'SELECT * FROM prioridades_agenda WHERE entidad_tipo = ? AND entidad_id = ? AND semana_ciclo = ?',
    entidadTipo,
    entidadId,
    ciclo
  );

  if (existing) {
    db.prepare(`
      UPDATE prioridades_agenda
      SET prioridad_manual = ?, actualizado_por = ?, updated_at = ?
      WHERE id = ?
    `).run(prioridad, usuario || 'Usuario', now, existing.id);
  } else {
    const id = `PRIOR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO prioridades_agenda (id, entidad_tipo, entidad_id, prioridad_manual, destacado_semana, semana_ciclo, actualizado_por, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `).run(id, entidadTipo, entidadId, prioridad, ciclo, usuario || 'Usuario', now);
  }
  return true;
}

/**
 * Quickly updates just the operational status of an interface.
 */
export function quickSetInterfazStatus(id: string, estado: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE interfaces SET estado = ? WHERE id = ?').run(estado, id);
  return result.changes > 0;
}

/**
 * Persists meeting minutes and agreements.
 */
export function guardarMinutaReunion(data: {
  tipo_reunion: 'semanal_general' | 'bilateral' | 'proceso';
  titulo: string;
  participantes: string[];
  frente_id?: string | null;
  acuerdos: { temaId: string; acuerdo: string; responsable?: string }[];
  temas_tratados?: string[];
  usuario: string;
}): ReunionMinuta {
  const db = getDb();
  const id = `MINUTA-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reuniones_minutas (
      id, tipo_reunion, titulo, participantes_json, frente_id, acuerdos_json, temas_tratados_json, created_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.tipo_reunion,
    data.titulo,
    JSON.stringify(data.participantes),
    data.frente_id || null,
    JSON.stringify(data.acuerdos),
    JSON.stringify(data.temas_tratados || []),
    now,
    data.usuario
  );

  return {
    id,
    tipo_reunion: data.tipo_reunion,
    titulo: data.titulo,
    participantes_json: JSON.stringify(data.participantes),
    frente_id: data.frente_id || null,
    acuerdos_json: JSON.stringify(data.acuerdos),
    temas_tratados_json: JSON.stringify(data.temas_tratados || []),
    created_at: now,
    created_by: data.usuario
  };
}

/**
 * Gets historical meeting minutes.
 */
export function getMinutasReuniones(limit = 20): ReunionMinuta[] {
  return queryAll<ReunionMinuta>(
    'SELECT * FROM reuniones_minutas ORDER BY created_at DESC LIMIT ?',
    limit
  );
}

// -------------------------------------------------------------
// MOTOR DE REGLAS DE PRIORIZACIÓN & CONSTRUCCIÓN DE AGENDAS
// -------------------------------------------------------------

function applyPriorityOverrides(
  items: AgendaItem[],
  prioridadesMap: Map<string, PrioridadAgenda>
): AgendaItem[] {
  return items.map(item => {
    const key = `${item.entidad_tipo}-${item.entidad_id}`;
    const p = prioridadesMap.get(key);
    const destacado = p ? p.destacado_semana === 1 : false;
    const manual = p?.prioridad_manual || null;

    // Si está destacado con ⭐, se promueve inmediatamente a P1
    const efectiva: PriorityLevel = destacado ? 'P1' : manual || item.prioridad_calculada;

    return {
      ...item,
      destacado_semana: destacado,
      prioridad_manual: manual,
      prioridad_efectiva: efectiva
    };
  });
}

/**
 * Compiles all operational agenda items across the organization.
 */
function getAllRawAgendaItems(): AgendaItem[] {
  const items: AgendaItem[] = [];

  const interfaces = getAllInterfaces();
  const decisiones = getAllDecisiones();
  const responsabilidades = getAllResponsabilidades();
  const alerts = getStructuralAlerts();
  const principios = getAllPrincipios();

  // 1. Interfaces / Relaciones
  for (const i of interfaces) {
    const isIncomplete = !i.devuelve_output || i.devuelve_output.trim() === '';
    const isAtRisk = i.estado === 'En riesgo' || i.estado === 'Bloqueada';
    const isPending = i.estado_validacion === 'POR VALIDAR';

    let calc: PriorityLevel = 'P3';
    let accion = 'Revisar cumplimiento del acuerdo operativo';

    if (isAtRisk || isIncomplete) {
      calc = 'P1';
      accion = isAtRisk
        ? `Desbloquear relación marcada como '${i.estado}'`
        : 'Definir devolución requerida (falta output de retorno)';
    } else if (isPending) {
      calc = 'P2';
      accion = 'Validar formalmente los términos del acuerdo de entrega';
    }

    const deNombre = i.de_persona_nombre || 'Colaborador';
    const haciaNombre = i.hacia_persona_nombre || 'Colaborador';

    items.push({
      id: `interfaz-${i.id}`,
      entidad_tipo: 'interfaz',
      entidad_id: i.id,
      titulo: `${deNombre} ➔ ${haciaNombre}`,
      subtitulo: `Entrega: "${i.entrega_input}"${i.devuelve_output ? ` | Devuelve: "${i.devuelve_output}"` : ' [Sin devolución definida]'}`,
      prioridad_calculada: calc,
      prioridad_manual: null,
      destacado_semana: false,
      prioridad_efectiva: calc,
      estado: i.estado,
      involucrados: [deNombre, haciaNombre].filter(Boolean),
      frente_nombre: i.frentes_relacionados || undefined,
      accion_sugerida: accion,
      detalles: {
        id: i.id,
        entrega: i.entrega_input,
        devuelve: i.devuelve_output,
        estado_validacion: i.estado_validacion,
        de_persona_id: i.de_persona_id,
        hacia_persona_id: i.hacia_persona_id
      }
    });
  }

  // 2. Decisiones
  for (const d of decisiones) {
    const isWithoutOwner = !d.decisor_validado_id && !d.decisor_propuesto_id;
    const isPendingValidation = d.estado_validacion === 'POR VALIDAR';
    const hasConsultation = Boolean(d.consultar_a_validado || d.consultar_a_propuesto);

    let calc: PriorityLevel = 'P3';
    let accion = 'Monitorear disparador de decisión';

    if (isWithoutOwner) {
      calc = 'P1';
      accion = 'Asignar con urgencia la autoridad final de decisión';
    } else if (isPendingValidation) {
      calc = 'P2';
      accion = 'Ratificar autoridad decisoria y personas de consulta obligatoria';
    } else if (hasConsultation && d.momento_trigger) {
      calc = 'P2';
      accion = `Alinear criterio ante momento: "${d.momento_trigger}"`;
    }

    const decisor = d.decisor_nombre || d.decisor_propuesto_nombre || 'Sin decisor';
    const consultados = [d.consultar_a_validado, d.consultar_a_propuesto].filter(Boolean) as string[];

    items.push({
      id: `decision-${d.id}`,
      entidad_tipo: 'decision',
      entidad_id: d.id,
      titulo: d.decision,
      subtitulo: `Decide: ${decisor}${consultados.length > 0 ? ` | Consulta: ${consultados.join(', ')}` : ''}`,
      prioridad_calculada: calc,
      prioridad_manual: null,
      destacado_semana: false,
      prioridad_efectiva: calc,
      estado: d.estado_validacion,
      involucrados: [decisor, ...consultados].filter(Boolean),
      frente_nombre: d.frente_nombre,
      accion_sugerida: accion,
      detalles: {
        id: d.id,
        momento_trigger: d.momento_trigger,
        criterio_decision: d.criterio_decision,
        decisor_id: d.decisor_validado_id || d.decisor_propuesto_id,
        consultar_a: consultados.join(', ')
      }
    });
  }

  // 3. Validaciones de Responsabilidades críticas
  const pendingResps = responsabilidades.filter(r => r.estado_validacion === 'POR VALIDAR');
  for (const r of pendingResps.slice(0, 15)) {
    items.push({
      id: `responsabilidad-${r.id}`,
      entidad_tipo: 'responsabilidad',
      entidad_id: r.id,
      titulo: `Rol: ${r.rol_validado || r.rol_propuesto || 'Ejecuta'} — ${r.persona_nombre}`,
      subtitulo: r.responsabilidad_original,
      prioridad_calculada: 'P2',
      prioridad_manual: null,
      destacado_semana: false,
      prioridad_efectiva: 'P2',
      estado: 'POR VALIDAR',
      involucrados: [r.persona_nombre || ''].filter(Boolean),
      frente_nombre: r.frente_nombre,
      accion_sugerida: 'Validar asignación de responsabilidad en el frente',
      detalles: {
        id: r.id,
        persona_id: r.persona_id,
        frente_id: r.frente_id,
        rol: r.rol_validado || r.rol_propuesto
      }
    });
  }

  // 4. Alertas Estructurales críticas
  for (const a of alerts.slice(0, 8)) {
    items.push({
      id: `alerta-${a.id}`,
      entidad_tipo: 'alerta',
      entidad_id: a.id,
      titulo: a.titulo,
      subtitulo: a.mensaje,
      prioridad_calculada: a.severidad === 'alta' ? 'P1' : 'P2',
      prioridad_manual: null,
      destacado_semana: false,
      prioridad_efectiva: a.severidad === 'alta' ? 'P1' : 'P2',
      estado: a.severidad.toUpperCase(),
      involucrados: [],
      frente_nombre: a.frente_id,
      accion_sugerida: 'Atender observación estructural en la sesión',
      detalles: a
    });
  }

  return items;
}

/**
 * 1. AGENDA SEMANAL GENERAL (Comité / Dirección / Equipo)
 * Extrae prioridades de toda la organización ordenadas por P1 > P2 > P3
 */
export function getAgendaSemanal(semana?: string): {
  ciclo: string;
  items: AgendaItem[];
  stats: { p1: number; p2: number; p3: number; total: number; destacados: number };
} {
  const ciclo = semana || getCurrentSemanaCiclo();
  const rawItems = getAllRawAgendaItems();
  const prioridades = getPrioridadesAgenda(ciclo);

  const pMap = new Map<string, PrioridadAgenda>();
  for (const p of prioridades) {
    pMap.set(`${p.entidad_tipo}-${p.entidad_id}`, p);
  }

  const processed = applyPriorityOverrides(rawItems, pMap);

  // Ordenar: Primero destacados con ⭐, luego P1, luego P2, luego P3
  const sorted = processed.sort((a, b) => {
    if (a.destacado_semana && !b.destacado_semana) return -1;
    if (!a.destacado_semana && b.destacado_semana) return 1;

    const rank = { P1: 1, P2: 2, P3: 3 };
    return rank[a.prioridad_efectiva] - rank[b.prioridad_efectiva];
  });

  const stats = {
    p1: sorted.filter(i => i.prioridad_efectiva === 'P1').length,
    p2: sorted.filter(i => i.prioridad_efectiva === 'P2').length,
    p3: sorted.filter(i => i.prioridad_efectiva === 'P3').length,
    total: sorted.length,
    destacados: sorted.filter(i => i.destacado_semana).length
  };

  return { ciclo, items: sorted, stats };
}

/**
 * 2. AGENDA BILATERAL (1 a 1 entre dos personas)
 * Cruza dependencias mutuas, decisiones compartidas y responsabilidades comunes
 */
export function getAgendaBilateral(
  personaAId: string,
  personaBId: string,
  semana?: string
): {
  personaA: Persona | null;
  personaB: Persona | null;
  ciclo: string;
  items: AgendaItem[];
  stats: { p1: number; p2: number; p3: number; total: number };
} {
  const personas = getAllPersonas();
  const personaA = personas.find(p => p.id === personaAId) || null;
  const personaB = personas.find(p => p.id === personaBId) || null;

  if (!personaA || !personaB) {
    return {
      personaA,
      personaB,
      ciclo: getCurrentSemanaCiclo(),
      items: [],
      stats: { p1: 0, p2: 0, p3: 0, total: 0 }
    };
  }

  const ciclo = semana || getCurrentSemanaCiclo();
  const rawItems = getAllRawAgendaItems();
  const prioridades = getPrioridadesAgenda(ciclo);

  const pMap = new Map<string, PrioridadAgenda>();
  for (const p of prioridades) {
    pMap.set(`${p.entidad_tipo}-${p.entidad_id}`, p);
  }

  const names = [personaA.nombre.toLowerCase(), personaB.nombre.toLowerCase()];

  // Filtrar ítems que involucren a personaA y personaB
  const filtered = rawItems.filter(item => {
    // 1. Interfaces directas entre A y B (por ID o por nombre)
    if (item.entidad_tipo === 'interfaz') {
      const deId = item.detalles?.de_persona_id;
      const haciaId = item.detalles?.hacia_persona_id;
      const isDirectId =
        (deId === personaAId && haciaId === personaBId) ||
        (deId === personaBId && haciaId === personaAId);
      const isDirectName =
        item.titulo.toLowerCase().includes(names[0]) && item.titulo.toLowerCase().includes(names[1]);
      if (isDirectId || isDirectName) return true;
    }

    // 2. Decisiones donde uno decide y el otro consulta, o ambos participan
    if (item.entidad_tipo === 'decision') {
      const decisorId = item.detalles?.decisor_id;
      const consultadosStr = (item.detalles?.consultar_a || '').toLowerCase();
      const aInvolucrado = decisorId === personaAId || consultadosStr.includes(personaA.nombre.toLowerCase());
      const bInvolucrado = decisorId === personaBId || consultadosStr.includes(personaB.nombre.toLowerCase());
      if (aInvolucrado && bInvolucrado) return true;
    }

    // 3. Coincidencia por nombres en involucrados
    const hasA = item.involucrados.some(inv => inv.toLowerCase().includes(names[0]));
    const hasB = item.involucrados.some(inv => inv.toLowerCase().includes(names[1]));
    return hasA && hasB;
  });

  const processed = applyPriorityOverrides(filtered, pMap);

  const sorted = processed.sort((a, b) => {
    if (a.destacado_semana && !b.destacado_semana) return -1;
    if (!a.destacado_semana && b.destacado_semana) return 1;
    const rank = { P1: 1, P2: 2, P3: 3 };
    return rank[a.prioridad_efectiva] - rank[b.prioridad_efectiva];
  });

  const stats = {
    p1: sorted.filter(i => i.prioridad_efectiva === 'P1').length,
    p2: sorted.filter(i => i.prioridad_efectiva === 'P2').length,
    p3: sorted.filter(i => i.prioridad_efectiva === 'P3').length,
    total: sorted.length
  };

  return { personaA, personaB, ciclo, items: sorted, stats };
}

/**
 * 3. AGENDA POR PROCESO (Macroproceso específico)
 */
export function getAgendaProceso(
  frenteId: string,
  semana?: string
): {
  frente: Frente | null;
  ciclo: string;
  items: AgendaItem[];
  stats: { p1: number; p2: number; p3: number; total: number };
} {
  const frentes = getAllFrentes();
  const frente = frentes.find(f => f.id === frenteId) || null;

  if (!frente) {
    return {
      frente: null,
      ciclo: getCurrentSemanaCiclo(),
      items: [],
      stats: { p1: 0, p2: 0, p3: 0, total: 0 }
    };
  }

  const ciclo = semana || getCurrentSemanaCiclo();
  const rawItems = getAllRawAgendaItems();
  const prioridades = getPrioridadesAgenda(ciclo);

  const pMap = new Map<string, PrioridadAgenda>();
  for (const p of prioridades) {
    pMap.set(`${p.entidad_tipo}-${p.entidad_id}`, p);
  }

  const filtered = rawItems.filter(item => {
    return (
      item.frente_nombre === frente.nombre_corto ||
      item.frente_nombre === frente.id ||
      (item.detalles?.frente_id === frente.id) ||
      (item.frente_nombre && item.frente_nombre.includes(frente.id))
    );
  });

  const processed = applyPriorityOverrides(filtered, pMap);

  const sorted = processed.sort((a, b) => {
    if (a.destacado_semana && !b.destacado_semana) return -1;
    if (!a.destacado_semana && b.destacado_semana) return 1;
    const rank = { P1: 1, P2: 2, P3: 3 };
    return rank[a.prioridad_efectiva] - rank[b.prioridad_efectiva];
  });

  const stats = {
    p1: sorted.filter(i => i.prioridad_efectiva === 'P1').length,
    p2: sorted.filter(i => i.prioridad_efectiva === 'P2').length,
    p3: sorted.filter(i => i.prioridad_efectiva === 'P3').length,
    total: sorted.length
  };

  return { frente, ciclo, items: sorted, stats };
}
