import React from 'react';
import {
  getAllFrentes,
  getAllResponsabilidades,
  getAllResultados,
  getAllDecisiones,
  getAllInterfaces,
  getAllPersonas
} from '@/lib/queries';
import ValidarClient from '@/components/ValidarClient';

export const dynamic = 'force-dynamic';

export default function ValidarPage() {
  const frentes = getAllFrentes();
  const responsabilidades = getAllResponsabilidades();
  const resultados = getAllResultados();
  const decisiones = getAllDecisiones();
  const interfaces = getAllInterfaces();
  const personas = getAllPersonas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Validar ENFOQUE — Revisión Secuencial
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Flujo paso a paso para ratificar, ajustar o rechazar propuestas preliminares conservando en todo momento el texto original del Excel.
        </p>
      </div>

      <ValidarClient
        frentes={frentes}
        responsabilidades={responsabilidades}
        resultados={resultados}
        decisiones={decisiones}
        interfaces={interfaces}
        personas={personas}
      />
    </div>
  );
}
