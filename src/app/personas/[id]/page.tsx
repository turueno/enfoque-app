import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPersonaById, getMiEnfoque } from '@/lib/queries';
import { ArrowLeft, Shield, CheckCircle2, GitCommit, ArrowRight, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = getPersonaById(id);
  if (!persona) notFound();

  const enfoque = getMiEnfoque(id);

  return (
    <div className="space-y-6">
      <Link
        href="/personas"
        className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver al directorio de personas</span>
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold text-xl flex items-center justify-center">
            {persona.nombre.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                {persona.id}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{persona.nombre}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">{persona.email}</p>
          </div>
        </div>

        <Link
          href={`/mi-enfoque?id=${persona.id}`}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <User className="w-4 h-4 text-blue-400" />
          <span>Abrir como "Enfoque"</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Territorio & Rol
          </span>
          <div>
            <span className="text-xs text-slate-400 font-medium">Rol Funcional:</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {persona.rol_funcional_validado || persona.rol_funcional_propuesto || 'Por definir'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Territorio:</span>
            <p className="text-xs text-slate-700 mt-0.5">
              {persona.territorio_principal || 'Sin definir'}
            </p>
          </div>
          {persona.nota && (
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
              Nota: {persona.nota}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Procesos Como Owner ({enfoque?.frentesOwner.length || 0})
          </span>
          {enfoque?.frentesOwner.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No es Owner de ningún proceso.</p>
          ) : (
            <div className="space-y-2">
              {enfoque?.frentesOwner.map((f: any) => (
                <Link
                  key={f.id}
                  href={`/procesos/${f.id}`}
                  className="block p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold"
                >
                  {f.id}: {f.nombre_corto}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Resumen de Carga Operativa
          </span>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Depende de mí (Owner/Decide/Ejecuta):</span>
              <strong className="text-slate-900">{enfoque?.dependeDeMi.length || 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Contribuye o Informado:</span>
              <strong className="text-slate-900">{enfoque?.dondeContribuyo.length || 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Decisiones que toma:</span>
              <strong className="text-slate-900">{enfoque?.decisionesPropias.length || 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Espera de otros (Inbound):</span>
              <strong className="text-slate-900">{enfoque?.esperoDeOtros.length || 0}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Otros esperan de él/ella (Outbound):</span>
              <strong className="text-slate-900">{enfoque?.otrosEsperanDeMi.length || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
