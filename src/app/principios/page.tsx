import React from 'react';
import { getAllPrincipios, getAllFrentes } from '@/lib/queries';
import { getDb, queryAll } from '@/lib/db';
import PrincipiosClient from '@/components/PrincipiosClient';
import { auditarEstrategiaConAI } from '@/lib/auditorEstrategico';

export const dynamic = 'force-dynamic';

export default async function PrincipiosPage() {
  const principios = getAllPrincipios();
  const frentes = getAllFrentes();

  // Get cross relation frente_principios
  const frentePrincipios = queryAll<{ frente_id: string; principio_id: string; aplicacion: string }>('SELECT * FROM frente_principios');

  let report;
  try {
    report = await auditarEstrategiaConAI();
  } catch (err: any) {
    console.error('Error cargando auditoría estratégica:', err);
    report = {
      timestamp: new Date().toISOString(),
      items: [],
      resumen_ejecutivo: {
        nivel_salud_estrategica: 'Requiere Atención' as const,
        total_observaciones: 0,
        principales_fricciones: [],
        recomendacion_inmediata: 'Cargando datos estratégicos...'
      },
      error: err?.message || 'Error inicializando reporte'
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Principios Transversales
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Los principios no son tareas; son criterios operativos rectores transversales aplicados a los procesos de negocio.
        </p>
      </div>

      <PrincipiosClient
        principios={principios}
        frentes={frentes}
        frentePrincipios={frentePrincipios}
        initialReport={report}
      />
    </div>
  );
}
