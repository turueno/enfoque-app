const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'enfoque.db');
const db = new DatabaseSync(dbPath);

console.log('--- Applying MFM Updates ---');

// 1. Update R002 (Rebotar propuestas)
db.prepare('UPDATE responsabilidades SET responsabilidad_original = ?, comentario_propuesta = ? WHERE id = ?')
  .run(
    'Rebotar las propuestas con S, Clientes para rebotar la viabilidad, opciones de reclutamiento, costos y logísticas operativas',
    'Alineado con documento de calibración Enfoque MFM',
    'R002'
  );

// 2. Update R003 (Proveedores cualitativos)
db.prepare('UPDATE responsabilidades SET responsabilidad_original = ?, comentario_propuesta = ? WHERE id = ?')
  .run(
    'Desarrollo de proveedores de campo cualitativos, diferentes y nuevas vías de reclutamiento eficientes y rentables',
    'Alineado con Enfoque MFM. Pendiente revisar frontera con proveedores cuantitativos (Karen / F05)',
    'R003'
  );

// 3. Update R004 (Small data y profiling - split)
db.prepare('UPDATE responsabilidades SET responsabilidad_original = ?, comentario_propuesta = ? WHERE id = ?')
  .run(
    'Apoyo y desarrollo a proyectos de small data',
    'Alineado con Enfoque MFM (separado de profiling)',
    'R004'
  );

// 4. Update R006 (Horizonte 2 semanas a 90 días)
db.prepare('UPDATE responsabilidades SET responsabilidad_original = ?, comentario_propuesta = ? WHERE id = ?')
  .run(
    'Trabajar en conjunto con Finanzas para registro y planeación de pagos en horizontes de 2 semanas a 90 días',
    'Alineado con Enfoque MFM (ampliado a 90 días / 1 trimestre)',
    'R006'
  );

// 5. Update R040 (Presencia obligatoria en 100% de KOs)
db.prepare('UPDATE responsabilidades SET responsabilidad_original = ?, comentario_propuesta = ? WHERE id = ?')
  .run(
    'Participar en los KO en todos los proyectos, siempre tiene que haber alguien del área de operaciones',
    'Alineado con Enfoque MFM (regla no negociable de presencia en kickoffs)',
    'R040'
  );

// 6. Check existing R119, R120, R121
const insertSql = `
  INSERT INTO responsabilidades (id, frente_id, persona_id, responsabilidad_original, rol_propuesto, estado_revision, celda_origen, estado_validacion, comentario_propuesta)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
const insertStmt = db.prepare(insertSql);

const r119 = db.prepare('SELECT id FROM responsabilidades WHERE id = ?').get('R119');
if (!r119) {
  insertStmt.run('R119', 'F01', 'P01', 'Desarrollo y perfeccionamiento de profiling', 'Owner / Ejecuta', 'Propuesto por Owner', 'Enfoque MFM.docx', 'POR VALIDAR', 'Propuesto directamente por Mónica Freyre en documento de calibración');
  console.log('Inserted R119');
}

const r120 = db.prepare('SELECT id FROM responsabilidades WHERE id = ?').get('R120');
if (!r120) {
  insertStmt.run('R120', 'F01', 'P01', 'Desarrollar el drive de herramientas para tener un catálogo vivo de la operación', 'Owner / Ejecuta', 'Propuesto por Owner', 'Enfoque MFM.docx', 'POR VALIDAR', 'Propuesto directamente por Mónica Freyre en documento de calibración');
  console.log('Inserted R120');
}

const r121 = db.prepare('SELECT id FROM responsabilidades WHERE id = ?').get('R121');
if (!r121) {
  insertStmt.run('R121', 'F01', 'P01', 'Probar diferentes alternativas para el uso de BDD interna', 'Owner / Ejecuta', 'Propuesto por Owner', 'Enfoque MFM.docx', 'POR VALIDAR', 'Propuesto directamente por Mónica Freyre en documento de calibración');
  console.log('Inserted R121');
}

console.log('✅ Responsabilidades actualizadas y creadas con éxito.');
