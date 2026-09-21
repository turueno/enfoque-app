import React from 'react';
import Link from 'next/link';
import { getAllPersonas, getAllResponsabilidades, getAllFrentes } from '@/lib/queries';
import { User, Shield, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import Tooltip, { InfoTooltip } from '@/components/Tooltip';

export const dynamic = 'force-dynamic';

export default function PersonasPage() {
  const personas = getAllPersonas();
  const resps = getAllResponsabilidades();
  const frentes = getAllFrentes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Integrantes de la Organización
          </h1>
          <InfoTooltip
            content="Mapa de personas, sus roles clave, territorios de especialidad y cobertura transversal de responsabilidades operativas."
            position="right"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {personas.map((p) => {
          const userResps = resps.filter(r => r.persona_id === p.id);
          const ownerFrentes = frentes.filter(f => f.owner_id_validado === p.id || (!f.owner_id_validado && f.owner_id_propuesto === p.id));

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                      {p.nombre.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {p.nombre}
                      </h2>
                      <span className="font-mono text-[11px] text-slate-400">
                        {p.id} · {p.email || 'Workspace'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="mt-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 font-semibold text-sm truncate mr-2">
                      {p.rol_funcional_validado || p.rol_funcional_propuesto || 'Rol no definido'}
                    </span>
                    {p.territorio_principal && (
                      <Tooltip
                        content={
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#FFAA34] tracking-wider block">Territorio Principal</span>
                            <p className="text-xs text-slate-200 mt-0.5">{p.territorio_principal}</p>
                          </div>
                        }
                        position="top"
                      >
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium cursor-help flex-shrink-0">
                          <MapPin className="w-2.5 h-2.5 text-[#F6911E]" />
                          <span className="truncate max-w-[100px]">{p.territorio_principal}</span>
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  {ownerFrentes.length > 0 && (
                    <div className="pt-1 border-t border-slate-200/60">
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Owner ({ownerFrentes.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ownerFrentes.map(f => (
                          <span key={f.id} className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-100">
                            {f.nombre_corto}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {userResps.length} Responsabilidades
                </span>
                <Link
                  href={`/mi-enfoque?id=${p.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>Ver Enfoque</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
