const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { DatabaseSync } = require('node:sqlite');

const EXCEL_PATH = path.join(__dirname, '..', 'ENFOQUE_Airtable_7_tablas.xlsx');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'enfoque.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Remove old db if running fresh import or open existing
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new DatabaseSync(DB_PATH);

// Enable Foreign Keys & WAL
db.exec('PRAGMA foreign_keys = ON;');

console.log('Creando tablas en SQLite...');

db.exec(`
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  rol_funcional_propuesto TEXT,
  rol_funcional_validado TEXT,
  territorio_principal TEXT,
  activo INTEGER DEFAULT 1,
  nota TEXT,
  estado_validacion TEXT DEFAULT 'POR VALIDAR',
  validado_por TEXT,
  fecha_validacion TEXT,
  comentario_validacion TEXT
);

CREATE TABLE IF NOT EXISTS frentes (
  id TEXT PRIMARY KEY,
  nombre_corto TEXT NOT NULL,
  nombre_original TEXT NOT NULL,
  tipo_frente TEXT,
  owner_id_propuesto TEXT,
  owner_id_validado TEXT,
  estado_definicion TEXT DEFAULT 'Por validar',
  estado_validacion TEXT DEFAULT 'POR VALIDAR',
  validado_por TEXT,
  fecha_validacion TEXT,
  comentario_validacion TEXT,
  FOREIGN KEY (owner_id_propuesto) REFERENCES personas(id),
  FOREIGN KEY (owner_id_validado) REFERENCES personas(id)
);

CREATE TABLE IF NOT EXISTS responsabilidades (
  id TEXT PRIMARY KEY,
  frente_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  responsabilidad_original TEXT NOT NULL,
  rol_propuesto TEXT,
  rol_validado TEXT,
  estado_revision TEXT DEFAULT 'Por validar',
  estado_validacion TEXT DEFAULT 'POR VALIDAR',
  celda_origen TEXT,
  validado_por TEXT,
  fecha_validacion TEXT,
  comentario_validacion TEXT,
  FOREIGN KEY (frente_id) REFERENCES frentes(id),
  FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE TABLE IF NOT EXISTS resultados (
  id TEXT PRIMARY KEY,
  frente_id TEXT NOT NULL,
  resultado_propuesto TEXT NOT NULL,
  resultado_validado TEXT,
  owner_id_propuesto TEXT,
  owner_id_validado TEXT,
  indicador_sugerido TEXT,
  indicador_validado TEXT,
  meta TEXT,
  valor_actual TEXT,
  estado TEXT DEFAULT 'Sin información',
  estado_definicion TEXT DEFAULT 'Por validar',
  estado_validacion TEXT DEFAULT 'POR VALIDAR',
  validado_por TEXT,
  fecha_validacion TEXT,
  comentario_validacion TEXT,
  FOREIGN KEY (frente_id) REFERENCES frentes(id),
  FOREIGN KEY (owner_id_propuesto) REFERENCES personas(id),
  FOREIGN KEY (owner_id_validado) REFERENCES personas(id)
);

CREATE TABLE IF NOT EXISTS decisiones (
  id TEXT PRIMARY KEY,
  frente_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  decisor_propuesto_id TEXT,
  decisor_propuesto_nombre TEXT,
  decisor_validado_id TEXT,
  consultar_a_propuesto TEXT,
  consultar_a_validado TEXT,
  momento_trigger TEXT,
  criterio_decision TEXT,
  estado_definicion TEXT DEFAULT 'Por validar',
  estado_validacion TEXT DEFAULT 'POR VALIDAR',
  validado_por TEXT,
  fecha_validacion TEXT,
  comentario_validacion TEXT,
  FOREIGN KEY (frente_id) REFERENCES frentes(id),
  FOREIGN KEY (decisor_propuesto_id) REFERENCES personas(id),
  FOREIGN KEY (decisor_validado_id) REFERENCES personas(id)
);

CREATE TABLE IF NOT EXISTS interfaces (
  id TEXT PRIMARY KEY,
  de_persona_id TEXT,
  de_persona_nombre TEXT NOT NULL,
  hacia_persona_id TEXT,
  hacia_persona_nombre TEXT NOT NULL,
  entrega_input TEXT NOT NULL,
  devuelve_output TEXT,
  frentes_relacionados TEXT,
  frecuencia TEXT,
  condicion_activacion TEXT,
  problema_actual TEXT,
  estado TEXT DEFAULT 'Operativa',
  estado_definicion TEXT DEFAULT 'Por validar',
  estado_validacion TEXT DEFAULT 'POR VALIDAR',
  validado_por TEXT,
  fecha_validacion TEXT,
  comentario_validacion TEXT,
  FOREIGN KEY (de_persona_id) REFERENCES personas(id),
  FOREIGN KEY (hacia_persona_id) REFERENCES personas(id)
);

CREATE TABLE IF NOT EXISTS principios (
  id TEXT PRIMARY KEY,
  principio TEXT NOT NULL,
  texto_original TEXT,
  interpretacion_propuesta TEXT,
  donde_aplica TEXT,
  estado TEXT DEFAULT 'Por desarrollar'
);

CREATE TABLE IF NOT EXISTS frente_principios (
  frente_id TEXT NOT NULL,
  principio_id TEXT NOT NULL,
  aplicacion TEXT DEFAULT 'Aplica',
  PRIMARY KEY (frente_id, principio_id),
  FOREIGN KEY (frente_id) REFERENCES frentes(id),
  FOREIGN KEY (principio_id) REFERENCES principios(id)
);

CREATE TABLE IF NOT EXISTS auditoria_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT (datetime('now', 'localtime')),
  usuario TEXT NOT NULL,
  entidad_tipo TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  motivo TEXT
);
`);

console.log('Leyendo Excel:', EXCEL_PATH);
const wb = xlsx.readFile(EXCEL_PATH);

// 1. PERSONAS
const rawPersonas = xlsx.utils.sheet_to_json(wb.Sheets['Personas']);
const insertPersona = db.prepare(`
  INSERT INTO personas (id, nombre, email, rol_funcional_propuesto, territorio_principal, activo, nota, estado_validacion)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const personaNameToId = {};

for (const p of rawPersonas) {
  const id = (p['Persona_ID'] || '').trim();
  const nombre = (p['Persona'] || '').trim();
  const email = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.') + '@enfoque.io';
  const rol = (p['Rol funcional propuesto'] || '').trim();
  const territorio = (p['Territorio principal'] || '').trim();
  const activo = (p['Activo'] === 'Sí' || p['Activo'] === 'Si' || p['Activo'] === 1) ? 1 : 0;
  const nota = (p['Nota'] || '').trim();

  personaNameToId[nombre] = id;

  insertPersona.run(id, nombre, email, rol, territorio, activo, nota, 'POR VALIDAR');
}
console.log(`Personas importadas: ${rawPersonas.length}`);

// 2. FRENTES
const rawFrentes = xlsx.utils.sheet_to_json(wb.Sheets['Frentes']);
const insertFrente = db.prepare(`
  INSERT INTO frentes (id, nombre_corto, nombre_original, tipo_frente, owner_id_propuesto, estado_definicion, estado_validacion)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const f of rawFrentes) {
  const id = (f['Frente_ID'] || '').trim();
  const corto = (f['Frente corto'] || '').trim();
  const orig = (f['Nombre original'] || '').trim();
  const tipo = (f['Tipo de frente'] || '').trim();
  const ownerId = (f['Owner_ID propuesto'] || '').trim();
  const estadoDef = (f['Estado definición'] || 'Por validar').trim();

  insertFrente.run(id, corto, orig, tipo, ownerId, estadoDef, 'POR VALIDAR');
}
console.log(`Frentes importados: ${rawFrentes.length}`);

// 3. RESPONSABILIDADES
const rawResp = xlsx.utils.sheet_to_json(wb.Sheets['Responsabilidades']);
const insertResp = db.prepare(`
  INSERT INTO responsabilidades (id, frente_id, persona_id, responsabilidad_original, rol_propuesto, estado_revision, celda_origen, estado_validacion)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const r of rawResp) {
  const id = (r['Responsabilidad_ID'] || '').trim();
  const frenteId = (r['Frente_ID'] || '').trim();
  const personaId = (r['Persona_ID'] || '').trim();
  const orig = (r['Responsabilidad original'] || '').trim();
  const rol = (r['Rol ENFOQUE propuesto'] || '').trim();
  const estadoRev = (r['Estado revisión'] || 'Por validar').trim();
  const celda = (r['Celda origen'] || '').trim();

  insertResp.run(id, frenteId, personaId, orig, rol, estadoRev, celda, 'POR VALIDAR');
}
console.log(`Responsabilidades importadas: ${rawResp.length}`);

// 4. RESULTADOS
const rawResultados = xlsx.utils.sheet_to_json(wb.Sheets['Resultados']);
const insertResultado = db.prepare(`
  INSERT INTO resultados (id, frente_id, resultado_propuesto, owner_id_propuesto, indicador_sugerido, estado_definicion, estado, estado_validacion)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const res of rawResultados) {
  const id = (res['Resultado_ID'] || '').trim();
  const frenteId = (res['Frente_ID'] || '').trim();
  const propuesto = (res['Resultado esperado propuesto'] || '').trim();
  const ownerId = (res['Owner_ID propuesto'] || '').trim();
  const ind = (res['Indicador sugerido'] || '').trim();
  const estadoDef = (res['Estado definición'] || 'Por validar').trim();

  insertResultado.run(id, frenteId, propuesto, ownerId, ind, estadoDef, 'Sin información', 'POR VALIDAR');
}
console.log(`Resultados importados: ${rawResultados.length}`);

// 5. DECISIONES
const rawDecisiones = xlsx.utils.sheet_to_json(wb.Sheets['Decisiones']);
const insertDecision = db.prepare(`
  INSERT INTO decisiones (id, frente_id, decision, decisor_propuesto_id, decisor_propuesto_nombre, consultar_a_propuesto, momento_trigger, estado_definicion, estado_validacion)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const d of rawDecisiones) {
  const id = (d['Decision_ID'] || '').trim();
  const frenteId = (d['Frente_ID'] || '').trim();
  const dec = (d['Decisión'] || '').trim();
  const decisorNombre = (d['Decisor propuesto'] || '').trim();
  const decisorId = personaNameToId[decisorNombre] || null;
  const consultar = (d['Consultar a'] || '').trim();
  const trigger = (d['Momento / trigger'] || '').trim();
  const estadoDef = (d['Estado definición'] || 'Por validar').trim();

  insertDecision.run(id, frenteId, dec, decisorId, decisorNombre, consultar, trigger, estadoDef, 'POR VALIDAR');
}
console.log(`Decisiones importadas: ${rawDecisiones.length}`);

// 6. INTERFACES
const rawInterfaces = xlsx.utils.sheet_to_json(wb.Sheets['Interfaces']);
const insertInterfaz = db.prepare(`
  INSERT INTO interfaces (id, de_persona_id, de_persona_nombre, hacia_persona_id, hacia_persona_nombre, entrega_input, devuelve_output, frentes_relacionados, estado_definicion, estado, estado_validacion)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const i of rawInterfaces) {
  const id = (i['Interfaz_ID'] || '').trim();
  const deNombre = (i['De'] || '').trim();
  const haciaNombre = (i['Hacia'] || '').trim();
  const deId = personaNameToId[deNombre] || null;
  const haciaId = personaNameToId[haciaNombre] || null;
  const entrega = (i['Entrega / input'] || '').trim();
  const devuelve = (i['Devuelve / output'] || '').trim();
  const frentes = (i['Frentes relacionados'] || '').trim();
  const estadoDef = (i['Estado definición'] || 'Por validar').trim();

  insertInterfaz.run(id, deId, deNombre, haciaId, haciaNombre, entrega, devuelve, frentes, estadoDef, 'Operativa', 'POR VALIDAR');
}
console.log(`Interfaces importadas: ${rawInterfaces.length}`);

// 7. PRINCIPIOS
const rawPrincipios = xlsx.utils.sheet_to_json(wb.Sheets['Principios']);
const insertPrincipio = db.prepare(`
  INSERT INTO principios (id, principio, texto_original, interpretacion_propuesta, donde_aplica, estado)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const pr of rawPrincipios) {
  const id = (pr['Principio_ID'] || '').trim();
  const princ = (pr['Principio'] || '').trim();
  const textoOrig = (pr['Texto original'] || '').trim();
  const interp = (pr['Interpretación operativa propuesta'] || '').trim();
  const donde = (pr['Dónde aplica'] || '').trim();
  const estado = (pr['Estado'] || 'Por desarrollar').trim();

  insertPrincipio.run(id, princ, textoOrig, interp, donde, estado);
}
console.log(`Principios importados: ${rawPrincipios.length}`);

// Inicializar relación Frentes x Principios
const insertFrentePrincipio = db.prepare(`
  INSERT INTO frente_principios (frente_id, principio_id, aplicacion)
  VALUES (?, ?, ?)
`);

for (const f of rawFrentes) {
  for (const pr of rawPrincipios) {
    insertFrentePrincipio.run(f['Frente_ID'].trim(), pr['Principio_ID'].trim(), 'Aplica');
  }
}

// Registro inicial de auditoría
db.prepare(`
  INSERT INTO auditoria_log (usuario, entidad_tipo, entidad_id, campo, valor_anterior, valor_nuevo, motivo)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run('SISTEMA', 'sistema', 'INICIALIZACIÓN', 'importacion_excel', null, 'ENFOQUE_Airtable_7_tablas.xlsx', 'Carga inicial de datos desde Excel fuente');

console.log('✅ Base de datos SQLite creada exitosamente en:', DB_PATH);
db.close();
