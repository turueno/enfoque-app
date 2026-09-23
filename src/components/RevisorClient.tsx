'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AIReviewObservation } from '@/lib/types';
import { Sparkles, HelpCircle, RefreshCw, ArrowRight, ShieldCheck, Cpu, AlertTriangle } from 'lucide-react';
import { reanalizarAction } from '@/app/revisor/actions';

interface RevisorClientProps {
  initialObservations: AIReviewObservation[];
  initialHasAI?: boolean;
  initialModelUsed?: string;
  initialError?: string;
}

export default function RevisorClient({ 
  initialObservations, 
  initialHasAI = false,
  initialModelUsed,
  initialError 
}: RevisorClientProps) {
  const [observations, setObservations] = useState(initialObservations);
  const [hasAI, setHasAI] = useState(initialHasAI);
  const [modelUsed, setModelUsed] = useState(initialModelUsed);
  const [apiError, setApiError] = useState<string | null>(initialError || null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [analyzing, setAnalyzing] = useState(false);

  const categories = ['ALL', 'Ambigüedad', 'Autoridad', 'Dependencia', 'Sobrecarga', 'Métricas'];

  const filtered = observations.filter(obs => {
    if (activeFilter !== 'ALL' && obs.categoria !== activeFilter) return false;
    return true;
  });

  const handleRefresh = async () => {
    setAnalyzing(true);
    setApiError(null);
    try {
      // 1. Intentar Server Action directa en el servidor
      const data = await reanalizarAction();
      if (data && data.success && data.observations) {
        setObservations(data.observations);
        setHasAI(Boolean(data.hasAI));
        if (data.modelUsed) setModelUsed(data.modelUsed);
        if (data.error) setApiError(data.error);
        return;
      }
    } catch (actionErr) {
      console.warn('Server action falló, probando API route:', actionErr);
      try {
        const res = await fetch('/api/revisor/analizar');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.observations) {
            setObservations(data.observations);
            setHasAI(Boolean(data.hasAI));
            if (data.modelUsed) setModelUsed(data.modelUsed);
            if (data.error) setApiError(data.error);
          }
        } else {
          setApiError(`Error del servidor (${res.status}): No se pudo completar el re-análisis.`);
        }
      } catch (fetchErr) {
        setApiError('Error de conexión al re-analizar. Por favor intenta de nuevo.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Trigger */}
      <div className="bg-[#191919] rounded-2xl p-6 text-white shadow-md border-l-4 border-[#F6911E] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 text-[#FFAA34] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#F6911E]" />
              <span>Inteligencia Organizacional Anclada</span>
            </span>
            {hasAI ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>{modelUsed ? `Gemini Activo (${modelUsed})` : 'Gemini Activo (Grounded)'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
                <ShieldCheck className="w-3 h-3 text-slate-400" />
                <span>Motor Heurístico Determinista</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            La IA interpreta tensiones y formula hipótesis; el equipo decide la gobernanza.
          </h2>
          <p className="text-xs text-slate-300 font-editorial leading-relaxed">
            {hasAI 
              ? 'Análisis en 2 capas: los hechos se calculan con reglas exactas de base de datos y la IA generativa de Google analiza la tensión operativa, riesgos y formula la pregunta clave para el comité directivo.'
              : 'Detección exacta mediante reglas heurísticas directas de base de datos. Para habilitar la interpretación contextual profunda de Gemini, añade tu GEMINI_API_KEY.'}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={analyzing}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors shadow-sm self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analizando con IA...' : 'Re-analizar Diagnóstico'}</span>
        </button>
      </div>

      {/* Alerta de diagnóstico en caso de incidencia con la API de Gemini */}
      {apiError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950">Aviso del Asistente Gemini:</span>
              <p className="text-amber-800 leading-relaxed font-mono text-[11px]">{apiError}</p>
              <p className="text-amber-700 text-[11px]">
                Mientras tanto, la plataforma muestra las observaciones exactas generadas por el motor analítico determinista.
              </p>
            </div>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-amber-600 hover:text-amber-900 font-bold px-2 py-0.5 text-xs rounded hover:bg-amber-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

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
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    obs.categoria === 'Ambigüedad' ? 'bg-amber-100 text-amber-900' :
                    obs.categoria === 'Autoridad' ? 'bg-purple-100 text-purple-900' :
                    obs.categoria === 'Sobrecarga' ? 'bg-rose-100 text-rose-900' :
                    obs.categoria === 'Dependencia' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {obs.categoria}
                  </span>
                  {obs.origen === 'ia_grounded' && (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      <span>Interpretado por IA</span>
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate-400">{obs.id}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {obs.titulo}
              </h3>

              {/* Hecho duro verificado */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hecho Detectado (Base de Datos):</span>
                  <p className="text-slate-800 font-medium mt-0.5">{obs.elemento_detectado}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Motivo Estructural:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{obs.motivo}</p>
                </div>
              </div>

              {/* Interpretación de IA (cuando está enriquecida) */}
              {obs.interpretacion_ia && (
                <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-1 text-purple-900 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>Interpretación de Causa Raíz (IA):</span>
                  </div>
                  <p className="text-purple-950 font-editorial text-xs leading-relaxed">
                    {obs.interpretacion_ia}
                  </p>
                  {obs.impacto_gobernanza && (
                    <div className="pt-1 border-t border-purple-200/50 text-[11px] text-purple-900">
                      <span className="font-bold">Impacto operativo: </span>
                      <span>{obs.impacto_gobernanza}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pregunta sugerida para resolverlo */}
              <div className="p-3.5 rounded-lg bg-orange-50/50 border border-orange-200/80 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-[#191919] font-bold text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F6911E]" />
                  <span>Pregunta Guía para el Comité Directivo:</span>
                </div>
                <p className="text-[#191919] font-editorial text-sm leading-relaxed mt-0.5">
                  "{obs.pregunta_sugerida}"
                </p>
              </div>

              {/* Registros relacionados */}
              {obs.registros_relacionados.length > 0 && (
                <div className="text-[11px] text-slate-400 flex items-center space-x-2 pt-1">
                  <span>Registros vinculados:</span>
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
