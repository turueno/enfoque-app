'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Persona } from '@/lib/types';
import { useUser } from './UserContext';
import Tooltip, { InfoTooltip } from '@/components/Tooltip';
import {
  User,
  Shield,
  CheckCircle2,
  GitCommit,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  HelpCircle,
  Clock,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface MiEnfoqueClientProps {
  personas: Persona[];
  initialId: string;
  initialData: any;
}

export default function MiEnfoqueClient({
  personas,
  initialId,
  initialData,
}: MiEnfoqueClientProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useUser();
  const [selectedId, setSelectedId] = useState(initialId);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Sync with global workspace user if changed from navbar
  useEffect(() => {
    if (currentUser.id && currentUser.id !== selectedId) {
      handleSelectPersona(currentUser.id);
    }
  }, [currentUser.id]);

  const handleSelectPersona = async (id: string) => {
    setSelectedId(id);
    const matched = personas.find(p => p.id === id);
    if (matched) {
      setCurrentUser({
        id: matched.id,
        nombre: matched.nombre,
        email: matched.email || `${matched.nombre.toLowerCase().replace(/\s+/g, '.')}@enfoque.io`,
        rol_funcional: matched.rol_funcional_validado || matched.rol_funcional_propuesto || ''
      });
    }
    setLoading(true);
    router.push(`/mi-enfoque?id=${id}`, { scroll: false });
    try {
      const res = await fetch(`/api/mi-enfoque?id=${id}`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!data || !data.persona) {
    return (
      <div className="p-8 text-center text-slate-500">
        No se encontró información para esta persona.
      </div>
    );
  }

  const {
    persona,
    frentesOwner,
    frentesParticipa,
    dependeDeMi,
    dondeContribuyo,
    decisionesPropias,
    esperoDeOtros,
    otrosEsperanDeMi
  } = data;

  return (
    <div className="space-y-8">
      {/* Header with quick selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-0.5 rounded-md bg-[#191919] text-[#FFAA34] text-xs font-mono font-bold">
            {persona.id}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
            Enfoque: {persona.nombre}
          </h1>
          <InfoTooltip
            content="Resumen operativo personal: responsabilidades de accountability, autoridad de decisión y dependencias mutuas."
            position="right"
          />
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl scrollbar-none">
          {personas.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#191919] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-[#191919] hover:bg-white/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#F6911E]' : 'bg-slate-300'}`} />
                <span>{p.nombre.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="py-2 text-center text-xs text-slate-400 font-editorial animate-pulse">
          Actualizando mapa personal...
        </div>
      )}

      {/* 1. MI TERRITORIO */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          <Shield className="w-4 h-4 text-[#F6911E]" />
          <span>Mi Territorio</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Rol Funcional</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {persona.rol_funcional_validado || persona.rol_funcional_propuesto || 'Por definir'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Territorio Principal</span>
            <p className="text-sm text-slate-700 mt-1">
              {persona.territorio_principal || 'Por definir'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Owner de Procesos</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {frentesOwner.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Ninguno</span>
              ) : (
                frentesOwner.map((f: any) => (
                  <Link
                    key={f.id}
                    href={`/procesos/${f.id}`}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-medium hover:bg-blue-100"
                  >
                    <span>{f.nombre_corto}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Participa en Procesos</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {frentesParticipa.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Ninguno</span>
              ) : (
                frentesParticipa.map((f: any) => (
                  <Link
                    key={f.id}
                    href={`/procesos/${f.id}`}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs hover:bg-slate-200"
                  >
                    <span>{f.nombre_corto}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: LO QUE DEPENDE DE MÍ vs DONDE CONTRIBUYO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. LO QUE DEPENDE DE MÍ */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Lo Que Depende de Mí ({dependeDeMi.length})
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                Owner · Decide · Ejecuta
              </span>
            </div>

            {dependeDeMi.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No tiene responsabilidades con rol principal asignadas.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {dependeDeMi.map((r: any) => (
                  <div key={r.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#191919]">{r.frente_nombre}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#191919] border border-slate-200">
                        {r.rol_validado || r.rol_propuesto}
                      </span>
                    </div>
                    <p className="text-slate-900 font-editorial leading-relaxed text-base">
                      "{r.responsabilidad_original}"
                    </p>
                    {r.comentario_propuesta && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 font-medium">
                        💡 <strong>Calibración:</strong> {r.comentario_propuesta}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-200/50">
                      <span>ID: {r.id} ({r.celda_origen || 'Excel'})</span>
                      <span className={r.estado_validacion === 'APROBADO' ? 'text-emerald-700 font-semibold' : 'text-[#F6911E] font-semibold'}>
                        {r.estado_validacion}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. DONDE CONTRIBUYO */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#191919]" />
                <h3 className="text-sm font-bold text-[#191919] tracking-tight">
                  Donde Contribuyo ({dondeContribuyo.length})
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#191919]">
                Contribuye · Informado
              </span>
            </div>

            {dondeContribuyo.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No tiene responsabilidades de contribución asignadas.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {dondeContribuyo.map((r: any) => (
                  <div key={r.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#191919]">{r.frente_nombre}</span>
                      <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {r.rol_validado || r.rol_propuesto}
                      </span>
                    </div>
                    <p className="text-slate-900 font-editorial leading-relaxed text-base">
                      "{r.responsabilidad_original}"
                    </p>
                    {r.comentario_propuesta && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 font-medium">
                        💡 <strong>Calibración:</strong> {r.comentario_propuesta}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-200/50">
                      <span>ID: {r.id}</span>
                      <span>{r.estado_validacion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. DECISIONES QUE ME CORRESPONDEN */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Decisiones Que Me Corresponden ({decisionesPropias.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Autoridad final de decisión asignada</span>
        </div>

        {decisionesPropias.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3">No tiene decisiones con autoridad final registradas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisionesPropias.map((d: any) => (
              <div key={d.id} className="p-4 rounded-lg bg-amber-50/40 border border-amber-200/60 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm leading-snug">{d.decision}</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-200">
                    {d.id}
                  </span>
                </div>
                <div className="text-slate-700 text-xs space-y-1.5 leading-relaxed">
                  <div>
                    <span className="font-semibold text-slate-800">Proceso: </span>
                    <span>{d.frente_nombre}</span>
                  </div>
                  {d.consultar_a_propuesto && (
                    <div>
                      <span className="font-semibold text-slate-800">Consultar a: </span>
                      <span className="text-slate-800">{d.consultar_a_validado || d.consultar_a_propuesto}</span>
                    </div>
                  )}
                  {d.momento_trigger && (
                    <div>
                      <span className="font-semibold text-slate-800">Momento / Disparador: </span>
                      <span>{d.momento_trigger}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5 & 6. INTERFACES (ESPERO DE OTROS vs OTROS ESPERAN DE MÍ) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESPERO DE OTROS (Inbound) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Espero de Otros ({esperoDeOtros.length})
              </h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
              Inbound / Entregables requeridos
            </span>
          </div>

          {esperoDeOtros.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No tiene dependencias de entrada registradas.</p>
          ) : (
            <div className="space-y-3">
              {esperoDeOtros.map((i: any) => (
                <div key={i.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
                      <span className="text-slate-400 font-normal">De:</span>
                      <strong className="text-indigo-900 font-bold">{i.de_persona_nombre}</strong>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {i.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Debe entregarme:</span>
                    <p className="text-slate-900 font-medium text-sm leading-relaxed">{i.entrega_input}</p>
                  </div>
                  {i.devuelve_output && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Devuelvo a cambio:</span>
                      <p className="text-slate-700 text-xs leading-relaxed">{i.devuelve_output}</p>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <div className="flex items-center space-x-2">
                      <span>Procesos: {i.frentes_relacionados}</span>
                      <Link
                        href={`/agenda?tipo=bilateral&personaA=${persona.id}&personaB=${i.de_persona_id || ''}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        title="Ver agenda de reunión 1 a 1 con esta persona"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Agenda 1 a 1</span>
                      </Link>
                    </div>
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                      {i.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OTROS ESPERAN DE MÍ (Outbound) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Otros Esperan de Mí ({otrosEsperanDeMi.length})
              </h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800">
              Outbound / Entregables a entregar
            </span>
          </div>

          {otrosEsperanDeMi.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No tiene dependencias de salida registradas.</p>
          ) : (
            <div className="space-y-3">
              {otrosEsperanDeMi.map((i: any) => (
                <div key={i.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
                      <span className="text-slate-400 font-normal">Entrego a:</span>
                      <strong className="text-purple-900 font-bold">{i.hacia_persona_nombre}</strong>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {i.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Debo entregar:</span>
                    <p className="text-slate-900 font-medium text-sm leading-relaxed">{i.entrega_input}</p>
                  </div>
                  {i.devuelve_output && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Me devuelven:</span>
                      <p className="text-slate-700 text-xs leading-relaxed">{i.devuelve_output}</p>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <div className="flex items-center space-x-2">
                      <span>Procesos: {i.frentes_relacionados}</span>
                      <Link
                        href={`/agenda?tipo=bilateral&personaA=${persona.id}&personaB=${i.hacia_persona_id || ''}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        title="Ver agenda de reunión 1 a 1 con esta persona"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Agenda 1 a 1</span>
                      </Link>
                    </div>
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                      {i.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
