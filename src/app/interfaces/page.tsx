import React from 'react';
import { getAllInterfaces, getAllPersonas, getAllFrentes } from '@/lib/queries';
import InterfacesClient from '@/components/InterfacesClient';

import Tooltip, { InfoTooltip } from '@/components/Tooltip';

export const dynamic = 'force-dynamic';

export default function InterfacesPage() {
  const interfaces = getAllInterfaces();
  const personas = getAllPersonas();
  const frentes = getAllFrentes();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Red de Interfaces y Dependencias Operativas
        </h1>
        <InfoTooltip
          content="Relaciones A entrega algo a B ➔ B devuelve algo a A. Visualiza la red completa de dependencias, cuellos de botella y centralidad en el equipo."
          position="right"
        />
      </div>

      <InterfacesClient
        initialInterfaces={interfaces}
        personas={personas}
        frentes={frentes}
      />
    </div>
  );
}
