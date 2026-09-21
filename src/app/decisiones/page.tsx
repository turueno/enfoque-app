import React from 'react';
import { getAllDecisiones, getAllFrentes, getAllPersonas } from '@/lib/queries';
import DecisionesClient from '@/components/DecisionesClient';

export const dynamic = 'force-dynamic';

export default function DecisionesPage() {
  const decisiones = getAllDecisiones();
  const frentes = getAllFrentes();
  const personas = getAllPersonas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mapa de Autoridad y Decisiones
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ¿Quién tiene autoridad para decidir qué? Cada decisión organizacional debe tener un único decisor final asignado y personas de consulta explícitas.
        </p>
      </div>

      <DecisionesClient
        initialDecisiones={decisiones}
        frentes={frentes}
        personas={personas}
      />
    </div>
  );
}
