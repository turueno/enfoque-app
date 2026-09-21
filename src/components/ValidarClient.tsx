'use client';

import React, { useState } from 'react';
import { Frente, Responsabilidad, Resultado, Decision, Interfaz, Persona } from '@/lib/types';
import { useUser } from './UserContext';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  X,
  Edit3,
  Shield,
  Layers,
  GitCommit,
  ArrowLeftRight,
  Target
} from 'lucide-react';

interface ValidarClientProps {
  frentes: (Frente & { owner_nombre: string | null })[];
  responsabilidades: Responsabilidad[];
  resultados: (Resultado & { frente_nombre: string; owner_nombre: string | null })[];
  decisiones: (Decision & { frente_nombre: string; decisor_nombre: string | null })[];
  interfaces: Interfaz[];
  personas: Persona[];
}

export default function ValidarClient({
  frentes: initialFrentes,
  responsabilidades: initialResps,
  resultados: initialResultados,
  decisiones: initialDecisiones,
  interfaces: initialInterfaces,
  personas,
}: ValidarClientProps) {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<'owners' | 'responsabilidades' | 'resultados' | 'decisiones' | 'interfaces'>('owners');

  const [frentes, setFrentes] = useState(initialFrentes);
  const [responsabilidades, setResponsabilidades] = useState(initialResps);
  const [resultados, setResultados] = useState(initialResultados);
  const [decisiones, setDecisiones] = useState(initialDecisiones);
  const [interfaces, setInterfaces] = useState(initialInterfaces);

  const [savingId, setSavingId] = useState<string | null>(null);

  // Counters
  const pendingOwners = frentes.filter(f => f.estado_validacion === 'POR VALIDAR');
  const pendingResps = responsabilidades.filter(r => r.estado_validacion === 'POR VALIDAR');
  const pendingResultados = resultados.filter(res => res.estado_validacion === 'POR VALIDAR');
  const pendingDecisiones = decisiones.filter(d => d.estado_validacion === 'POR VALIDAR');
  const pendingInterfaces = interfaces.filter(i => i.estado_validacion === 'POR VALIDAR');

  const executeValidation = async (
    entidadTipo: string,
    id: string,
    accion: 'APROBADO' | 'RECHAZADO' | 'MODIFICADO' | 'PENDIENTE',
    cambios: any = {},
    comentario = ''
  ) => {
    setSavingId(id);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entidadTipo,
          id,
          accion,
          usuario: currentUser.nombre,
          comentario,
          cambios
        })
      });
      const data = await res.json();
      if (data.success) {
        if (entidadTipo === 'frente') {
          setFrentes(prev => prev.map(f => f.id === id ? { ...f, estado_validacion: data.estado, ...cambios } : f));
        } else if (entidadTipo === 'responsabilidad') {
          setResponsabilidades(prev => prev.map(r => r.id === id ? { ...r, estado_validacion: data.estado, ...cambios } : r));
        } else if (entidadTipo === 'resultado') {
          setResultados(prev => prev.map(r => r.id === id ? { ...r, estado_validacion: data.estado, ...cambios } : r));
        } else if (entidadTipo === 'decision') {
          setDecisiones(prev => prev.map(d => d.id === id ? { ...d, estado_validacion: data.estado, ...cambios } : d));
        } else if (entidadTipo === 'interfaz') {
          setInterfaces(prev => prev.map(i => i.id === id ? { ...i, estado_validacion: data.estado, ...cambios } : i));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs (Requirement 13: 1. Owners, 2. Responsabilidades, 3. Resultados, 4. Decisiones, 5. Interfaces) */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('owners')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'owners' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>1. Owners de Procesos ({pendingOwners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responsabilidades')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'responsabilidades' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Responsabilidades ({pendingResps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resultados')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'resultados' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>3. Resultados ({pendingResultados.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisiones')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'decisiones' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>4. Decisiones ({pendingDecisiones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interfaces')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'interfaces' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>5. Interfaces ({pendingInterfaces.length})</span>
        </button>
      </div>

      {/* 1. TAB: OWNERS */}
      {activeTab === 'owners' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
            Valida o ajusta el Owner único para cada uno de los 7 procesos organizacionales.
          </div>

          <div className="space-y-4">
            {frentes.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {f.id}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{f.nombre_corto}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    f.estado_validacion === 'APROBADO' ? 'bg-emerald-50 text-emerald-700' :
                    f.estado_validacion === 'REQUIERE REVISIÓN' ? 'bg-amber-100 text-amber-800' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {f.estado_validacion}
                  </span>
                </div>

                {/* 3 Capas: Original / Propuesto / Validado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Capa 1: Original Excel</span>
                    <p className="text-slate-600 mt-1">{f.nombre_original.replace(/\n/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Capa 2: Propuesto</span>
                    <p className="text-slate-800 font-medium mt-1">Owner: {f.owner_nombre || 'Por validar'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">Capa 3: Validado</span>
                    <select
                      defaultValue={f.owner_id_validado || f.owner_id_propuesto || ''}
                      id={`owner-select-${f.id}`}
                      className="mt-1 w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    >
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`owner-select-${f.id}`) as HTMLSelectElement)?.value;
                      executeValidation('frente', f.id, 'RECHAZADO', { owner_id: sel }, 'Requiere revisión de dirección');
                    }}
                    disabled={savingId === f.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    Marcar Revisión
                  </button>

                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`owner-select-${f.id}`) as HTMLSelectElement)?.value;
                      executeValidation('frente', f.id, 'APROBADO', { owner_id: sel }, 'Owner ratificado');
                    }}
                    disabled={savingId === f.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === f.id ? 'Guardando...' : 'Aprobar Owner'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TAB: RESPONSABILIDADES */}
      {activeTab === 'responsabilidades' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-900 flex justify-between items-center">
            <span>Revisión de 118 responsabilidades. Preserva íntegro el texto original y califica el rol ENFOQUE.</span>
            <span className="font-semibold">{pendingResps.length} pendientes</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {responsabilidades.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {r.id}
                    </span>
                    <span className="font-bold text-slate-800">{r.persona_nombre}</span>
                    <span className="text-slate-400">en</span>
                    <span className="font-semibold text-blue-900">{r.frente_nombre}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    r.estado_validacion === 'APROBADO' ? 'bg-emerald-50 text-emerald-700' :
                    r.estado_validacion === 'REQUIERE REVISIÓN' ? 'bg-amber-100 text-amber-800' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {r.estado_validacion}
                  </span>
                </div>

                {/* Texto original inmutable */}
                <div className="p-3.5 bg-slate-50 rounded-lg space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                    Texto Original ({r.celda_origen || 'Excel'}):
                  </span>
                  <p className="text-slate-900 font-editorial text-base leading-relaxed">
                    "{r.responsabilidad_original}"
                  </p>
                </div>

                {/* Rol Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <span className="text-slate-400 font-semibold block">Rol Propuesto:</span>
                    <span className="font-mono font-medium text-slate-700">{r.rol_propuesto}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-semibold block">Rol Validado Final:</span>
                    <select
                      defaultValue={r.rol_validado || r.rol_propuesto || 'Ejecuta'}
                      id={`resp-role-${r.id}`}
                      className="mt-0.5 w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 font-medium"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Decide">Decide</option>
                      <option value="Ejecuta">Ejecuta</option>
                      <option value="Contribuye">Contribuye</option>
                      <option value="Informado">Informado</option>
                      <option value="Owner / Ejecuta">Owner / Ejecuta</option>
                      <option value="Decide / Ejecuta">Decide / Ejecuta</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`resp-role-${r.id}`) as HTMLSelectElement)?.value;
                      executeValidation('responsabilidad', r.id, 'RECHAZADO', { rol_validado: sel }, 'Requiere reformular');
                    }}
                    disabled={savingId === r.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    Requiere Revisión
                  </button>

                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`resp-role-${r.id}`) as HTMLSelectElement)?.value;
                      executeValidation('responsabilidad', r.id, 'APROBADO', { rol_validado: sel }, 'Validado');
                    }}
                    disabled={savingId === r.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === r.id ? 'Guardando...' : 'Aprobar Responsabilidad'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB: RESULTADOS */}
      {activeTab === 'resultados' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {resultados.map((res) => (
              <div key={res.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                    {res.id} · {res.frente_nombre}
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    {res.estado_validacion}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Resultado Propuesto:</span>
                  <p className="text-slate-900 font-bold text-sm">{res.resultado_propuesto}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Indicador Validado:</label>
                    <input
                      type="text"
                      defaultValue={res.indicador_validado || res.indicador_sugerido || ''}
                      id={`res-ind-${res.id}`}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Estado del Resultado:</label>
                    <select
                      defaultValue={res.estado}
                      id={`res-estado-${res.id}`}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="Bien">Bien</option>
                      <option value="Atención">Atención</option>
                      <option value="Crítico">Crítico</option>
                      <option value="Sin información">Sin información</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const ind = (document.getElementById(`res-ind-${res.id}`) as HTMLInputElement)?.value;
                      const est = (document.getElementById(`res-estado-${res.id}`) as HTMLSelectElement)?.value;
                      executeValidation('resultado', res.id, 'APROBADO', { indicador_validado: ind, estado: est });
                    }}
                    disabled={savingId === res.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === res.id ? 'Guardando...' : 'Aprobar Resultado'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB: DECISIONES */}
      {activeTab === 'decisiones' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {decisiones.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    {d.id} · {d.frente_nombre}
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    {d.estado_validacion}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Decisión:</span>
                  <p className="text-slate-900 font-bold text-sm mt-0.5">{d.decision}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Decisor Final Único:</label>
                    <select
                      defaultValue={d.decisor_validado_id || d.decisor_propuesto_id || ''}
                      id={`dec-select-${d.id}`}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Consultar a:</label>
                    <input
                      type="text"
                      defaultValue={d.consultar_a_validado || d.consultar_a_propuesto || ''}
                      id={`dec-consult-${d.id}`}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const decId = (document.getElementById(`dec-select-${d.id}`) as HTMLSelectElement)?.value;
                      const con = (document.getElementById(`dec-consult-${d.id}`) as HTMLInputElement)?.value;
                      executeValidation('decision', d.id, 'APROBADO', { decisor_validado_id: decId, consultar_a_validado: con });
                    }}
                    disabled={savingId === d.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === d.id ? 'Guardando...' : 'Aprobar Autoridad de Decisión'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: INTERFACES */}
      {activeTab === 'interfaces' && (
        <div className="space-y-4">
          <div className="space-y-4">
            {interfaces.map((i) => (
              <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    {i.id}
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    {i.estado_validacion}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Flujo de Dependencia:</span>
                  <p className="text-slate-900 font-bold text-sm mt-0.5">
                    {i.de_persona_nombre} ➔ {i.hacia_persona_nombre}
                  </p>
                  <p className="text-slate-700 mt-1"><strong className="text-slate-600">Input:</strong> {i.entrega_input}</p>
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Output formal de retorno:</label>
                  <textarea
                    defaultValue={i.devuelve_output || ''}
                    id={`int-output-${i.id}`}
                    rows={2}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    placeholder="Entregable de confirmación que cierra el ciclo..."
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const out = (document.getElementById(`int-output-${i.id}`) as HTMLTextAreaElement)?.value;
                      executeValidation('interfaz', i.id, 'APROBADO', { devuelve_output: out });
                    }}
                    disabled={savingId === i.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === i.id ? 'Guardando...' : 'Aprobar Interfaz'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
