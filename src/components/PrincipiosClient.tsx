'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Principio, Frente } from '@/lib/types';
import { useUser } from './UserContext';
import { BookOpen, CheckCircle2, Sparkles, Layers } from 'lucide-react';

interface PrincipiosClientProps {
  principios: Principio[];
  frentes: (Frente & { owner_nombre: string | null })[];
  frentePrincipios: { frente_id: string; principio_id: string; aplicacion: string }[];
}

export default function PrincipiosClient({
  principios,
  frentes,
  frentePrincipios: initialFP,
}: PrincipiosClientProps) {
  const { currentUser } = useUser();
  const [fpState, setFpState] = useState(initialFP);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const getAplicacion = (frenteId: string, principioId: string) => {
    const found = fpState.find(x => x.frente_id === frenteId && x.principio_id === principioId);
    return found ? found.aplicacion : 'Aplica';
  };

  const handleUpdate = async (frenteId: string, principioId: string, val: string) => {
    const key = `${frenteId}-${principioId}`;
    setSavingKey(key);
    try {
      const res = await fetch('/api/principios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frente_id: frenteId,
          principio_id: principioId,
          aplicacion: val,
          usuario: currentUser.nombre
        })
      });
      const data = await res.json();
      if (data.success) {
        setFpState(prev => {
          const filtered = prev.filter(x => !(x.frente_id === frenteId && x.principio_id === principioId));
          return [...filtered, { frente_id: frenteId, principio_id: principioId, aplicacion: val }];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* MANIFIESTO ESTRATÉGICO PROVOKERS 3.0 */}
      <div className="bg-gradient-to-br from-[#191919] via-slate-900 to-[#2A2A2A] rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 space-y-6">
        <div className="space-y-2 border-b border-white/10 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFAA34]/20 border border-[#FFAA34]/30 text-[#FFAA34] text-xs font-bold tracking-wide uppercase">
            <span>⚡ Estrategia PHPVKS 3.0</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
            Valor agregado por ser capaces de entender el target de una iniciativa de negocio mejor que nadie
          </h2>
          <p className="text-slate-300 text-sm font-editorial leading-relaxed max-w-4xl">
            Sostenemos una perspectiva propia, casi autoral, que orienta cada proceso de la agencia a través de tres premisas fundamentales:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Premisa 1 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
            <span className="text-[11px] font-mono font-bold uppercase text-[#FFAA34] tracking-wider block">
              01 · A quién entendemos
            </span>
            <h3 className="text-sm font-bold text-white">No existe un consumidor plano</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-editorial">
              Más allá de reducirlo a perfil, NSE o demografía, comprendemos las formas concretas de ser alguien frente a una categoría u oferta. Si cada target posee su propio sentido común, es un <strong>sistema de interpretación en sí mismo</strong>: lee valor, riesgo, deseo y pertenencia bajo tensiones específicas.
            </p>
          </div>

          {/* Premisa 2 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
            <span className="text-[11px] font-mono font-bold uppercase text-[#FFAA34] tracking-wider block">
              02 · Cómo lo entendemos
            </span>
            <h3 className="text-sm font-bold text-white">Práctica interpretativa y crítica</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-editorial">
              El oficio de entender al otro es más humano que técnico. Exige escuchar lo que el dato no dice sin negarlo, subordinándolo al contexto. Investigar es <strong>desobedecer el supuesto</strong> y ejercer una mirada crítica guiada por hipótesis afiladas para revelar el malentendido entre lo que el negocio cree evidente y lo que las personas reconocen como valor.
            </p>
          </div>

          {/* Premisa 3 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
            <span className="text-[11px] font-mono font-bold uppercase text-[#FFAA34] tracking-wider block">
              03 · Desde dónde entendemos
            </span>
            <h3 className="text-sm font-bold text-white">El target como principio de realidad</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-editorial">
              Menos consumidor y más circunstancia: entendemos desde las tensiones, contradicciones y contextos que condicionan sus decisiones. No basta con preguntar qué opina, hay que comprender el mundo desde el que valora y decide. Confrontamos las aspiraciones del negocio con sus propios códigos de sentido.
            </p>
          </div>
        </div>
      </div>

      {/* Criterios Operativos Transversales */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Criterios Operativos Rectores
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Criterios transversales no negociables aplicados al día a día de cada frente de trabajo.
        </p>
      </div>

      {/* 4 Principles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {principios.map((pr) => (
          <div
            key={pr.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#191919] text-[#FFAA34] border border-[#191919]">
                  {pr.id}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 font-mono">
                  {pr.estado}
                </span>
              </div>

              <h2 className="text-base font-bold text-[#191919] leading-snug">
                {pr.principio}
              </h2>

              <div className="p-4 bg-orange-50/30 border border-orange-100/60 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Interpretación Operativa:
                </span>
                <p className="text-slate-900 font-editorial leading-relaxed text-base">
                  "{pr.interpretacion_propuesta}"
                </p>
              </div>

              {pr.texto_original && (
                <div className="text-xs text-slate-600 font-editorial leading-relaxed p-2 bg-slate-50/50 rounded-lg">
                  Texto de origen: "{pr.texto_original}"
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Dónde aplica: </span>
              <span>{pr.donde_aplica}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Matriz de Integración Principios × Procesos */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Matriz de Adopción de Principios por Proceso
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Califica si cada principio: <em>No aplica</em>, <em>Aplica</em>, <em>Tiene oportunidad</em> o <em>Está integrado</em> en los 7 procesos.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 font-bold">Proceso</th>
                {principios.map(pr => (
                  <th key={pr.id} className="p-3 font-bold text-center">
                    <div>{pr.id}</div>
                    <div className="font-normal text-[11px] text-slate-500 truncate max-w-[200px]">{pr.principio}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {frentes.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">
                    <Link href={`/frentes/${f.id}`} className="hover:text-blue-600">
                      {f.id}: {f.nombre_corto}
                    </Link>
                  </td>
                  {principios.map(pr => {
                    const currentVal = getAplicacion(f.id, pr.id);
                    const isSaving = savingKey === `${f.id}-${pr.id}`;
                    return (
                      <td key={pr.id} className="p-3 text-center border-l border-slate-100">
                        <select
                          value={currentVal}
                          onChange={(e) => handleUpdate(f.id, pr.id, e.target.value)}
                          disabled={isSaving}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border focus:outline-none ${
                            currentVal === 'Está integrado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' :
                            currentVal === 'Tiene oportunidad' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            currentVal === 'No aplica' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                            'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          <option value="No aplica">No aplica</option>
                          <option value="Aplica">Aplica</option>
                          <option value="Tiene oportunidad">Tiene oportunidad</option>
                          <option value="Está integrado">Está integrado</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
