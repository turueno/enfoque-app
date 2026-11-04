import React from 'react';
import {
  getAgendaSemanal,
  getAgendaBilateral,
  getAgendaProceso,
  getMinutasReuniones
} from '@/lib/agenda';
import { getTemasImpacto } from '@/lib/impacto';
import { getAllPersonas, getAllFrentes, getAllResultados } from '@/lib/queries';
import { getTextosSistemaMap } from '@/lib/db';
import AgendaClient from '@/components/AgendaClient';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams
}: {
  searchParams?: Promise<{ tipo?: string; personaA?: string; personaB?: string; frente?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialMode = (params.tipo as 'semanal' | 'bilateral' | 'proceso' | 'minutas' | 'impacto') || 'semanal';
  const initialPersonaA = params.personaA || '';
  const initialPersonaB = params.personaB || '';
  const initialFrente = params.frente || '';

  const personas = getAllPersonas();
  const frentes = getAllFrentes();
  const resultados = getAllResultados();
  const minutas = getMinutasReuniones();
  const temasImpacto = getTemasImpacto();
  const textosMap = getTextosSistemaMap();

  let initialData: any;
  if (initialMode === 'bilateral' && initialPersonaA && initialPersonaB) {
    initialData = getAgendaBilateral(initialPersonaA, initialPersonaB);
  } else if (initialMode === 'proceso' && initialFrente) {
    initialData = getAgendaProceso(initialFrente);
  } else {
    initialData = getAgendaSemanal();
  }

  return (
    <div className="py-2">
      <AgendaClient
        initialData={initialData}
        initialMode={initialMode}
        initialPersonaA={initialPersonaA}
        initialPersonaB={initialPersonaB}
        initialFrente={initialFrente}
        personas={personas}
        frentes={frentes}
        resultados={resultados}
        initialMinutas={minutas}
        initialTemasImpacto={temasImpacto}
        textosMap={textosMap}
      />
    </div>
  );
}
