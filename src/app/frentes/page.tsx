import React from 'react';
import Link from 'next/link';
import { getAllFrentes } from '@/lib/queries';
import { Layers, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function FrentesPage() {
  const frentes = getAllFrentes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Procesos Organizacionales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Los 7 ejes y macroprocesos de operación, resultados e innovación. Haz clic en cualquiera para consultar su estructura completa de gobernanza.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {frentes.map((f) => (
          <div
            key={f.id}
            className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {f.id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {f.tipo_frente}
                  </span>
                </div>
                {f.alert_count > 0 ? (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{f.alert_count} observación{f.alert_count > 1 ? 'es' : ''}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Estructurado</span>
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-lg font-bold text-slate-900">
                {f.nombre_corto}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono line-clamp-1">
                Origen: {f.nombre_original.replace(/\n/g, ' ')}
              </p>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Owner responsable: </span>
                  <strong className="text-slate-800 font-bold">{f.owner_nombre || 'Sin definir'}</strong>
                </div>
                {f.resultado_principal && (
                  <div>
                    <span className="text-slate-400 font-medium block">Resultado esperado:</span>
                    <p className="text-slate-700 mt-0.5 line-clamp-2">{f.resultado_principal}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex space-x-4 text-xs text-slate-500 font-medium">
                <span>{f.responsabilidades_count} Responsabilidades</span>
                <span>•</span>
                <span>{f.decisiones_count} Decisiones</span>
                <span>•</span>
                <span>{f.interfaces_count} Interfaces</span>
              </div>
              <Link
                href={`/frentes/${f.id}`}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>Explorar Proceso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
