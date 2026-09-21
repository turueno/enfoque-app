import { getDb, queryAll, queryOne } from './db';
import {
  Persona,
  Frente,
  Responsabilidad,
  Resultado,
  Decision,
  Interfaz,
  Principio,
  FrentePrincipio,
  StructuralAlert,
  AIReviewObservation,
  AuditoriaEntry
} from './types';

export function getAllPersonas(): Persona[] {
  return queryAll<Persona>('SELECT * FROM personas ORDER BY id ASC');
}

export function getPersonaById(id: string): Persona | null {
  return queryOne<Persona>('SELECT * FROM personas WHERE id = ?', id);
}

export function getAllFrentes(): (Frente & { owner_nombre: string | null; responsabilidades_count: number; decisiones_count: number; interfaces_count: number; resultado_principal: string | null; alert_count: number })[] {
  const frentes = queryAll<Frente>(`
    SELECT f.*, 
           COALESCE(p_val.nombre, p_prop.nombre) as owner_nombre
    FROM frentes f
    LEFT JOIN personas p_val ON f.owner_id_validado = p_val.id
    LEFT JOIN personas p_prop ON f.owner_id_propuesto = p_prop.id
    ORDER BY f.id ASC
  `);

  const alerts = getStructuralAlerts();

  return frentes.map(f => {
    const respCount = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM responsabilidades WHERE frente_id = ?', f.id)?.c ?? 0;
    const decCount = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM decisiones WHERE frente_id = ?', f.id)?.c ?? 0;
    const intCount = queryOne<{ c: number }>(`
      SELECT COUNT(*) as c FROM interfaces 
      WHERE frentes_relacionados LIKE '%' || ? || '%'
    `, f.id)?.c ?? 0;
    const res = queryOne<{ r?: string }>(`
      SELECT COALESCE(resultado_validado, resultado_propuesto) as r 
      FROM resultados WHERE frente_id = ? LIMIT 1
    `, f.id);

    const fAlerts = alerts.filter(a => a.frente_id === f.id);

    return {
      ...f,
      owner_nombre: f.owner_nombre ?? null,
      responsabilidades_count: respCount,
      decisiones_count: decCount,
      interfaces_count: intCount,
      resultado_principal: res?.r || null,
      alert_count: fAlerts.length
    };
  });
}

export function getFrenteById(id: string): Frente | null {
  return queryOne<Frente>(`
    SELECT f.*, 
           COALESCE(p_val.nombre, p_prop.nombre) as owner_nombre
    FROM frentes f
    LEFT JOIN personas p_val ON f.owner_id_validado = p_val.id
    LEFT JOIN personas p_prop ON f.owner_id_propuesto = p_prop.id
    WHERE f.id = ?
  `, id);
}

export function getResponsabilidadesByFrente(frenteId: string): Responsabilidad[] {
  return queryAll<Responsabilidad>(`
    SELECT r.*, p.nombre as persona_nombre, f.nombre_corto as frente_nombre
    FROM responsabilidades r
    JOIN personas p ON r.persona_id = p.id
    JOIN frentes f ON r.frente_id = f.id
    WHERE r.frente_id = ?
    ORDER BY r.id ASC
  `, frenteId);
}

export function getAllResponsabilidades(): Responsabilidad[] {
  return queryAll<Responsabilidad>(`
    SELECT r.*, p.nombre as persona_nombre, f.nombre_corto as frente_nombre
    FROM responsabilidades r
    JOIN personas p ON r.persona_id = p.id
    JOIN frentes f ON r.frente_id = f.id
    ORDER BY r.id ASC
  `);
}

export function getAllResultados(): (Resultado & { frente_nombre: string; owner_nombre: string | null })[] {
  return queryAll<Resultado & { frente_nombre: string; owner_nombre: string | null }>(`
    SELECT res.*, f.nombre_corto as frente_nombre,
           COALESCE(p_val.nombre, p_prop.nombre) as owner_nombre
    FROM resultados res
    JOIN frentes f ON res.frente_id = f.id
    LEFT JOIN personas p_val ON res.owner_id_validado = p_val.id
    LEFT JOIN personas p_prop ON res.owner_id_propuesto = p_prop.id
    ORDER BY res.id ASC
  `);
}

export function getAllDecisiones(): (Decision & { frente_nombre: string; decisor_nombre: string | null })[] {
  return queryAll<Decision & { frente_nombre: string; decisor_nombre: string | null }>(`
    SELECT d.*, f.nombre_corto as frente_nombre,
           COALESCE(p_val.nombre, p_prop.nombre, d.decisor_propuesto_nombre) as decisor_nombre
    FROM decisiones d
    JOIN frentes f ON d.frente_id = f.id
    LEFT JOIN personas p_val ON d.decisor_validado_id = p_val.id
    LEFT JOIN personas p_prop ON d.decisor_propuesto_id = p_prop.id
    ORDER BY d.id ASC
  `);
}

export function getAllInterfaces(): Interfaz[] {
  return queryAll<Interfaz>('SELECT * FROM interfaces ORDER BY id ASC');
}

export function getAllPrincipios(): Principio[] {
  return queryAll<Principio>('SELECT * FROM principios ORDER BY id ASC');
}

export function getPrincipiosByFrente(frenteId: string): (Principio & { aplicacion: string })[] {
  return queryAll<Principio & { aplicacion: string }>(`
    SELECT p.*, COALESCE(fp.aplicacion, 'Aplica') as aplicacion
    FROM principios p
    LEFT JOIN frente_principios fp ON p.id = fp.principio_id AND fp.frente_id = ?
    ORDER BY p.id ASC
  `, frenteId);
}

// -------------------------------------------------------------
// VISTA: ENFOQUE
// -------------------------------------------------------------
export function getMiEnfoque(personaId: string) {
  const persona = getPersonaById(personaId);
  if (!persona) return null;

  // Frentes donde es Owner (propuesto o validado)
  const frentesOwner = queryAll<Frente>(`
    SELECT f.* FROM frentes f
    WHERE f.owner_id_validado = ? OR (f.owner_id_validado IS NULL AND f.owner_id_propuesto = ?)
  `, personaId, personaId);

  // Frentes donde participa con responsabilidades
  const frentesParticipa = queryAll<Frente>(`
    SELECT DISTINCT f.* FROM frentes f
    JOIN responsabilidades r ON f.id = r.frente_id
    WHERE r.persona_id = ?
  `, personaId);

  // Responsabilidades: Lo que depende de mí (Owner, Decide, Ejecuta)
  const dependeDeMi = queryAll<Responsabilidad>(`
    SELECT r.*, f.nombre_corto as frente_nombre 
    FROM responsabilidades r
    JOIN frentes f ON r.frente_id = f.id
    WHERE r.persona_id = ? 
      AND (
        COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Owner%' 
        OR COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Decide%' 
        OR COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Ejecuta%'
      )
    ORDER BY r.id ASC
  `, personaId);

  // Responsabilidades: Donde contribuyo (Contribuye, Informado)
  const dondeContribuyo = queryAll<Responsabilidad>(`
    SELECT r.*, f.nombre_corto as frente_nombre 
    FROM responsabilidades r
    JOIN frentes f ON r.frente_id = f.id
    WHERE r.persona_id = ? 
      AND (
        COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Contribuye%' 
        OR COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Informado%'
      )
      AND NOT (
        COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Owner%' 
        OR COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Decide%' 
        OR COALESCE(r.rol_validado, r.rol_propuesto) LIKE '%Ejecuta%'
      )
    ORDER BY r.id ASC
  `, personaId);

  // Decisiones que le corresponden
  const decisionesPropias = queryAll<Decision>(`
    SELECT d.*, f.nombre_corto as frente_nombre
    FROM decisiones d
    JOIN frentes f ON d.frente_id = f.id
    WHERE d.decisor_validado_id = ? 
       OR (d.decisor_validado_id IS NULL AND (d.decisor_propuesto_id = ? OR d.decisor_propuesto_nombre = ?))
    ORDER BY d.id ASC
  `, personaId, personaId, persona.nombre);

  // Espero de otros: Hacia = persona
  const esperoDeOtros = queryAll<Interfaz>(`
    SELECT * FROM interfaces 
    WHERE hacia_persona_id = ? OR hacia_persona_nombre = ?
    ORDER BY id ASC
  `, personaId, persona.nombre);

  // Otros esperan de mí: De = persona
  const otrosEsperanDeMi = queryAll<Interfaz>(`
    SELECT * FROM interfaces 
    WHERE de_persona_id = ? OR de_persona_nombre = ?
    ORDER BY id ASC
  `, personaId, persona.nombre);

  return {
    persona,
    frentesOwner,
    frentesParticipa,
    dependeDeMi,
    dondeContribuyo,
    decisionesPropias,
    esperoDeOtros,
    otrosEsperanDeMi
  };
}

// -------------------------------------------------------------
// VISTA: MATRIZ MAPA ENFOQUE
// -------------------------------------------------------------
export function getMapaMatrix() {
  const frentes = getAllFrentes();
  const personas = getAllPersonas();
  const responsabilidades = getAllResponsabilidades();

  // Matriz mapa: [frenteId][personaId] -> roles y lista de responsabilidades
  const matrix: Record<string, Record<string, {
    roles: string[];
    roleCodes: ('O' | 'D' | 'E' | 'C' | 'I')[];
    isOwner: boolean;
    responsabilidades: Responsabilidad[];
  }>> = {};

  for (const f of frentes) {
    matrix[f.id] = {};
    for (const p of personas) {
      matrix[f.id][p.id] = {
        roles: [],
        roleCodes: [],
        isOwner: f.owner_id_validado === p.id || (!f.owner_id_validado && f.owner_id_propuesto === p.id),
        responsabilidades: []
      };
    }
  }

  for (const r of responsabilidades) {
    if (!matrix[r.frente_id] || !matrix[r.frente_id][r.persona_id]) continue;
    
    const cell = matrix[r.frente_id][r.persona_id];
    cell.responsabilidades.push(r);

    const activeRole = r.rol_validado || r.rol_propuesto || '';
    if (activeRole && !cell.roles.includes(activeRole)) {
      cell.roles.push(activeRole);
    }

    // Role codes
    const lower = activeRole.toLowerCase();
    if (lower.includes('owner') && !cell.roleCodes.includes('O')) cell.roleCodes.push('O');
    if (lower.includes('decide') && !cell.roleCodes.includes('D')) cell.roleCodes.push('D');
    if (lower.includes('ejecuta') && !cell.roleCodes.includes('E')) cell.roleCodes.push('E');
    if (lower.includes('contribuye') && !cell.roleCodes.includes('C')) cell.roleCodes.push('C');
    if (lower.includes('informado') && !cell.roleCodes.includes('I')) cell.roleCodes.push('I');
  }

  // Ensure owner flag reflects in codes if owner
  for (const f of frentes) {
    for (const p of personas) {
      const cell = matrix[f.id][p.id];
      if (cell.isOwner && !cell.roleCodes.includes('O')) {
        cell.roleCodes.unshift('O');
      }
    }
  }

  return {
    frentes,
    personas,
    matrix
  };
}

// -------------------------------------------------------------
// MOTOR DE ALERTAS ESTRUCTURALES (Reglas 1 a 9)
// -------------------------------------------------------------
export function getStructuralAlerts(): StructuralAlert[] {
  const alerts: StructuralAlert[] = [];

  const frentes = queryAll<Frente>('SELECT * FROM frentes');
  const decisiones = queryAll<Decision>('SELECT * FROM decisiones');
  const responsabilidades = queryAll<Responsabilidad>('SELECT * FROM responsabilidades');
  const resultados = queryAll<Resultado>('SELECT * FROM resultados');
  const interfaces = queryAll<Interfaz>('SELECT * FROM interfaces');
  const personas = queryAll<Persona>('SELECT * FROM personas WHERE activo = 1');

  // ALERTA 1: Frente sin Owner
  for (const f of frentes) {
    const hasOwner = Boolean(f.owner_id_validado || f.owner_id_propuesto);
    if (!hasOwner) {
      alerts.push({
        id: `alert-1-${f.id}`,
        tipo: 'alerta1',
        severidad: 'alta',
        titulo: `Frente sin Owner: ${f.nombre_corto}`,
        mensaje: 'Este frente no tiene un responsable único.',
        frente_id: f.id,
        entidad_tipo: 'frente',
        entidad_id: f.id
      });
    }
  }

  // ALERTA 2: Más de un Owner principal para el mismo frente
  for (const f of frentes) {
    const ownerResps = responsabilidades.filter(r => 
      r.frente_id === f.id && 
      (r.rol_validado === 'Owner' || (!r.rol_validado && r.rol_propuesto === 'Owner'))
    );
    const uniqueOwners = new Set(ownerResps.map(r => r.persona_id));
    if (uniqueOwners.size > 1) {
      alerts.push({
        id: `alert-2-${f.id}`,
        tipo: 'alerta2',
        severidad: 'alta',
        titulo: `Conflicto de Ownership: ${f.nombre_corto}`,
        mensaje: 'Hay más de un responsable final definido.',
        frente_id: f.id,
        entidad_tipo: 'frente',
        entidad_id: f.id
      });
    }
  }

  // ALERTA 3: Decisión sin decisor
  for (const d of decisiones) {
    const hasDecisor = Boolean(d.decisor_validado_id || d.decisor_propuesto_id || d.decisor_propuesto_nombre);
    if (!hasDecisor) {
      alerts.push({
        id: `alert-3-${d.id}`,
        tipo: 'alerta3',
        severidad: 'alta',
        titulo: `Decisión sin Decisor: ${d.id}`,
        mensaje: 'Esta decisión no tiene autoridad final asignada.',
        frente_id: d.frente_id,
        entidad_tipo: 'decision',
        entidad_id: d.id
      });
    }
  }

  // ALERTA 4: Más de un decisor final
  for (const d of decisiones) {
    const decisorRaw = d.decisor_propuesto_nombre || '';
    if (decisorRaw.includes(';') || decisorRaw.includes('/') || decisorRaw.toLowerCase().includes(' y ')) {
      alerts.push({
        id: `alert-4-${d.id}`,
        tipo: 'alerta4',
        severidad: 'media',
        titulo: `Autoridad ambigua en decisión: ${d.id}`,
        mensaje: 'Esta decisión tiene autoridad ambigua.',
        frente_id: d.frente_id,
        entidad_tipo: 'decision',
        entidad_id: d.id
      });
    }
  }

  // ALERTA 5: Responsabilidad sin rol
  for (const r of responsabilidades) {
    const rol = (r.rol_validado || r.rol_propuesto || '').trim();
    if (!rol || rol.toLowerCase() === 'por definir' || rol.toLowerCase() === 'sin rol') {
      alerts.push({
        id: `alert-5-${r.id}`,
        tipo: 'alerta5',
        severidad: 'media',
        titulo: `Responsabilidad sin rol: ${r.id}`,
        mensaje: 'Existe una responsabilidad cuya función no está definida.',
        frente_id: r.frente_id,
        entidad_tipo: 'responsabilidad',
        entidad_id: r.id
      });
    }
  }

  // ALERTA 6: Resultado sin Owner
  for (const res of resultados) {
    const hasOwner = Boolean(res.owner_id_validado || res.owner_id_propuesto);
    if (!hasOwner) {
      alerts.push({
        id: `alert-6-${res.id}`,
        tipo: 'alerta6',
        severidad: 'alta',
        titulo: `Resultado sin Owner: ${res.id}`,
        mensaje: 'Existe un resultado sin responsable.',
        frente_id: res.frente_id,
        entidad_tipo: 'resultado',
        entidad_id: res.id
      });
    }
  }

  // ALERTA 7: Resultado sin indicador
  for (const res of resultados) {
    const ind = (res.indicador_validado || res.indicador_sugerido || '').trim();
    if (!ind || ind.toLowerCase() === 'sin indicador') {
      alerts.push({
        id: `alert-7-${res.id}`,
        tipo: 'alerta7',
        severidad: 'media',
        titulo: `Resultado sin indicador: ${res.id}`,
        mensaje: 'Existe un resultado cuya evolución no puede observarse.',
        frente_id: res.frente_id,
        entidad_tipo: 'resultado',
        entidad_id: res.id
      });
    }
  }

  // ALERTA 8: Interfaz incompleta
  for (const i of interfaces) {
    const input = (i.entrega_input || '').trim();
    const output = (i.devuelve_output || '').trim();
    if (!input || !output) {
      alerts.push({
        id: `alert-8-${i.id}`,
        tipo: 'alerta8',
        severidad: 'baja',
        titulo: `Interfaz con flujo incompleto: ${i.id}`,
        mensaje: 'No está claro qué entrega una persona a la otra.',
        entidad_tipo: 'interfaz',
        entidad_id: i.id
      });
    }
  }

  // ALERTA 9: Participación excesiva
  for (const f of frentes) {
    const participants = new Set(
      responsabilidades.filter(r => r.frente_id === f.id).map(r => r.persona_id)
    );
    if (participants.size >= Math.max(5, personas.length - 1)) {
      alerts.push({
        id: `alert-9-${f.id}`,
        tipo: 'alerta9',
        severidad: 'info',
        titulo: `Alta densidad de participantes: ${f.nombre_corto}`,
        mensaje: 'Este proceso presenta una concentración alta de participantes. Revisar si las funciones están suficientemente diferenciadas.',
        frente_id: f.id,
        entidad_tipo: 'frente',
        entidad_id: f.id
      });
    }
  }

  return alerts;
}

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------
export function getDashboardStats() {
  const alerts = getStructuralAlerts();

  const requiereDecision = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM decisiones 
    WHERE estado_validacion IN ('POR VALIDAR', 'REQUIERE REVISIÓN')
  `)?.c ?? 0;

  const requiereCoordinacion = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM interfaces 
    WHERE estado IN ('En riesgo', 'Bloqueada', 'Por definir') 
       OR estado_validacion IN ('POR VALIDAR', 'REQUIERE REVISIÓN')
  `)?.c ?? 0;

  const pvResp = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM responsabilidades WHERE estado_validacion = 'POR VALIDAR'")?.c ?? 0;
  const pvDec = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM decisiones WHERE estado_validacion = 'POR VALIDAR'")?.c ?? 0;
  const pvRes = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM resultados WHERE estado_validacion = 'POR VALIDAR'")?.c ?? 0;
  const pvInt = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM interfaces WHERE estado_validacion = 'POR VALIDAR'")?.c ?? 0;
  const porValidarTotal = pvResp + pvDec + pvRes + pvInt;

  const sinOwnerClaro = alerts.filter(a => a.tipo === 'alerta1' || a.tipo === 'alerta2' || a.tipo === 'alerta6').length;

  const enRiesgo = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM resultados WHERE estado IN ('Atención', 'Crítico')
  `)?.c ?? 0;

  return {
    requiereDecision,
    requiereCoordinacion,
    porValidarTotal,
    sinOwnerClaro,
    enRiesgo,
    alertsTotal: alerts.length
  };
}

// -------------------------------------------------------------
// REVISOR ENFOQUE CON IA (Ambigüedades e Hipótesis)
// -------------------------------------------------------------
export function getAIReviewAnalysis(): AIReviewObservation[] {
  const observations: AIReviewObservation[] = [];

  const responsabilidades = getAllResponsabilidades();
  const frentes = getAllFrentes();
  const personas = getAllPersonas();
  const decisiones = getAllDecisiones();
  const interfaces = getAllInterfaces();
  const resultados = getAllResultados();

  // 1. Concentración operativa de una persona
  for (const p of personas) {
    const frentesCount = new Set(responsabilidades.filter(r => r.persona_id === p.id).map(r => r.frente_id)).size;
    if (frentesCount >= 6) {
      observations.push({
        id: `ai-obs-conc-${p.id}`,
        categoria: 'Sobrecarga',
        titulo: `Alta dispersión operativa de ${p.nombre}`,
        elemento_detectado: `Persona: ${p.nombre} (${p.id})`,
        motivo: `Esta persona tiene responsabilidades asignadas en ${frentesCount} de los 7 procesos organizacionales.`,
        registros_relacionados: [p.id, ...responsabilidades.filter(r => r.persona_id === p.id).slice(0, 5).map(r => r.id)],
        pregunta_sugerida: `¿Conviene revisar si existe sobrecarga operativa o si algunas de sus funciones deberían transferirse a otros integrantes del equipo?`
      });
    }
  }

  // 2. Responsabilidades redactadas como 'apoyar' sin responsable explícito
  const apoyarResps = responsabilidades.filter(r => 
    r.responsabilidad_original.toLowerCase().startsWith('apoyo') ||
    r.responsabilidad_original.toLowerCase().startsWith('apoyar')
  );
  if (apoyarResps.length > 0) {
    observations.push({
      id: 'ai-obs-apoyo',
      categoria: 'Ambigüedad',
      titulo: 'Responsabilidades redactadas como apoyo sin accountability claro',
      elemento_detectado: `${apoyarResps.length} responsabilidades con verbo "apoyar/apoyo"`,
      motivo: 'La redacción como "apoyo" diluye la responsabilidad final sobre el resultado del entregable.',
      registros_relacionados: apoyarResps.slice(0, 4).map(r => `${r.id} (${r.persona_nombre})`),
      pregunta_sugerida: '¿Quién es el responsable único por el resultado final al que estas actividades dan soporte?'
    });
  }

  // 3. Frentes sin Owner validado pero con múltiples participantes
  for (const f of frentes) {
    const count = f.responsabilidades_count;
    if (!f.owner_id_validado && count >= 5) {
      observations.push({
        id: `ai-obs-no-owner-val-${f.id}`,
        categoria: 'Autoridad',
        titulo: `Proceso "${f.nombre_corto}" sin Owner formalmente validado`,
        elemento_detectado: `Proceso: ${f.nombre_corto} (${f.id}) con ${count} responsabilidades`,
        motivo: `El proceso cuenta con ${count} responsabilidades operativas distribuidas, pero su Owner (${f.owner_nombre}) continúa en estado "Por validar".`,
        registros_relacionados: [f.id, f.owner_id_propuesto || ''],
        pregunta_sugerida: `¿Se ratifica a ${f.owner_nombre} como Owner definitivo con autoridad final para este proceso?`
      });
    }
  }

  // 4. Múltiples personas en pipeline de innovación o frentes cruzados
  const f02Resps = responsabilidades.filter(r => r.frente_id === 'F02');
  if (f02Resps.length >= 3) {
    observations.push({
      id: 'ai-obs-f02-priorizacion',
      categoria: 'Ambigüedad',
      titulo: 'Intervención múltiple en la priorización de Innovación y Go-to-Market',
      elemento_detectado: `Proceso F02 (Innovación y Go-to-Market)`,
      motivo: 'Varios miembros del equipo tienen funciones de filtrado, desarrollo y priorización sobre las mismas iniciativas.',
      registros_relacionados: ['D04', 'RES02', ...f02Resps.slice(0, 3).map(r => r.id)],
      pregunta_sugerida: '¿Quién tiene la decisión final e inapelable sobre qué iniciativas avanzan a la etapa de desarrollo y lanzamiento comercial?'
    });
  }

  // 5. Resultados con métricas sugeridas pero sin metas numéricas fijadas
  const resSinMeta = resultados.filter(r => !r.meta && r.indicador_sugerido);
  if (resSinMeta.length > 0) {
    observations.push({
      id: 'ai-obs-metas-pendientes',
      categoria: 'Métricas',
      titulo: 'Indicadores sugeridos sin metas objetivas cuantificadas',
      elemento_detectado: `${resSinMeta.length} resultados estratégicos`,
      motivo: 'Los resultados cuentan con indicadores conceptuales del registro de origen pero aún no tienen metas numéricas o rangos de tolerancia.',
      registros_relacionados: resSinMeta.map(r => r.id),
      pregunta_sugerida: '¿Cuáles son los valores meta o criterios mínimos de éxito para el trimestre actual?'
    });
  }

  // 6. Interfaces críticas sin devolución (output) definida
  const intIncompletas = interfaces.filter(i => !i.devuelve_output || i.devuelve_output.trim() === '');
  if (intIncompletas.length > 0) {
    observations.push({
      id: 'ai-obs-interfaces-incompletas',
      categoria: 'Dependencia',
      titulo: 'Dependencias con input pero sin output esperado formalizado',
      elemento_detectado: `${intIncompletas.length} interfaces de trabajo`,
      motivo: 'Se define lo que A entrega a B, pero no queda formalizado qué devuelve B a A para cerrar el ciclo operativo.',
      registros_relacionados: intIncompletas.map(i => i.id),
      pregunta_sugerida: '¿Cuál es el entregable de retorno o confirmación requerido para considerar completada la interacción?'
    });
  }

  return observations;
}

// -------------------------------------------------------------
// BÚSQUEDA GLOBAL MULTIENTIDAD
// -------------------------------------------------------------
export function searchAll(term: string) {
  if (!term || term.trim().length === 0) return { total: 0, items: [] };

  const pattern = `%${term.trim()}%`;

  const resp = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT r.id, 'Responsabilidad' as tipo, r.responsabilidad_original as titulo, 
           p.nombre || ' · ' || f.nombre_corto as subtitulo, '/frentes/' || r.frente_id as enlace
    FROM responsabilidades r
    JOIN personas p ON r.persona_id = p.id
    JOIN frentes f ON r.frente_id = f.id
    WHERE r.responsabilidad_original LIKE ? OR r.rol_propuesto LIKE ? OR r.rol_validado LIKE ?
  `, pattern, pattern, pattern);

  const personas = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT p.id, 'Persona' as tipo, p.nombre as titulo, 
           p.rol_funcional_propuesto || ' · ' || p.territorio_principal as subtitulo, '/personas/' || p.id as enlace
    FROM personas p
    WHERE p.nombre LIKE ? OR p.rol_funcional_propuesto LIKE ? OR p.territorio_principal LIKE ?
  `, pattern, pattern, pattern);

  const frentes = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT f.id, 'Proceso' as tipo, f.nombre_corto as titulo, 
           f.nombre_original as subtitulo, '/procesos/' || f.id as enlace
    FROM frentes f
    WHERE f.nombre_corto LIKE ? OR f.nombre_original LIKE ? OR f.tipo_frente LIKE ?
  `, pattern, pattern, pattern);

  const decisiones = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT d.id, 'Decisión' as tipo, d.decision as titulo, 
           'Decisor: ' || COALESCE(d.decisor_propuesto_nombre, 'Sin asignar') as subtitulo, '/decisiones' as enlace
    FROM decisiones d
    WHERE d.decision LIKE ? OR d.decisor_propuesto_nombre LIKE ? OR d.consultar_a_propuesto LIKE ?
  `, pattern, pattern, pattern);

  const resultados = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT res.id, 'Resultado' as tipo, res.resultado_propuesto as titulo, 
           'Indicador: ' || COALESCE(res.indicador_sugerido, 'N/A') as subtitulo, '/procesos/' || res.frente_id as enlace
    FROM resultados res
    WHERE res.resultado_propuesto LIKE ? OR res.indicador_sugerido LIKE ?
  `, pattern, pattern);

  const interfaces = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT i.id, 'Interfaz' as tipo, i.de_persona_nombre || ' ➔ ' || i.hacia_persona_nombre as titulo, 
           i.entrega_input as subtitulo, '/interfaces' as enlace
    FROM interfaces i
    WHERE i.entrega_input LIKE ? OR i.devuelve_output LIKE ? OR i.de_persona_nombre LIKE ? OR i.hacia_persona_nombre LIKE ?
  `, pattern, pattern, pattern, pattern);

  const principios = queryAll<{ id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }>(`
    SELECT pr.id, 'Principio' as tipo, pr.principio as titulo, 
           pr.interpretacion_propuesta as subtitulo, '/principios' as enlace
    FROM principios pr
    WHERE pr.principio LIKE ? OR pr.texto_original LIKE ? OR pr.interpretacion_propuesta LIKE ?
  `, pattern, pattern, pattern);

  const allItems = [
    ...resp,
    ...personas,
    ...frentes,
    ...decisiones,
    ...resultados,
    ...interfaces,
    ...principios
  ];

  return {
    total: allItems.length,
    items: allItems.slice(0, 50)
  };
}

// -------------------------------------------------------------
// AUDITORÍA
// -------------------------------------------------------------
export function getAuditoriaLogs(limit = 100): AuditoriaEntry[] {
  return queryAll<AuditoriaEntry>(`
    SELECT * FROM auditoria_log ORDER BY id DESC LIMIT ?
  `, limit);
}
