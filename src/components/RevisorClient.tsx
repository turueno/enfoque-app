'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AIReviewObservation } from '@/lib/types';
import { Sparkles, HelpCircle, AlertCircle, RefreshCw, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';

interface RevisorClientProps {
  initialObservations: AIReviewObservation[];
}

export default function RevisorClient({ initialObservations }: RevisorClientProps) {
  const [observations, setObservations] = useState(initialObservations);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [analyzing, setAnalyzing] = useState(false);

  const categories = ['ALL', 'Ambigüedad', 'Autoridad', 'Dependencia', 'Sobrecarga', 'Métricas'];

  const filtered = observations.filter(obs => {
    if (activeFilter !== 'ALL' && obs.categoria !== activeFilter) return false;
    return true;
  });

  const handleRefresh = async () => {
    setAnalyzing(true);
    // Simulate real scan
    setTimeout(() => {
      setAnalyzing(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Banner & Trigger */}
      <div className="bg-[#191919] rounded-2xl p-6 text-white shadow-md border-l-4 border-[#F6911E] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2 text-[#FFAA34] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#F6911E]" />
            <span>Principio de IA Asistente</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            La IA no decide responsabilidades; señala hipótesis para revisión del equipo.
          </h2>
          <p className="text-xs text-slate-300 font-editorial leading-relaxed">
            Cada observación expone qué se detectó, por qué podría generar fricción o ambigüedad y qué pregunta específica debe plantearse la organización para resolverlo.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={analyzing}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors shadow-sm self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analizando...' : 'Re-ejecutar Diagnóstico'}</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mr-1">
          Categoría:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === cat
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? `Todas (${observations.length})` : cat}
          </button>
        ))}
      </div>

      {/* Observations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((obs) => (
          <div
            key={obs.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  obs.categoria === 'Ambigüedad' ? 'bg-amber-100 text-amber-900' :
                  obs.categoria === 'Autoridad' ? 'bg-purple-100 text-purple-900' :
                  obs.categoria === 'Sobrecarga' ? 'bg-rose-100 text-rose-900' :
                  obs.categoria === 'Dependencia' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {obs.categoria}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{obs.id}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {obs.titulo}
              </h3>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Elemento Detectado:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{obs.elemento_detectado}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Diagnóstico / Motivo:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{obs.motivo}</p>
                </div>
              </div>

              {/* Pregunta sugerida para resolverlo (Requerimiento 15 estricto) */}
              <div className="p-3.5 rounded-lg bg-orange-50/50 border border-orange-200/80 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-[#191919] font-bold text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F6911E]" />
                  <span>Pregunta Guía para el Equipo:</span>
                </div>
                <p className="text-[#191919] font-editorial text-sm leading-relaxed mt-0.5">
                  "{obs.pregunta_sugerida}"
                </p>
              </div>

              {/* Registros relacionados */}
              {obs.registros_relacionados.length > 0 && (
                <div className="text-[11px] text-slate-400 flex items-center space-x-2 pt-1">
                  <span>Registros:</span>
                  <div className="flex flex-wrap gap-1">
                    {obs.registros_relacionados.map((ref, idx) => (
                      <span key={idx} className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Hipótesis para resolución</span>
              <Link
                href="/validar"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>Ir al Modo Validación</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
