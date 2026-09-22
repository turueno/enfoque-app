import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = process.env.ENFOQUE_DB_PATH || path.join(DATA_DIR, 'enfoque.db');
let dbInstance: DatabaseSync | null = null;

export interface TextoSistema {
  clave: string;
  seccion: string;
  etiqueta: string;
  valor: string;
  valor_por_defecto: string;
  tipo_campo: 'text' | 'textarea' | 'markdown';
  updated_at: string | null;
  updated_by: string | null;
}

const DEFAULT_TEXTOS: Array<{
  clave: string;
  seccion: string;
  etiqueta: string;
  valor: string;
  tipo_campo: 'text' | 'textarea' | 'markdown';
}> = [
  {
    clave: 'nav.app_name',
    seccion: 'Cabecera & Marca',
    etiqueta: 'Nombre de la Aplicación',
    valor: 'ENFOQUE',
    tipo_campo: 'text'
  },
  {
    clave: 'nav.app_subtitle',
    seccion: 'Cabecera & Marca',
    etiqueta: 'Subtítulo en Barra Superior',
    valor: 'Gobernanza & Movimiento',
    tipo_campo: 'text'
  },
  {
    clave: 'home.hero.title',
    seccion: 'Portada (Inicio)',
    etiqueta: 'Título Principal del Tablero',
    valor: 'Tablero de Movimiento y Gobernanza',
    tipo_campo: 'text'
  },
  {
    clave: 'home.hero.subtitle',
    seccion: 'Portada (Inicio)',
    etiqueta: 'Subtítulo Editorial de Portada',
    valor: 'Visualización explícita de quién responde, decide, ejecuta y coordina en la organización.',
    tipo_campo: 'textarea'
  },
  {
    clave: 'home.metrics.decision_title',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Título Métrica 1 (Decisiones)',
    valor: 'Requiere decisión',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.decision_desc',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Descripción Métrica 1',
    valor: 'Decisiones sin validar',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.coord_title',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Título Métrica 2 (Coordinación)',
    valor: 'Coordinación',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.coord_desc',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Descripción Métrica 2',
    valor: 'Dependencias entre personas',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.validar_title',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Título Métrica 3 (Por Validar)',
    valor: 'Por validar',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.validar_desc',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Descripción Métrica 3',
    valor: 'Registros pendientes',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.sin_owner_title',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Título Métrica 4 (Sin Owner)',
    valor: 'Sin owner claro',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.sin_owner_desc',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Descripción Métrica 4',
    valor: 'Procesos o resultados',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.en_riesgo_title',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Título Métrica 5 (En Riesgo)',
    valor: 'En riesgo',
    tipo_campo: 'text'
  },
  {
    clave: 'home.metrics.en_riesgo_desc',
    seccion: 'Portada (Métricas)',
    etiqueta: 'Descripción Métrica 5',
    valor: 'Atención o crítico',
    tipo_campo: 'text'
  },
  {
    clave: 'home.procesos.title',
    seccion: 'Portada (Sección Procesos)',
    etiqueta: 'Título de la Sección de Procesos',
    valor: 'Los 7 Procesos de Trabajo',
    tipo_campo: 'text'
  },
  {
    clave: 'mapa.hero.title',
    seccion: 'Mapa ENFOQUE',
    etiqueta: 'Título de la Vista Mapa',
    valor: 'Mapa ENFOQUE — Matriz de Cobertura y Roles',
    tipo_campo: 'text'
  },
  {
    clave: 'mapa.hero.subtitle',
    seccion: 'Mapa ENFOQUE',
    etiqueta: 'Subtítulo del Mapa',
    valor: 'Cruce de Procesos de Negocio × Integrantes de Equipo. Haz clic en cualquier celda para inspeccionar las responsabilidades específicas.',
    tipo_campo: 'textarea'
  },
  {
    clave: 'principios.hero.title',
    seccion: 'Principios Transversales',
    etiqueta: 'Título de Principios',
    valor: 'Principios Transversales',
    tipo_campo: 'text'
  },
  {
    clave: 'principios.hero.subtitle',
    seccion: 'Principios Transversales',
    etiqueta: 'Subtítulo de Principios',
    valor: 'Los principios no son tareas; son criterios operativos rectores transversales aplicados a los procesos de negocio.',
    tipo_campo: 'textarea'
  },
  {
    clave: 'revisor.hero.title',
    seccion: 'Revisor IA',
    etiqueta: 'Título del Revisor',
    valor: 'Revisar ENFOQUE con Asistente Heurístico',
    tipo_campo: 'text'
  },
  {
    clave: 'revisor.hero.subtitle',
    seccion: 'Revisor IA',
    etiqueta: 'Subtítulo del Revisor',
    valor: 'Detección de ambigüedades estructurales, dispersión operativa y cuellos de botella formuladas estrictamente como hipótesis para revisión y preguntas guía, sin sustituir el criterio humano del equipo.',
    tipo_campo: 'markdown'
  },
  {
    clave: 'revisor.banner.title',
    seccion: 'Revisor IA',
    etiqueta: 'Título del Banner de Principio IA',
    valor: 'La IA no decide responsabilidades; señala hipótesis para revisión del equipo.',
    tipo_campo: 'text'
  },
  {
    clave: 'revisor.banner.desc',
    seccion: 'Revisor IA',
    etiqueta: 'Descripción del Banner de Principio IA',
    valor: 'Cada observación expone qué se detectó, por qué podría generar fricción o ambigüedad y qué pregunta específica debe plantearse la organización para resolverlo.',
    tipo_campo: 'textarea'
  },
  {
    clave: 'admin.tab1.name',
    seccion: 'Administrador (Pestañas)',
    etiqueta: 'Pestaña 1 (CMS / Textos)',
    valor: '1. Textos y Etiquetas (CMS)',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.tab2.name',
    seccion: 'Administrador (Pestañas)',
    etiqueta: 'Pestaña 2 (Entidades / CRUD)',
    valor: '2. Entidades Organizacionales (CRUD)',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.subtab.procesos',
    seccion: 'Administrador (Subsecciones)',
    etiqueta: 'Subsección Procesos',
    valor: 'Procesos',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.btn.nuevo_proceso',
    seccion: 'Administrador (Botones de Acción)',
    etiqueta: 'Botón Nuevo Proceso',
    valor: 'Nuevo Proceso',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.subtab.personas',
    seccion: 'Administrador (Subsecciones)',
    etiqueta: 'Subsección Personas',
    valor: 'Personas',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.btn.nueva_persona',
    seccion: 'Administrador (Botones de Acción)',
    etiqueta: 'Botón Nueva Persona',
    valor: 'Nueva Persona',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.subtab.decisiones',
    seccion: 'Administrador (Subsecciones)',
    etiqueta: 'Subsección Decisiones',
    valor: 'Decisiones',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.btn.nueva_decision',
    seccion: 'Administrador (Botones de Acción)',
    etiqueta: 'Botón Nueva Decisión',
    valor: 'Nueva Decisión',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.subtab.interfaces',
    seccion: 'Administrador (Subsecciones)',
    etiqueta: 'Subsección Interfaces',
    valor: 'Interfaces',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.btn.nueva_interfaz',
    seccion: 'Administrador (Botones de Acción)',
    etiqueta: 'Botón Nueva Interfaz',
    valor: 'Nueva Interfaz',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.subtab.responsabilidades',
    seccion: 'Administrador (Subsecciones)',
    etiqueta: 'Subsección Responsabilidades',
    valor: 'Responsabilidades',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.btn.nueva_responsabilidad',
    seccion: 'Administrador (Botones de Acción)',
    etiqueta: 'Botón Nueva Responsabilidad',
    valor: 'Nueva Responsabilidad',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.subtab.principios',
    seccion: 'Administrador (Subsecciones)',
    etiqueta: 'Subsección Principios Transversales',
    valor: 'Principios Transversales',
    tipo_campo: 'text'
  },
  {
    clave: 'admin.entidades.btn.nuevo_principio',
    seccion: 'Administrador (Botones de Acción)',
    etiqueta: 'Botón Nuevo Principio',
    valor: 'Nuevo Principio',
    tipo_campo: 'text'
  },
  {
    clave: 'footer.tagline',
    seccion: 'Pie de Página (Footer)',
    etiqueta: 'Subtítulo en Pie de Página',
    valor: '— Sistema Operativo de Gestión',
    tipo_campo: 'text'
  },
  {
    clave: 'footer.status',
    seccion: 'Pie de Página (Footer)',
    etiqueta: 'Leyenda de Estado / Conectividad',
    valor: 'Conectado a Google Workspace • 3 Capas: Original / Propuesto / Validado',
    tipo_campo: 'text'
  },
  {
    clave: 'nav.item.agenda',
    seccion: 'Navegación Principal',
    etiqueta: 'Pestaña Agenda',
    valor: 'Agenda',
    tipo_campo: 'text'
  },
  {
    clave: 'agenda.hero.title',
    seccion: 'Módulo de Agenda',
    etiqueta: 'Título Principal de Agenda',
    valor: 'Agenda Inteligente & Prioridades',
    tipo_campo: 'text'
  },
  {
    clave: 'agenda.hero.subtitle',
    seccion: 'Módulo de Agenda',
    etiqueta: 'Subtítulo de Agenda',
    valor: 'Estructuración ejecutiva de reuniones periódicas basada en bloqueos, decisiones y dependencias vivas.',
    tipo_campo: 'text'
  }
];

function initTextosSistema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS textos_sistema (
      clave TEXT PRIMARY KEY,
      seccion TEXT NOT NULL,
      etiqueta TEXT NOT NULL,
      valor TEXT NOT NULL,
      valor_por_defecto TEXT NOT NULL,
      tipo_campo TEXT DEFAULT 'text',
      updated_at TEXT,
      updated_by TEXT
    );
  `);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO textos_sistema (clave, seccion, etiqueta, valor, valor_por_defecto, tipo_campo)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of DEFAULT_TEXTOS) {
    insertStmt.run(item.clave, item.seccion, item.etiqueta, item.valor, item.valor, item.tipo_campo);
  }
}

function initSnapshotsTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_snapshots (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      usuario_id TEXT,
      titulo TEXT NOT NULL,
      notas TEXT,
      stats_json TEXT NOT NULL,
      frentes_json TEXT NOT NULL,
      alerts_count INTEGER NOT NULL,
      por_validar_total INTEGER NOT NULL,
      requiere_decision INTEGER NOT NULL,
      requiere_coordinacion INTEGER NOT NULL,
      en_riesgo INTEGER NOT NULL,
      sin_owner_claro INTEGER NOT NULL
    );
  `);
}

function initPrioridadesTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prioridades_agenda (
      id TEXT PRIMARY KEY,
      entidad_tipo TEXT NOT NULL,
      entidad_id TEXT NOT NULL,
      prioridad_manual TEXT,
      destacado_semana INTEGER DEFAULT 0,
      motivo TEXT,
      semana_ciclo TEXT NOT NULL,
      actualizado_por TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_prioridades_entidad ON prioridades_agenda (entidad_tipo, entidad_id, semana_ciclo);
  `);
}

function initReunionesTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reuniones_minutas (
      id TEXT PRIMARY KEY,
      tipo_reunion TEXT NOT NULL,
      titulo TEXT NOT NULL,
      participantes_json TEXT NOT NULL,
      frente_id TEXT,
      acuerdos_json TEXT NOT NULL,
      temas_tratados_json TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL
    );
  `);
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Si se monta un volumen nuevo en la nube y la db aún no existe allí, copiar la semilla empaquetada
    if (!fs.existsSync(DB_PATH)) {
      const candidates = [
        path.join(process.cwd(), 'seed-data', 'enfoque.db'),
        path.join(process.cwd(), 'data', 'enfoque.db'),
        '/app/seed-data/enfoque.db'
      ];
      const foundSeed = candidates.find(p => fs.existsSync(p) && p !== DB_PATH);
      if (foundSeed) {
        fs.copyFileSync(foundSeed, DB_PATH);
      } else {
        throw new Error(`Base de datos no encontrada en ${DB_PATH}. No se encontró semilla en ${candidates.join(', ')}.`);
      }
    }

    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    // Migraciones automáticas de esquema
    try {
      dbInstance.exec('ALTER TABLE frentes ADD COLUMN aporte_estrategico TEXT;');
    } catch {}
    try {
      dbInstance.exec('ALTER TABLE responsabilidades ADD COLUMN comentario_propuesta TEXT;');
    } catch {}

    // Migraciones automáticas de datos (asegura que volúmenes persistentes en Railway reciban el contenido)
    try {
      const frentesAportes: Record<string, string> = {
        'F01': 'Crear las condiciones para entender bien. Asegurar que el contacto con la realidad del target ocurra en el contexto correcto, con la calidad, muestra, logística y ejecución necesarias para que las evidencias sean confiables. Cuidar la calidad de la realidad que observamos porque una buena interpretación empieza por evidencia confiable.',
        'F02': 'Descubrir la lógica detrás de lo dicho. Ir más allá de la respuesta literal para reconstruir tensiones, contradicciones, códigos, contextos y formas de interpretar valor. Afilar las hipótesis y asegurar que el target funcione como principio de realidad para el negocio. Convertir entendimiento en ofertas de servicios relevantes.',
        'F03': 'Traducir el problema de negocio en una buena pregunta sobre personas. Evitar que la investigación responda sólo al brief explícito y ayudar a detectar cuál es el verdadero malentendido que vale la pena resolver. Escuchar al cliente antes de proponer cómo investigar para transformar una demanda comercial en una pregunta de investigación más fértil.',
        'F04': 'Convertir entendimiento en significado compartible. Dar forma, lenguaje, estructura y narrativa al expertise para revelar algo nuevo y modificar la manera de pensar del negocio. Sin depender de entregables de un proyecto puntual: catalizar capacidad de interpretación, enriquecer lo cuantitativo y agregar capas de sentido en las interacciones con clientes pertinentes.',
        'F05': 'Dimensionar el sentido. Identificar qué patrones, tensiones y diferencias realmente discriminan, cuánto pesan y en quiénes se concentran. Dar escala y precisión a lo que creemos entender. Ejecutar estudios capaces de dimensionar tensiones, discriminar targets, validar hipótesis y revelar patrones relevantes.',
        'F06': 'Hacer sostenible el entendimiento. Convertir recursos, tiempos y capacidades en decisiones que permitan investigar con profundidad sin perder viabilidad, disciplina ni foco. Asegurar que recursos, rentabilidad, carga de trabajo y prioridades permitan sostener la profundidad y calidad del entendimiento.',
        'F07': 'Integrar las miradas en una interpretación propia. Elevar las contribuciones de todas las áreas a una perspectiva coherente para la agencia. Conectar las piezas para construir una inteligencia común integrando personas, procesos, información y tecnología para que el conocimiento no quede fragmentado y aumente la capacidad colectiva de entender.'
      };
      const updateFrente = dbInstance.prepare('UPDATE frentes SET aporte_estrategico = ? WHERE id = ? AND (aporte_estrategico IS NULL OR aporte_estrategico = \'\')');
      for (const [fid, ap] of Object.entries(frentesAportes)) {
        updateFrente.run(ap, fid);
      }

      // Nuevas responsabilidades de calibración MFM
      const insertResp = dbInstance.prepare(`
        INSERT OR IGNORE INTO responsabilidades (id, frente_id, persona_id, responsabilidad_original, rol_propuesto, estado_revision, celda_origen, estado_validacion, comentario_propuesta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertResp.run('R119', 'F01', 'P01', 'Desarrollo y perfeccionamiento de profiling', 'Owner / Ejecuta', 'Propuesto por Owner', 'Enfoque MFM.docx', 'POR VALIDAR', 'Propuesto directamente por Mónica Freyre en documento de calibración');
      insertResp.run('R120', 'F01', 'P01', 'Desarrollar el drive de herramientas para tener un catálogo vivo de la operación', 'Owner / Ejecuta', 'Propuesto por Owner', 'Enfoque MFM.docx', 'POR VALIDAR', 'Propuesto directamente por Mónica Freyre en documento de calibración');
      insertResp.run('R121', 'F01', 'P01', 'Probar diferentes alternativas para el uso de BDD interna', 'Owner / Ejecuta', 'Propuesto por Owner', 'Enfoque MFM.docx', 'POR VALIDAR', 'Propuesto directamente por Mónica Freyre en documento de calibración');
    } catch {}

    initTextosSistema(dbInstance);
    initSnapshotsTable(dbInstance);
    initPrioridadesTable(dbInstance);
    initReunionesTable(dbInstance);
  }
  return dbInstance;
}

/**
 * Executes a query and returns plain objects with standard Object.prototype,
 * ensuring complete compatibility with React Server Components serialization.
 */
export function queryAll<T>(sql: string, ...params: (string | number | null | undefined)[]): T[] {
  const db = getDb();
  const validParams = params.map(p => p === undefined ? null : p);
  const rows = validParams.length > 0 
    ? db.prepare(sql).all(...(validParams as any[]))
    : db.prepare(sql).all();
  return JSON.parse(JSON.stringify(rows)) as T[];
}

export function queryOne<T>(sql: string, ...params: (string | number | null | undefined)[]): T | null {
  const db = getDb();
  const validParams = params.map(p => p === undefined ? null : p);
  const row = validParams.length > 0 
    ? db.prepare(sql).get(...(validParams as any[]))
    : db.prepare(sql).get();
  if (!row) return null;
  return JSON.parse(JSON.stringify(row)) as T;
}

export function logAudit(
  usuario: string,
  entidadTipo: string,
  entidadId: string,
  campo: string,
  valorAnterior: string | null,
  valorNuevo: string | null,
  motivo?: string
) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO auditoria_log (usuario, entidad_tipo, entidad_id, campo, valor_anterior, valor_nuevo, motivo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(usuario, entidadTipo, entidadId, campo, valorAnterior, valorNuevo, motivo || null);
}

/**
 * Returns a dictionary mapping each text key to its current active value.
 */
export function getTextosSistemaMap(): Record<string, string> {
  const list = queryAll<TextoSistema>('SELECT clave, valor FROM textos_sistema');
  const map: Record<string, string> = {};
  for (const def of DEFAULT_TEXTOS) {
    map[def.clave] = def.valor;
  }
  for (const item of list) {
    map[item.clave] = item.valor;
  }
  return map;
}

/**
 * Returns all configured system texts with metadata for the admin panel.
 */
export function getAllTextosSistema(): TextoSistema[] {
  return queryAll<TextoSistema>('SELECT * FROM textos_sistema ORDER BY seccion, clave');
}

/**
 * Updates a system text and logs the change to audit log.
 */
export function updateTextoSistema(clave: string, valor: string, usuario: string): boolean {
  const db = getDb();
  const current = queryOne<TextoSistema>('SELECT * FROM textos_sistema WHERE clave = ?', clave);
  if (!current) return false;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE textos_sistema 
    SET valor = ?, updated_at = ?, updated_by = ? 
    WHERE clave = ?
  `).run(valor, now, usuario, clave);

  logAudit(usuario, 'texto_sistema', clave, 'valor', current.valor, valor, 'Modificación desde panel CMS');
  return true;
}

/**
 * Resets a system text to its factory default value.
 */
export function resetTextoSistema(clave: string, usuario: string): boolean {
  const db = getDb();
  const current = queryOne<TextoSistema>('SELECT * FROM textos_sistema WHERE clave = ?', clave);
  if (!current) return false;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE textos_sistema 
    SET valor = valor_por_defecto, updated_at = ?, updated_by = ? 
    WHERE clave = ?
  `).run(now, usuario, clave);

  logAudit(usuario, 'texto_sistema', clave, 'valor', current.valor, current.valor_por_defecto, 'Restablecimiento a valor original');
  return true;
}
