import React from 'react';
import { getAIReviewAnalysis } from '@/lib/queries';
import RevisorClient from '@/components/RevisorClient';
import Tooltip, { InfoTooltip } from '@/components/Tooltip';

export const dynamic = 'force-dynamic';

export default function RevisorPage() {
  const observations = getAIReviewAnalysis();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
          Revisor Organizacional
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Revisar ENFOQUE con Asistente Heurístico
        </h1>
        <InfoTooltip
          content="Detección de ambigüedades estructurales, dispersión operativa y cuellos de botella formuladas estrictamente como hipótesis para revisión y preguntas guía, sin sustituir el criterio humano del equipo."
          position="right"
          maxWidth="max-w-md"
        />
      </div>

      <RevisorClient initialObservations={observations} />
    </div>
  );
}
