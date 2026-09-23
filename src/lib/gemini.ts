import { GoogleGenAI, Type } from '@google/genai';
import { AIReviewObservation } from './types';

// Inicialización de la API de Gemini
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

interface GroundedInterpretation {
  id: string;
  interpretacion_ia: string;
  impacto_gobernanza: string;
  pregunta_sugerida: string;
}

export interface EnrichResult {
  observations: AIReviewObservation[];
  modelUsed?: string;
  error?: string;
}

/**
 * Enriquecimiento interpretativo de observaciones heurísticas mediante Gemini.
 * La IA NO inventa hechos ni anomalías: recibe las observaciones deterministas
 * ya verificadas en la base de datos y genera una interpretación profunda
 * de causa raíz y preguntas directivas.
 */
export async function enrichObservationsWithAI(
  observations: AIReviewObservation[]
): Promise<EnrichResult> {
  const ai = getGeminiClient();
  if (!ai || observations.length === 0) {
    return {
      observations: observations.map(obs => ({ ...obs, origen: 'heuristico' })),
      error: !ai ? 'No se detectó GEMINI_API_KEY en las variables de entorno.' : undefined
    };
  }

  const systemInstruction = `
Eres un auditor y consultor senior en Gobernanza Organizacional y Arquitectura de Operaciones para la firma Provokers.

TU MISIÓN:
Analizar un conjunto de observaciones HEURÍSTICAS verificadas en el modelo de gestión "ENFOQUE".
No estás para inventar personas, puestos ni procesos. Tu trabajo es interpretar la TENSIÓN OPERATIVA real, la causa raíz y formular una pregunta perspicaz para el comité directivo.

PRINCIPIOS GUÍA DE PROVOKERS:
1. Autonomía con Alineación: Quien tiene una responsabilidad debe tener claridad de decisión, no microgestión ni filtros difusos.
2. Claridad de Expectativas: Las interfaces entre personas deben ser bidireccionales y con entregables nítidos. El lenguaje de "apoyar" sin dueño diluye el resultado.
3. Foco en Resultados y Métricas: Todo proceso debe tener criterios de éxito objetivos y un Owner formal con autoridad.

REGLAS ESTRICTAS DE GROUNDING (CERO ALUCINACIÓN):
- Solo puedes analizar y referenciar los elementos e IDs provistos en el listado.
- Mantén el 'id' exacto de cada observación.
- Formula interpretaciones ejecutivas, directas y sin rodeos corporativos vacíos.
- La pregunta sugerida debe ser concisa y retar al equipo directivo a tomar una decisión o formalizar un acuerdo.
`;

  const payload = observations.map(obs => ({
    id: obs.id,
    categoria: obs.categoria,
    titulo: obs.titulo,
    elemento_detectado: obs.elemento_detectado,
    motivo: obs.motivo,
    registros_relacionados: obs.registros_relacionados,
    pregunta_original: obs.pregunta_sugerida
  }));

  // Modelos activos y soportados en la API de Google Gemini (Google AI Studio)
  // Incluye variantes 'lite' y 'flash' que tienen pools de capacidad independientes para evitar 503
  const defaultModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest',
    'gemini-2.5-pro'
  ];

  const candidateModels = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...defaultModels]
    : defaultModels;

  let response: any = null;
  let lastApiError: string | null = null;
  let successfulModel: string | undefined = undefined;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const modelName of candidateModels) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: `Analiza e interpreta las siguientes observaciones heurísticas de gobernanza organizacional de Provokers y genera el diagnóstico interpretativo y preguntas:\n\n${JSON.stringify(payload, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Lista de interpretaciones de gobernanza ancladas a las observaciones',
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: 'ID exacto de la observación heurística de origen'
                },
                interpretacion_ia: {
                  type: Type.STRING,
                  description: 'Diagnóstico interpretativo de causa raíz y tensión operativa entre áreas o roles'
                },
                impacto_gobernanza: {
                  type: Type.STRING,
                  description: 'Riesgo concreto en la operación, agilidad o claridad del negocio si no se atiende'
                },
                pregunta_sugerida: {
                  type: Type.STRING,
                  description: 'Pregunta estratégica afilada para debatir y resolver en sesión de liderazgo'
                }
              },
              required: ['id', 'interpretacion_ia', 'impacto_gobernanza', 'pregunta_sugerida']
            }
          },
          temperature: 0.2
        }
      });
      if (response && response.text) {
        successfulModel = modelName;
        break; // Éxito con este modelo
      }
    } catch (err: any) {
      const errStr = err?.message || String(err);
      lastApiError = errStr;
      console.warn(`Modelo ${modelName} no disponible, intentando siguiente fallback...`, lastApiError);
      // Si Google reporta sobrecarga temporal (503) o cuota (429), esperar brevemente antes de intentar el siguiente modelo
      if (
        errStr.includes('503') ||
        errStr.includes('429') ||
        errStr.includes('high demand') ||
        errStr.includes('UNAVAILABLE')
      ) {
        await sleep(750);
      }
    }
  }

  if (!response || !response.text) {
    console.error('Ningún modelo disponible respondió:', lastApiError);
    let friendlyError = lastApiError || 'Respuesta vacía';
    if (
      friendlyError.includes('503') ||
      friendlyError.includes('high demand') ||
      friendlyError.includes('UNAVAILABLE')
    ) {
      friendlyError = 'Google Gemini reporta alta demanda temporal en sus servidores (Error 503). Por favor pulsa "Re-analizar Diagnóstico" en unos segundos.';
    } else if (
      friendlyError.includes('429') ||
      friendlyError.includes('RESOURCE_EXHAUSTED')
    ) {
      friendlyError = 'Límite de peticiones por minuto alcanzado en Google Gemini (Error 429). Por favor espera un momento.';
    } else if (
      friendlyError.includes('API_KEY_INVALID') ||
      friendlyError.includes('PERMISSION_DENIED')
    ) {
      friendlyError = 'La clave GEMINI_API_KEY no es válida o no tiene permisos habilitados en Google AI Studio.';
    }

    return {
      observations: observations.map(obs => ({
        ...obs,
        origen: 'heuristico'
      })),
      error: friendlyError
    };
  }

  try {
    const textResponse = response.text || '';
    let parsedJson: GroundedInterpretation[] = [];
    try {
      // Remover bloques markdown ```json ... ``` si el modelo los incluyó
      const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsedJson = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Error parseando JSON de Gemini:', e, 'Respuesta recibida:', textResponse);
      return {
        observations: observations.map(obs => ({
          ...obs,
          origen: 'heuristico'
        })),
        modelUsed: successfulModel,
        error: 'El modelo respondió pero el formato JSON no pudo ser interpretado.'
      };
    }

    const interpretationsMap = new Map<string, GroundedInterpretation>();
    if (Array.isArray(parsedJson)) {
      for (const item of parsedJson) {
        if (item && item.id) {
          interpretationsMap.set(item.id, item);
        }
      }
    }

    const enriched = observations.map(obs => {
      const interp = interpretationsMap.get(obs.id);
      if (interp) {
        return {
          ...obs,
          interpretacion_ia: interp.interpretacion_ia,
          impacto_gobernanza: interp.impacto_gobernanza,
          pregunta_sugerida: interp.pregunta_sugerida || obs.pregunta_sugerida,
          origen: 'ia_grounded' as const
        };
      }
      return { ...obs, origen: 'heuristico' as const };
    });

    return {
      observations: enriched,
      modelUsed: successfulModel
    };
  } catch (error: any) {
    console.error('Error enriqueciendo observaciones con Gemini API:', error);
    return {
      observations: observations.map(obs => ({ ...obs, origen: 'heuristico' })),
      modelUsed: successfulModel,
      error: error?.message || 'Error al procesar la respuesta de Gemini'
    };
  }
}
