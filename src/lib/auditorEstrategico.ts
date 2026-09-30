import { GoogleGenAI } from '@google/genai';
import { getGeminiClient } from './gemini';
import {
  AuditoriaEstrategicaItem,
  AuditoriaEstrategicaReport,
  AssistantChatMessage,
  HipotesisSolucion
} from './types';
import { getAgendaSemanal } from './agenda';
import {
  getAllFrentes,
  getAllPrincipios,
  getAllInterfaces,
  getAllDecisiones,
  getStructuralAlerts,
  getAllPersonas
} from './queries';

// Marco Estratégico PHPVKS 3.0 para grounding
export const CONTEXTO_ESTRATEGIA_PHPVKS = `
# ESTRATEGIA PHPVKS 3.0: ENTENDER EL TARGET MEJOR QUE NADIE

Perspectiva autoral en 3 premisas transversales:

1. A QUIÉN ENTENDEMOS:
- No existe un consumidor plano ni reducible a NSE, edad o hábitos genéricos.
- Cada target es un sistema de interpretación en sí mismo (su propio sentido común).
- Entenderlo es saber para quién tiene sentido una oferta, cómo lee el valor, el riesgo, el deseo y la pertenencia, y bajo qué tensiones se vuelve significativo.

2. CÓMO LO ENTENDEMOS:
- El oficio es más humano que técnico: práctica interpretativa, artesanal, que escucha lo que el dato no dice subordinándolo al contexto.
- Comienza donde termina la obviedad: investigar es desobedecer el supuesto y ejercer una mirada crítica guiada por hipótesis afiladas para revelar malentendidos entre el negocio y las personas.

3. DESDE DÓNDE ENTENDEMOS:
- Menos consumidor y más circunstancia: comprender el conflicto, fricción, necesidad, cultura o práctica condicionante.
- El target funciona como un principio de realidad que confronta las aspiraciones del negocio con los códigos de sentido de la gente.

# APORTES CLAVE POR PROCESO (LOS 7 PROCESOS):
1. Funnel de ventas y atención a clientes: Traducir el problema de negocio en una buena pregunta sobre personas. Escuchar antes de proponer metodología; evitar briefs literales.
2. Operación de campo y costos de proyectos: Crear las condiciones para entender bien. Cuidar la calidad de la realidad observada, contexto correcto y disciplina de recursos.
3. Operación de proyectos cuantitativos: Dimensionar el sentido. Identificar qué patrones y tensiones discriminan, cuánto pesan y en quiénes se concentran. No solo correr datos.
4. Pipeline de Innovación y Go To Market: Descubrir la lógica detrás de lo dicho. Reconstruir tensiones para afilar hipótesis y asegurar que el target funcione como principio de realidad.
5. Evergreen de conocimiento y contenidos: Convertir entendimiento en significado compartible. Dar forma, narrativa y catalizar la capacidad colectiva de interpretación.
6. Operación financiera y situación del negocio: Hacer sostenible el entendimiento. Asegurar que recursos y rentabilidad permitan investigar con profundidad sin perder viabilidad.
7. Integración general y digital: Integrar las miradas en una interpretación propia. Conectar personas, datos y tecnología para evitar conocimiento fragmentado.
`;

/**
 * Motor heurístico determinista de auditoría estratégica:
 * Evalúa hechos verificados de la Agenda Semanal, Frentes, Interfaces y Principios
 * contra los principios transversales y procesos clave.
 */
export function generarAuditoriaEstrategicaHeuristica(): AuditoriaEstrategicaReport {
  const agenda = getAgendaSemanal();
  const frentes = getAllFrentes();
  const interfaces = getAllInterfaces();
  const decisiones = getAllDecisiones();
  const alertas = getStructuralAlerts();
  const principios = getAllPrincipios();
  const personas = getAllPersonas();

  const items: AuditoriaEstrategicaItem[] = [];

  // 1. Auditoría sobre Frentes y Roles: ¿Hay frentes estratégicos sin Owner formal que proteja el principio?
  for (const f of frentes) {
    if (!f.owner_id_validado) {
      const procesoMatch = f.nombre_corto;
      const fResps = f.responsabilidades_count || 0;
      items.push({
        id: `aud-frente-${f.id}`,
        origen_tipo: 'frente',
        origen_id: f.id,
        titulo: `Frente "${f.nombre_corto}" carece de Owner validado con autoridad sobre el estándar`,
        principio_transversal: 'Hacer sostenible el entendimiento / Autonomía con alineación',
        proceso_afectado: f.nombre_corto,
        severidad: fResps >= 4 ? 'alta' : 'media',
        diagnostico_alineacion: `El proceso "${f.nombre_corto}" tiene ${fResps} responsabilidades asignadas, pero su Owner no ha sido formalizado. Esto debilita la custodia de la calidad metodológica y el rigor interpretativo frente a la urgencia operativa diaria.`,
        implicaciones_operativas: `Riesgo de dilución de criterio: las decisiones de campo, ventas o análisis quedan a criterio individual de cada consultor o analista, perdiendo la perspectiva autoral y consistencia frente al cliente.`,
        pregunta_directiva: `¿Quién asumirá formalmente el rol de Owner definitivo para velar por la entrega de valor en ${f.nombre_corto}?`,
        involucrados: [f.owner_nombre || 'Sin asignar'],
        hipotesis_soluciones: [
          {
            id: `sol-${f.id}-1`,
            titulo: `Ratificar al Owner propuesto (${f.owner_nombre || 'Líder sugerido'})`,
            explicacion: 'Formalizar de inmediato en el comité directivo la autoridad para fijar estándares y criterios de aceptación.',
            accion_sugerida: 'Validar Owner formalmente en la plataforma',
            tipo_accion: 'validar_owner'
          },
          {
            id: `sol-${f.id}-2`,
            titulo: 'Asignar co-responsabilidad transitoria de transición',
            explicacion: 'Si el perfil requiere madurar, definir un mentor directivo temporal para el proceso durante el ciclo.',
            accion_sugerida: 'Registrar acuerdo de acompañamiento en Minuta de Agenda',
            tipo_accion: 'acuerdo_minuta'
          }
        ]
      });
    }
  }

  // 2. Auditoría sobre la Agenda Semanal P1: Cuellos de botella que rompen la promesa de valor
  const agendaP1 = agenda.items.filter(i => i.prioridad_efectiva === 'P1');
  for (const item of agendaP1.slice(0, 6)) {
    if (item.entidad_tipo === 'interfaz') {
      const interf = interfaces.find(i => i.id === item.entidad_id);
      items.push({
        id: `aud-agenda-int-${item.id}`,
        origen_tipo: 'agenda',
        origen_id: item.entidad_id,
        titulo: `Fricción prioritaria en Agenda Semanal: ${item.titulo}`,
        principio_transversal: 'Cómo lo entendemos (Oficio artesanal e interfaces nítidas)',
        proceso_afectado: interf?.frentes_relacionados || 'Operación cruzada',
        severidad: 'alta',
        diagnostico_alineacion: `La interfaz entre ${item.involucrados.join(' y ')} se encuentra en tensión crítica (${item.estado}). Falta claridad en el entregable de retorno o retroalimentación requerida para mantener la calidad.`,
        implicaciones_operativas: `El equipo consume tiempo en reuniones de fricción o retrabajo en vez de dedicar horas a la profundidad analítica del consumidor. Se corre el riesgo de entregar reportes transaccionales apresurados.`,
        pregunta_directiva: `¿Cuál es el entregable de salida exacto y el tiempo de respuesta pactado entre ambas partes?`,
        involucrados: item.involucrados,
        hipotesis_soluciones: [
          {
            id: `sol-int-${item.id}-1`,
            titulo: 'Pactar contrato de interfaz de entrada/salida (SLA de calidad)',
            explicacion: 'Redactar en la minuta los insumos mínimos antes de iniciar y el formato de devolución esperado.',
            accion_sugerida: 'Redactar acuerdo específico en la minuta de esta reunión',
            tipo_accion: 'acuerdo_minuta',
            acuerdo_propuesto: `Acuerdo entre ${item.involucrados.join(' y ')}: Definir entrega con criterios de validación claros y respuesta en menos de 48h hábiles.`
          },
          {
            id: `sol-int-${item.id}-2`,
            titulo: 'Reasignar la carga de entrega o canal de comunicación',
            explicacion: 'Si una de las partes está sobrecargada, canalizar el input mediante una plantilla estandarizada.',
            accion_sugerida: 'Ajustar la definición de la interfaz en el catálogo',
            tipo_accion: 'aclarar_interfaz'
          }
        ]
      });
    } else if (item.entidad_tipo === 'decision') {
      const dec = decisiones.find(d => d.id === item.entidad_id);
      items.push({
        id: `aud-agenda-dec-${item.id}`,
        origen_tipo: 'agenda',
        origen_id: item.entidad_id,
        titulo: `Decisión sin criterio de corte definido: ${item.titulo}`,
        principio_transversal: 'Desde dónde entendemos (Target como principio de realidad)',
        proceso_afectado: item.frente_nombre || 'Decisiones estratégicas',
        severidad: 'alta',
        diagnostico_alineacion: `La decisión "${item.titulo}" sigue abierta sin un decisor validado o sin un criterio de corte explícito ("${dec?.criterio_decision || 'Sin criterio'}"). Esto diluye la agilidad para responder al mercado.`,
        implicaciones_operativas: `Parálisis de análisis: los proyectos avanzan con supuestos no confirmados, arriesgando la rentabilidad y la coherencia del entregable con el cliente.`,
        pregunta_directiva: `¿Bajo qué criterio inapelable se tomará esta decisión y quién asume la responsabilidad final?`,
        involucrados: item.involucrados,
        hipotesis_soluciones: [
          {
            id: `sol-dec-${item.id}-1`,
            titulo: 'Establecer criterio de desempate basado en el Target',
            explicacion: 'Si hay posturas encontradas entre áreas, la decisión se define por la opción que aporte mayor certidumbre de sentido para el target.',
            accion_sugerida: 'Fijar acuerdo en la reunión semanal y ratificar al Decisor',
            tipo_accion: 'acuerdo_minuta',
            acuerdo_propuesto: `Criterio de decisión validado: Se prioriza la alternativa que responda con evidencia de campo a la tensión real del consumidor.`
          }
        ]
      });
    }
  }

  // 3. Auditoría del Principio Cuantitativo vs Operaciones (MFM vs Karen / Proveedores Cuantitativos)
  const fronteraProveedores = alertas.find(a => a.id.includes('proveedores-cuanti') || a.titulo.includes('proveedores'));
  items.push({
    id: 'aud-frontera-cuanti-campo',
    origen_tipo: 'responsabilidad',
    origen_id: 'R003',
    titulo: 'Frontera ambigua en adquisición y supervisión de proveedores cuantitativos',
    principio_transversal: 'Operación cuantitativa: Dimensionar el sentido con rigor de campo',
    proceso_afectado: 'Operación cuantitativa & Operación de campo',
    severidad: 'alta',
    diagnostico_alineacion: 'Mónica Freyre (P01) acotó su rol a cualitativo, dejando sin dueño formal la prospección, negociación y calidad de paneles y reclutamiento cuantitativo. Si el frente cuantitativo no controla la calidad del campo, no puede garantizar que los datos dimensionen adecuadamente las tensiones.',
    implicaciones_operativas: 'Riesgo de baja confiabilidad en muestras o costos inflados en paneles cuantitativos, impactando la rentabilidad y el valor interpretativo de los estudios.',
    pregunta_directiva: '¿La selección y negociación de paneles cuantitativos pertenece a la Dirección de Operaciones o a la Dirección Cuantitativa?',
    involucrados: ['Mónica Freyre', 'Karen Heitler'],
    hipotesis_soluciones: [
      {
        id: 'sol-cuanti-1',
        titulo: 'Modelo Especializado: Cuantitativo homologa proveedores técnicos; Operaciones gestiona contratos',
        explicacion: 'Karen evalúa la viabilidad técnica y rigor muestral del proveedor cuantitativo; Mónica gestiona la administración comercial y términos.',
        accion_sugerida: 'Crear interfaz formal Cuantitativo ➔ Operaciones de campo con este alcance',
        tipo_accion: 'acuerdo_minuta',
        acuerdo_propuesto: 'Karen Heitler aprueba especificación técnica de paneles; Operaciones formaliza contratación y seguimiento presupuestal.'
      },
      {
        id: 'sol-cuanti-2',
        titulo: 'Autonomía Total de la Unidad Cuantitativa',
        explicacion: 'Asignar a Karen Heitler el ciclo completo de proveedores cuantitativos para acelerar cotizaciones y respuesta al cliente.',
        accion_sugerida: 'Validar R003 en Mónica y crear responsabilidad explícita en Karen',
        tipo_accion: 'validar_owner'
      }
    ]
  });

  // 4. Auditoría sobre el Pipeline de Innovación y Go To Market
  items.push({
    id: 'aud-innovacion-gtm',
    origen_tipo: 'frente',
    origen_id: 'F02',
    titulo: 'Multiplicidad de voces en el filtro de innovación sin corte claro',
    principio_transversal: 'Pipeline de Innovación: Descubrir la lógica detrás de lo dicho',
    proceso_afectado: 'Innovación y Go To Market',
    severidad: 'media',
    diagnostico_alineacion: 'Existen múltiples participantes en el frente F02 sin una definición unívoca de quién autoriza la salida al mercado de nuevas metodologías. Innovar exige afilar hipótesis, no solo sumar opiniones.',
    implicaciones_operativas: 'Iniciativas de innovación que se estancan en revisión o que salen al mercado sin el empaque comercial necesario para resolver las tensiones del cliente.',
    pregunta_directiva: '¿Cuál es el gatekeeping oficial para dar luz verde a una nueva oferta metodológica de Provokers?',
    involucrados: ['Equipo de Innovación', 'Comité Directivo'],
    hipotesis_soluciones: [
      {
        id: 'sol-inno-1',
        titulo: 'Crear comité mensual de Gatekeeping con checklist de valor',
        explicacion: 'Toda oferta de innovación debe demostrar haber sido piloteada con una tensión real de target antes de comercializarse.',
        accion_sugerida: 'Agendar hito mensual de validación de Innovación',
        tipo_accion: 'acuerdo_minuta'
      }
    ]
  });

  const total = items.length;
  const altas = items.filter(i => i.severidad === 'alta').length;

  const nivelSalud = altas >= 3 ? 'Riesgo de Desalineación' : altas >= 1 ? 'Requiere Atención' : 'Óptima';

  return {
    timestamp: new Date().toISOString(),
    items,
    resumen_ejecutivo: {
      nivel_salud_estrategica: nivelSalud,
      total_observaciones: total,
      principales_fricciones: [
        'Fricciones en interfaces operativas de la Agenda Semanal (P1) sin entregables de retorno cerrados.',
        'Vacíos de Owner validado en frentes con alta carga de trabajo operativo.',
        'Fronteras difusas en la gestión de proveedores cuantitativos entre Campo y la Unidad Técnica.'
      ],
      recomendacion_inmediata: 'Resolver en la sesión directiva de esta semana los 3 acuerdos de interfaz P1 para evitar que la operación absorba la capacidad de análisis profundo del target.'
    }
  };
}

/**
 * Enriquecimiento mediante Gemini con el marco estratégico PHPVKS 3.0
 */
export async function auditarEstrategiaConAI(): Promise<AuditoriaEstrategicaReport> {
  const baseReport = generarAuditoriaEstrategicaHeuristica();
  const ai = getGeminiClient();

  if (!ai) {
    return {
      ...baseReport,
      error: 'GEMINI_API_KEY no configurada. Operando en modo Motor Heurístico Estratégico determinista.'
    };
  }

  try {
    const defaultModels = [
      'gemini-2.5-flash',
      'models/gemini-2.5-flash',
      'gemini-3.1-pro-preview',
      'models/gemini-3.1-pro-preview',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    const modelName = process.env.GEMINI_MODEL || defaultModels[0];

    const prompt = `
Actúa como el Auditor Estratégico Senior y Socio Consultor de la firma Provokers.

${CONTEXTO_ESTRATEGIA_PHPVKS}

DATOS BASE VERIFICADOS DE LA ORGANIZACIÓN Y AGENDA:
${JSON.stringify(baseReport.items, null, 2)}

TU TAREA:
Analiza estos elementos y enriquece o afina el diagnóstico, las implicaciones operativas profundas y genera 2 hipótesis o ideas de solución altamente plausibles y ejecutables para cada elemento.

Debes responder ÚNICAMENTE con un JSON válido con la siguiente estructura:
{
  "nivel_salud_estrategica": "Requiere Atención" | "Riesgo de Desalineación" | "Óptima",
  "recomendacion_inmediata": "Recomendación ejecutiva concisa para el comité directivo",
  "items": [
    {
      "id": "ID original del item",
      "diagnostico_alineacion": "Diagnóstico afilado contrastado contra los principios transversales de PHPVKS 3.0",
      "implicaciones_operativas": "Implicaciones sistémicas en la entrega de valor, el equipo y la sostenibilidad del entendimiento",
      "pregunta_directiva": "Pregunta directiva para confrontar al liderazgo",
      "hipotesis_soluciones": [
        {
          "id": "sol-1",
          "titulo": "Título de la hipótesis",
          "explicacion": "Explicación de por qué funciona y qué resuelve",
          "accion_sugerida": "Acción directa en la plataforma",
          "tipo_accion": "acuerdo_minuta" | "ajuste_prioridad" | "aclarar_interfaz" | "validar_owner",
          "acuerdo_propuesto": "Texto listo para insertar en la minuta de la semana"
        }
      ]
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    if (response && response.text) {
      const cleanJson = response.text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      const itemsMap = new Map<string, any>();
      if (Array.isArray(parsed.items)) {
        for (const it of parsed.items) {
          if (it.id) itemsMap.set(it.id, it);
        }
      }

      const mergedItems: AuditoriaEstrategicaItem[] = baseReport.items.map(baseItem => {
        const aiItem = itemsMap.get(baseItem.id);
        if (!aiItem) return baseItem;

        return {
          ...baseItem,
          diagnostico_alineacion: aiItem.diagnostico_alineacion || baseItem.diagnostico_alineacion,
          implicaciones_operativas: aiItem.implicaciones_operativas || baseItem.implicaciones_operativas,
          pregunta_directiva: aiItem.pregunta_directiva || baseItem.pregunta_directiva,
          hipotesis_soluciones: Array.isArray(aiItem.hipotesis_soluciones) && aiItem.hipotesis_soluciones.length > 0
            ? aiItem.hipotesis_soluciones
            : baseItem.hipotesis_soluciones
        };
      });

      return {
        timestamp: new Date().toISOString(),
        items: mergedItems,
        modelUsed: modelName,
        resumen_ejecutivo: {
          nivel_salud_estrategica: parsed.nivel_salud_estrategica || baseReport.resumen_ejecutivo.nivel_salud_estrategica,
          total_observaciones: mergedItems.length,
          principales_fricciones: baseReport.resumen_ejecutivo.principales_fricciones,
          recomendacion_inmediata: parsed.recomendacion_inmediata || baseReport.resumen_ejecutivo.recomendacion_inmediata
        }
      };
    }

    return baseReport;
  } catch (err: any) {
    console.warn('Fallback al motor determinista de auditoría estratégica por error en Gemini:', err?.message || err);
    return {
      ...baseReport,
      error: `Gemini no disponible temporalmente (${err?.message || 'Error de red'}). Mostrando análisis heurístico garantizado.`
    };
  }
}

/**
 * ASISTENTE DE IA ESTRATÉGICO:
 * Dialoga con el usuario a partir del reporte de auditoría y los principios.
 */
export async function conversarConAsistenteEstrategico(
  mensajes: AssistantChatMessage[],
  contextoItem?: AuditoriaEstrategicaItem | null
): Promise<string> {
  const ai = getGeminiClient();
  const contextHeader = contextoItem
    ? `CONTEXTO ESPECÍFICO DEL TEMA EN DISCUSIÓN:
- Título: ${contextoItem.titulo}
- Principio transversal: ${contextoItem.principio_transversal}
- Proceso: ${contextoItem.proceso_afectado || 'General'}
- Diagnóstico: ${contextoItem.diagnostico_alineacion}
- Implicaciones: ${contextoItem.implicaciones_operativas}
- Hipótesis iniciales: ${contextoItem.hipotesis_soluciones.map(h => `${h.titulo}: ${h.explicacion}`).join(' | ')}
- Involucrados: ${contextoItem.involucrados.join(', ')}`
    : `CONTEXTO GENERAL: Auditoría de alineación entre la Agenda de Gobernanza Enfoque y la Estrategia PHPVKS 3.0.`;

  if (!ai) {
    return `[Modo Asistente Heurístico]: Actualmente no hay una API Key de Gemini activa para responder de forma interactiva libre. Sin embargo, para este tema se recomienda: 
1. Convocar una sesión de 15 minutos entre los involucrados (${contextoItem ? contextoItem.involucrados.join(', ') : 'los líderes de proceso'}).
2. Acordar cuál es el entregable concreto de salida antes de que termine el ciclo semanal.
3. Asentar el compromiso en la Minuta de la Agenda.`;
  }

  const systemPrompt = `
Eres el Copiloto y Asistente Senior de Estrategia y Gobernanza de Provokers dentro de la plataforma ENFOQUE.
Tu función es actuar como un Sparring Partner directivo con pensamiento crítico, constructivo y pragmático.

${CONTEXTO_ESTRATEGIA_PHPVKS}

${contextHeader}

REGLAS DE CONDUCTA:
1. No cambias los hechos diagnosticados; construyes sobre ellos para ayudar al usuario a explorar causas, consecuencias y acuerdos viables.
2. Si te preguntan "¿por qué es esto un riesgo?", argumenta con el impacto en la perspectiva artesanal, la calidad metodológica o el desgaste del equipo.
3. Si te piden una redacción de acuerdo para la minuta, escribe un texto claro, ejecutivo y que asigne un responsable y un plazo inequívoco.
4. Mantén respuestas concisas, perspicaces y profesionales.
`;

  try {
    const formattedHistory = mensajes.map(m => `${m.role === 'user' ? 'Líder / Usuario' : 'Asistente'}: ${m.content}`).join('\n\n');

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `${formattedHistory}\n\nAsistente:` ,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3
      }
    });

    return response.text || 'No fue posible generar una respuesta en este momento.';
  } catch (err: any) {
    console.error('Error en asistente estratégico:', err);
    return `Error al conectar con el Asistente de IA: ${err?.message || 'Error de servicio'}. Por favor intenta de nuevo en unos momentos.`;
  }
}
