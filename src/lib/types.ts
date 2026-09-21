export type ValidationStatus = 'DEFINIDO' | 'POR VALIDAR' | 'APROBADO' | 'REQUIERE REVISIÓN';

export type RoleTaxonomy = 'Owner' | 'Decide' | 'Ejecuta' | 'Contribuye' | 'Informado';

export interface Persona {
  id: string;
  nombre: string;
  email: string | null;
  rol_funcional_propuesto: string | null;
  rol_funcional_validado: string | null;
  territorio_principal: string | null;
  activo: number;
  nota: string | null;
  estado_validacion: ValidationStatus;
  validado_por: string | null;
  fecha_validacion: string | null;
  comentario_validacion: string | null;
}

export interface Frente {
  id: string;
  nombre_corto: string;
  nombre_original: string;
  tipo_frente: string | null;
  owner_id_propuesto: string | null;
  owner_id_validado: string | null;
  estado_definicion: string;
  estado_validacion: ValidationStatus;
  validado_por: string | null;
  fecha_validacion: string | null;
  comentario_validacion: string | null;
  owner_nombre?: string | null;
}

export interface Responsabilidad {
  id: string;
  frente_id: string;
  persona_id: string;
  responsabilidad_original: string;
  rol_propuesto: string | null;
  rol_validado: string | null;
  estado_revision: string;
  estado_validacion: ValidationStatus;
  celda_origen: string | null;
  validado_por: string | null;
  fecha_validacion: string | null;
  comentario_validacion: string | null;
  persona_nombre?: string;
  frente_nombre?: string;
}

export interface Resultado {
  id: string;
  frente_id: string;
  resultado_propuesto: string;
  resultado_validado: string | null;
  owner_id_propuesto: string | null;
  owner_id_validado: string | null;
  indicador_sugerido: string | null;
  indicador_validado: string | null;
  meta: string | null;
  valor_actual: string | null;
  estado: 'Bien' | 'Atención' | 'Crítico' | 'Sin información';
  estado_definicion: string;
  estado_validacion: ValidationStatus;
  validado_por: string | null;
  fecha_validacion: string | null;
  comentario_validacion: string | null;
  frente_nombre?: string;
  owner_nombre?: string | null;
}

export interface Decision {
  id: string;
  frente_id: string;
  decision: string;
  decisor_propuesto_id: string | null;
  decisor_propuesto_nombre: string | null;
  decisor_validado_id: string | null;
  consultar_a_propuesto: string | null;
  consultar_a_validado: string | null;
  momento_trigger: string | null;
  criterio_decision: string | null;
  estado_definicion: string;
  estado_validacion: ValidationStatus;
  validado_por: string | null;
  fecha_validacion: string | null;
  comentario_validacion: string | null;
  frente_nombre?: string;
  decisor_nombre?: string | null;
}

export interface Interfaz {
  id: string;
  de_persona_id: string | null;
  de_persona_nombre: string;
  hacia_persona_id: string | null;
  hacia_persona_nombre: string;
  entrega_input: string;
  devuelve_output: string | null;
  frentes_relacionados: string | null;
  frecuencia: string | null;
  condicion_activacion: string | null;
  problema_actual: string | null;
  estado: 'Operativa' | 'En riesgo' | 'Bloqueada' | 'Por definir';
  estado_definicion: string;
  estado_validacion: ValidationStatus;
  validado_por: string | null;
  fecha_validacion: string | null;
  comentario_validacion: string | null;
}

export interface Principio {
  id: string;
  principio: string;
  texto_original: string | null;
  interpretacion_propuesta: string | null;
  donde_aplica: string | null;
  estado: string;
}

export interface FrentePrincipio {
  frente_id: string;
  principio_id: string;
  aplicacion: 'No aplica' | 'Aplica' | 'Tiene oportunidad' | 'Está integrado';
  principio_nombre?: string;
}

export interface StructuralAlert {
  id: string;
  tipo: 'alerta1' | 'alerta2' | 'alerta3' | 'alerta4' | 'alerta5' | 'alerta6' | 'alerta7' | 'alerta8' | 'alerta9';
  severidad: 'alta' | 'media' | 'baja' | 'info';
  titulo: string;
  mensaje: string;
  frente_id?: string;
  entidad_tipo: string;
  entidad_id: string;
}

export interface AIReviewObservation {
  id: string;
  titulo: string;
  elemento_detectado: string;
  motivo: string;
  registros_relacionados: string[];
  pregunta_sugerida: string;
  categoria: 'Ambigüedad' | 'Autoridad' | 'Dependencia' | 'Sobrecarga' | 'Métricas';
}

export interface AuditoriaEntry {
  id: number;
  timestamp: string;
  usuario: string;
  entidad_tipo: string;
  entidad_id: string;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  motivo: string | null;
}

export type PriorityLevel = 'P1' | 'P2' | 'P3';

export interface PrioridadAgenda {
  id: string;
  entidad_tipo: 'interfaz' | 'decision' | 'responsabilidad' | 'alerta' | 'principio' | 'frente';
  entidad_id: string;
  prioridad_manual: PriorityLevel | null;
  destacado_semana: number; // 0 or 1
  motivo: string | null;
  semana_ciclo: string;
  actualizado_por: string | null;
  updated_at: string;
}

export interface ReunionMinuta {
  id: string;
  tipo_reunion: 'semanal_general' | 'bilateral' | 'proceso';
  titulo: string;
  participantes_json: string;
  frente_id: string | null;
  acuerdos_json: string;
  temas_tratados_json: string | null;
  created_at: string;
  created_by: string;
}

export interface AgendaItem {
  id: string;
  entidad_tipo: 'interfaz' | 'decision' | 'responsabilidad' | 'alerta' | 'principio' | 'owner';
  entidad_id: string;
  titulo: string;
  subtitulo: string;
  prioridad_calculada: PriorityLevel;
  prioridad_manual: PriorityLevel | null;
  destacado_semana: boolean;
  prioridad_efectiva: PriorityLevel;
  estado: string;
  involucrados: string[];
  frente_nombre?: string;
  accion_sugerida: string;
  acuerdo_registrado?: string;
  detalles?: Record<string, any>;
}
