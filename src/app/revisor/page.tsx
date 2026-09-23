import React from 'react';
import { getAIReviewAnalysis } from '@/lib/queries';
import RevisorClient from '@/components/RevisorClient';
import Tooltip, { InfoTooltip } from '@/components/Tooltip';

import { enrichObservationsWithAI, getGeminiClient } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export default async function RevisorPage() {
  const rawObservations = getAIReviewAnalysis();
  const hasAI = Boolean(getGeminiClient());
  const observations = await enrichObservationsWithAI(rawObservations);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
          Revisor Organizacional
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Revisar ENFOQUE con Agente IA Grounded
        </h1>
        <InfoTooltip
          content="Detección de ambigüedades estructurales, dispersión operativa y cuellos de botella calculados mediante reglas heurísticas deterministas e interpretados por IA generativa anclada para formular hipótesis y preguntas estratégicas."
          position="right"
          maxWidth="max-w-md"
        />
      </div>

      <RevisorClient initialObservations={observations} initialHasAI={hasAI} />
    </div>
  );
}
