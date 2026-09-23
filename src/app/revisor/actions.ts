'use server';

import { getAIReviewAnalysis } from '@/lib/queries';
import { enrichObservationsWithAI, getGeminiClient } from '@/lib/gemini';

export async function reanalizarAction() {
  try {
    const heuristic = getAIReviewAnalysis();
    const hasAI = Boolean(getGeminiClient());
    const result = await enrichObservationsWithAI(heuristic);

    return {
      success: true,
      hasAI,
      modelUsed: result.modelUsed,
      error: result.error,
      observations: result.observations
    };
  } catch (err: any) {
    console.error('Error in reanalizarAction:', err);
    return {
      success: false,
      hasAI: false,
      error: err?.message || 'Error desconocido al reanalizar en el servidor',
      observations: getAIReviewAnalysis()
    };
  }
}
