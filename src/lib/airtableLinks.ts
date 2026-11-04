/**
 * Mapeo de Decisiones de ENFOQUE (D01-D15) hacia las herramientas
 * operativas y paneles de Airtable Interface correspondientes.
 */
export interface DecisionAirtableMapping {
  panelId: string;
  panelTitle: string;
  url: string;
  accionTexto: string;
}

export const DECISION_AIRTABLE_MAP: Record<string, DecisionAirtableMapping> = {
  // D01: Aceptar/modificar factibilidad de campo -> Panel de Control de Costos y Factibilidad
  D01: {
    panelId: "control-costos",
    panelTitle: "Control de Costos y Factibilidad",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagAWWhFmkAV8hOoi",
    accionTexto: "Abrir Control de Costos (Airtable)",
  },
  // D02: Acción ante desviaciones de campo frente a lo acordado con cliente
  D02: {
    panelId: "control-costos",
    panelTitle: "Control de Costos y Desviaciones",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagAWWhFmkAV8hOoi",
    accionTexto: "Revisar Desviaciones en Airtable",
  },
  // D03: Desarrollo/selección de proveedores de campo
  D03: {
    panelId: "asignaciones",
    panelTitle: "Asignaciones y Staffing",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagw74XZvXeWuEcry",
    accionTexto: "Ver Asignaciones (Airtable)",
  },
  // D06: Validar viabilidad financiera de iniciativas con inversión
  D06: {
    panelId: "control-costos",
    panelTitle: "Control Presupuestal",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagAWWhFmkAV8hOoi",
    accionTexto: "Auditar Presupuesto (Airtable)",
  },
  // D07: Priorizar acciones de generación de demanda y cartera
  D07: {
    panelId: "proyectos-activos",
    panelTitle: "Pipeline de Proyectos",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagOftjkxNClzBLrd",
    accionTexto: "Ver Proyectos Activos (Airtable)",
  },
  // D08: Definir enfoque metodológico de propuestas cuantitativas
  D08: {
    panelId: "aprobaciones",
    panelTitle: "Mesa de Aprobaciones",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagra3Z3jhPV95Wef",
    accionTexto: "Abrir Aprobaciones (Airtable)",
  },
  // D11: Definir precio de venta de propuestas cuantitativas
  D11: {
    panelId: "aprobaciones",
    panelTitle: "Dictamen de Propuestas",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagra3Z3jhPV95Wef",
    accionTexto: "Dictaminar Propuesta en Airtable",
  },
  // D12: Definir precios de venta generales y de nuevas iniciativas
  D12: {
    panelId: "aprobaciones",
    panelTitle: "Revisión de Precios y Márgenes",
    url: "https://airtable.com/app5tT9rQUchmnnDU/pagra3Z3jhPV95Wef",
    accionTexto: "Revisar Propuesta en Airtable",
  },
};
