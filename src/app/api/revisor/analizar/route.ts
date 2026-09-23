import { NextResponse } from 'next/server';
import { getAIReviewAnalysis } from '@/lib/queries';
import { enrichObservationsWithAI, getGeminiClient } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Obtener hechos duros verificados por el motor heurístico determinista
    const heuristicObservations = getAIReviewAnalysis();

    // 2. Verificar si Gemini está habilitado
    const hasAI = Boolean(getGeminiClient());

    let lastError: string | null = null;
    let observations = heuristicObservations;
    if (hasAI) {
      try {
        observations = await enrichObservationsWithAI(heuristicObservations);
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      success: true,
      hasAI,
      debugError: lastError,
      observations
    });
  } catch (error) {
    console.error('Error en API /api/revisor/analizar:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al analizar'
      },
      { status: 500 }
    );
  }
}
