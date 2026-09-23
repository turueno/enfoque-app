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

/**
 * Enriquecimiento interpretativo de observaciones heurísticas mediante Gemini.
 * La IA NO inventa hechos ni anomalías: recibe las observaciones deterministas
 * ya verificadas en la base de datos y genera una interpretación profunda
 * de causa raíz y preguntas directivas.
 */
export async function enrichObservationsWithAI(
  observations: AIReviewObservation[]
): Promise<AIReviewObservation[]> {
  const ai = getGeminiClient();
  if (!ai || observations.length === 0) {
    // Si no hay API key o no hay observaciones, se devuelven las heurísticas intactas
    return observations.map(obs => ({ ...obs, origen: 'heuristico' }));
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

  // Lista de modelos en orden de prioridad para tolerar saturación temporal (código 503)
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'];

  let response: any = null;
  let lastApiError: unknown = null;

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
        break; // Éxito con este modelo
      }
    } catch (err) {
      lastApiError = err;
      console.warn(`Modelo ${modelName} no disponible, intentando siguiente fallback...`);
    }
  }

  if (!response || !response.text) {
    const errorMsg = lastApiError instanceof Error ? `${lastApiError.name}: ${lastApiError.message}` : String(lastApiError);
    return observations.map(obs => ({
      ...obs,
      origen: 'heuristico',
      motivo: `${obs.motivo} [Nota IA: ${errorMsg}]`
    }));
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
      return observations.map(obs => ({
        ...obs,
        origen: 'heuristico',
        motivo: `${obs.motivo} [Nota IA: Error parseando JSON - ${textResponse.slice(0, 100)}]`
      }));
    }

    const interpretationsMap = new Map<string, GroundedInterpretation>();
    if (Array.isArray(parsedJson)) {
      for (const item of parsedJson) {
        if (item && item.id) {
          interpretationsMap.set(item.id, item);
        }
      }
    }

    return observations.map(obs => {
      const interp = interpretationsMap.get(obs.id);
      if (interp) {
        return {
          ...obs,
          interpretacion_ia: interp.interpretacion_ia,
          impacto_gobernanza: interp.impacto_gobernanza,
          pregunta_sugerida: interp.pregunta_sugerida || obs.pregunta_sugerida,
          origen: 'ia_grounded'
        };
      }
      return { ...obs, origen: 'heuristico' };
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error('Error enriqueciendo observaciones con Gemini API:', errorMsg);
    // Retornamos las observaciones marcadas pero propagamos el error para diagnóstico
    return observations.map(obs => ({ 
      ...obs, 
      origen: 'heuristico',
      motivo: `${obs.motivo} [Nota IA: ${errorMsg}]` 
    }));
  }
}
