import React from 'react';
import { getMapaMatrix } from '@/lib/queries';
import MapaEnfoqueClient from '@/components/MapaEnfoqueClient';
import { InfoTooltip } from '@/components/Tooltip';

export const dynamic = 'force-dynamic';

export default function MapaPage() {
  const data = getMapaMatrix();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mapa ENFOQUE — Matriz de Cobertura y Roles
        </h1>
        <InfoTooltip
          content="Cruce de Procesos de Negocio × Integrantes de Equipo. Haz clic en cualquier celda para inspeccionar o validar las responsabilidades específicas."
          position="bottom"
          maxWidth="max-w-md"
          size={16}
        />
      </div>

      <MapaEnfoqueClient
        frentes={data.frentes}
        personas={data.personas}
        matrix={data.matrix}
      />
    </div>
  );
}
