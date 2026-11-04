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
  Target,
  Plus
} from 'lucide-react';

interface ValidarClientProps {
  frentes: (Frente & { owner_nombre: string | null })[];
  responsabilidades: Responsabilidad[];
  resultados: (Resultado & { frente_nombre: string; owner_nombre: string | null })[];
  decisiones: (Decision & { frente_nombre: string; decisor_nombre: string | null })[];
  interfaces: Interfaz[];
  personas: Persona[];
  textosMap?: Record<string, string>;
}

export default function ValidarClient({
  frentes: initialFrentes,
  responsabilidades: initialResps,
  resultados: initialResultados,
  decisiones: initialDecisiones,
  interfaces: initialInterfaces,
  personas,
  textosMap = {},
}: ValidarClientProps) {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<'owners' | 'responsabilidades' | 'resultados' | 'decisiones' | 'interfaces'>('owners');

  const [frentes, setFrentes] = useState(initialFrentes);
  const [responsabilidades, setResponsabilidades] = useState(initialResps);
  const [resultados, setResultados] = useState(initialResultados);
  const [decisiones, setDecisiones] = useState(initialDecisiones);
  const [interfaces, setInterfaces] = useState(initialInterfaces);

  const [savingId, setSavingId] = useState<string | null>(null);

  // Modal para agregar Responsabilidad
  const [showNewRespModal, setShowNewRespModal] = useState(false);
  const [newRespFrenteId, setNewRespFrenteId] = useState(frentes[0]?.id || 'F01');
  const [newRespPersonaId, setNewRespPersonaId] = useState(personas[0]?.id || 'P01');
  const [newRespTexto, setNewRespTexto] = useState('');
  const [newRespRol, setNewRespRol] = useState('Ejecuta');
  const [newRespComentario, setNewRespComentario] = useState('');
  const [savingNewResp, setSavingNewResp] = useState(false);
  const [respErrorMsg, setRespErrorMsg] = useState<string | null>(null);

  // Modal para agregar Relación (Interfaz)
  const [showNewIntModal, setShowNewIntModal] = useState(false);
  const [newIntDeId, setNewIntDeId] = useState(personas[0]?.id || 'P01');
  const [newIntHaciaId, setNewIntHaciaId] = useState(personas[1]?.id || 'P02');
  const [newIntEntrega, setNewIntEntrega] = useState('');
  const [newIntDevuelve, setNewIntDevuelve] = useState('');
  const [newIntFrenteId, setNewIntFrenteId] = useState(frentes[0]?.id || 'F01');
  const [savingNewInt, setSavingNewInt] = useState(false);
  const [intErrorMsg, setIntErrorMsg] = useState<string | null>(null);

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
          setFrentes(prev => prev.map(f => f.id === id ? { ...f, estado_validacion: data.estado, comentario_validacion: comentario, ...cambios } : f));
        } else if (entidadTipo === 'responsabilidad') {
          setResponsabilidades(prev => prev.map(r => r.id === id ? { ...r, estado_validacion: data.estado, comentario_validacion: comentario, ...cambios } : r));
        } else if (entidadTipo === 'resultado') {
          setResultados(prev => prev.map(r => r.id === id ? { ...r, estado_validacion: data.estado, comentario_validacion: comentario, ...cambios } : r));
        } else if (entidadTipo === 'decision') {
          setDecisiones(prev => prev.map(d => d.id === id ? { ...d, estado_validacion: data.estado, comentario_validacion: comentario, ...cambios } : d));
        } else if (entidadTipo === 'interfaz') {
          setInterfaces(prev => prev.map(i => i.id === id ? { ...i, estado_validacion: data.estado, comentario_validacion: comentario, ...cambios } : i));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateResponsabilidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespTexto.trim()) {
      setRespErrorMsg('La descripción de la responsabilidad es obligatoria.');
      return;
    }

    setSavingNewResp(true);
    setRespErrorMsg(null);

    try {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'responsabilidad',
          usuario: currentUser.nombre,
          data: {
            frente_id: newRespFrenteId,
            persona_id: newRespPersonaId,
            responsabilidad: newRespTexto.trim(),
            rol: newRespRol,
            estado_validacion: 'POR VALIDAR',
            celda_origen: 'Ingreso manual (Validar)',
            comentario: newRespComentario.trim() || null
          }
        })
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'Error al crear responsabilidad');
      }

      const pObj = personas.find(p => p.id === newRespPersonaId);
      const fObj = frentes.find(f => f.id === newRespFrenteId);

      const nuevaResp: Responsabilidad = {
        id: resJson.id,
        frente_id: newRespFrenteId,
        persona_id: newRespPersonaId,
        responsabilidad_original: newRespTexto.trim(),
        rol_propuesto: newRespRol,
        rol_validado: null,
        estado_revision: 'Propuesto por colaborador',
        estado_validacion: 'POR VALIDAR',
        celda_origen: 'Ingreso manual (Validar)',
        comentario_propuesta: newRespComentario.trim() || null,
        validado_por: null,
        fecha_validacion: null,
        comentario_validacion: null,
        persona_nombre: pObj?.nombre,
        frente_nombre: fObj?.nombre_corto
      };

      setResponsabilidades(prev => [nuevaResp, ...prev]);
      setShowNewRespModal(false);
      setNewRespTexto('');
      setNewRespComentario('');
    } catch (err: any) {
      setRespErrorMsg(err.message || 'Error al guardar la responsabilidad');
    } finally {
      setSavingNewResp(false);
    }
  };

  const handleCreateInterfaz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntEntrega.trim()) {
      setIntErrorMsg('El entregable / input es obligatorio.');
      return;
    }

    if (newIntDeId === newIntHaciaId) {
      setIntErrorMsg('La persona que entrega y la que recibe deben ser distintas.');
      return;
    }

    setSavingNewInt(true);
    setIntErrorMsg(null);

    const deObj = personas.find(p => p.id === newIntDeId);
    const haciaObj = personas.find(p => p.id === newIntHaciaId);

    try {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'interfaz',
          usuario: currentUser.nombre,
          data: {
            de_id: newIntDeId,
            de_nombre: deObj?.nombre || newIntDeId,
            hacia_id: newIntHaciaId,
            hacia_nombre: haciaObj?.nombre || newIntHaciaId,
            entrega: newIntEntrega.trim(),
            devuelve: newIntDevuelve.trim() || null,
            frentes: newIntFrenteId,
            estado_validacion: 'POR VALIDAR',
            estado: newIntDevuelve.trim() ? 'Operativa' : 'Por definir'
          }
        })
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'Error al registrar relación');
      }

      const nuevaInt: Interfaz = {
        id: resJson.id,
        de_persona_id: newIntDeId,
        de_persona_nombre: deObj?.nombre || newIntDeId,
        hacia_persona_id: newIntHaciaId,
        hacia_persona_nombre: haciaObj?.nombre || newIntHaciaId,
        entrega_input: newIntEntrega.trim(),
        devuelve_output: newIntDevuelve.trim() || null,
        frentes_relacionados: newIntFrenteId,
        frecuencia: null,
        condicion_activacion: null,
        problema_actual: null,
        estado: newIntDevuelve.trim() ? 'Operativa' : 'Por definir',
        estado_definicion: 'Definido',
        estado_validacion: 'POR VALIDAR',
        validado_por: null,
        fecha_validacion: null,
        comentario_validacion: null
      };

      setInterfaces(prev => [nuevaInt, ...prev]);
      setShowNewIntModal(false);
      setNewIntEntrega('');
      setNewIntDevuelve('');
    } catch (err: any) {
      setIntErrorMsg(err.message || 'Error al guardar la relación');
    } finally {
      setSavingNewInt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('owners')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'owners' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{textosMap['validar.tab.owners'] || '1. Owners de Procesos'} ({pendingOwners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responsabilidades')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'responsabilidades' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{textosMap['validar.tab.responsabilidades'] || '2. Responsabilidades'} ({pendingResps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resultados')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'resultados' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{textosMap['validar.tab.resultados'] || '3. Resultados'} ({pendingResultados.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisiones')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'decisiones' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>{textosMap['validar.tab.decisiones'] || '4. Decisiones'} ({pendingDecisiones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interfaces')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'interfaces' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{textosMap['validar.tab.interfaces'] || '5. Relaciones'} ({pendingInterfaces.length})</span>
        </button>
      </div>

      {/* 1. TAB: OWNERS */}
      {activeTab === 'owners' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
            {textosMap['validar.banner.owners'] || 'Valida o ajusta el Owner único para cada uno de los 7 procesos organizacionales.'}
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

                {/* Comentarios de Validación */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-slate-600 font-semibold block mb-1 text-[10px] uppercase">Comentarios / Justificación:</label>
                  <input
                    type="text"
                    id={`frente-comentario-${f.id}`}
                    defaultValue={f.comentario_validacion || ''}
                    placeholder="Notas sobre esta validación..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`owner-select-${f.id}`) as HTMLSelectElement)?.value;
                      const com = (document.getElementById(`frente-comentario-${f.id}`) as HTMLInputElement)?.value;
                      executeValidation('frente', f.id, 'RECHAZADO', { owner_id: sel }, com || 'Requiere revisión de dirección');
                    }}
                    disabled={savingId === f.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    {textosMap['validar.btn.rechazar'] || 'Marcar Revisión'}
                  </button>

                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`owner-select-${f.id}`) as HTMLSelectElement)?.value;
                      const com = (document.getElementById(`frente-comentario-${f.id}`) as HTMLInputElement)?.value;
                      executeValidation('frente', f.id, 'APROBADO', { owner_id: sel }, com || 'Owner ratificado');
                    }}
                    disabled={savingId === f.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === f.id ? 'Guardando...' : (textosMap['validar.btn.aprobar_owner'] || 'Aprobar Owner')}
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
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span>{textosMap['validar.banner.responsabilidades'] || 'Revisión de responsabilidades. Preserva íntegro el texto original y califica el rol ENFOQUE.'}</span>
              <span className="font-semibold block text-purple-800">{pendingResps.length} pendientes por validar</span>
            </div>
            <button
              onClick={() => {
                setRespErrorMsg(null);
                setShowNewRespModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#191919] hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#F6911E]" />
              <span>Nueva Responsabilidad</span>
            </button>
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

                {/* Comentarios de Validación */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-slate-600 font-semibold block mb-1 text-[10px] uppercase">Comentarios / Justificación:</label>
                  <input
                    type="text"
                    id={`resp-comentario-${r.id}`}
                    defaultValue={r.comentario_validacion || ''}
                    placeholder="Notas sobre esta validación..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`resp-role-${r.id}`) as HTMLSelectElement)?.value;
                      const com = (document.getElementById(`resp-comentario-${r.id}`) as HTMLInputElement)?.value;
                      executeValidation('responsabilidad', r.id, 'RECHAZADO', { rol_validado: sel }, com || 'Requiere reformular');
                    }}
                    disabled={savingId === r.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    {textosMap['validar.btn.rechazar'] || 'Requiere Revisión'}
                  </button>

                  <button
                    onClick={() => {
                      const sel = (document.getElementById(`resp-role-${r.id}`) as HTMLSelectElement)?.value;
                      const com = (document.getElementById(`resp-comentario-${r.id}`) as HTMLInputElement)?.value;
                      executeValidation('responsabilidad', r.id, 'APROBADO', { rol_validado: sel }, com || 'Validado');
                    }}
                    disabled={savingId === r.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === r.id ? 'Guardando...' : (textosMap['validar.btn.aprobar_resp'] || 'Aprobar Responsabilidad')}
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

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-slate-600 font-semibold block mb-1 text-[10px] uppercase">Comentarios / Justificación:</label>
                  <input
                    type="text"
                    id={`res-comentario-${res.id}`}
                    defaultValue={res.comentario_validacion || ''}
                    placeholder="Notas sobre esta validación..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const ind = (document.getElementById(`res-ind-${res.id}`) as HTMLInputElement)?.value;
                      const est = (document.getElementById(`res-estado-${res.id}`) as HTMLSelectElement)?.value;
                      const com = (document.getElementById(`res-comentario-${res.id}`) as HTMLInputElement)?.value;
                      executeValidation('resultado', res.id, 'RECHAZADO', { indicador_validado: ind, estado: est }, com || 'Requiere revisión');
                    }}
                    disabled={savingId === res.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    {textosMap['validar.btn.rechazar'] || 'Marcar Revisión'}
                  </button>

                  <button
                    onClick={() => {
                      const ind = (document.getElementById(`res-ind-${res.id}`) as HTMLInputElement)?.value;
                      const est = (document.getElementById(`res-estado-${res.id}`) as HTMLSelectElement)?.value;
                      const com = (document.getElementById(`res-comentario-${res.id}`) as HTMLInputElement)?.value;
                      executeValidation('resultado', res.id, 'APROBADO', { indicador_validado: ind, estado: est }, com || 'Validado');
                    }}
                    disabled={savingId === res.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === res.id ? 'Guardando...' : (textosMap['validar.btn.aprobar_resultado'] || 'Aprobar Resultado')}
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

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-slate-600 font-semibold block mb-1 text-[10px] uppercase">Comentarios / Justificación:</label>
                  <input
                    type="text"
                    id={`dec-comentario-${d.id}`}
                    defaultValue={d.comentario_validacion || ''}
                    placeholder="Notas sobre esta validación..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const decId = (document.getElementById(`dec-select-${d.id}`) as HTMLSelectElement)?.value;
                      const con = (document.getElementById(`dec-consult-${d.id}`) as HTMLInputElement)?.value;
                      const com = (document.getElementById(`dec-comentario-${d.id}`) as HTMLInputElement)?.value;
                      executeValidation('decision', d.id, 'RECHAZADO', { decisor_validado_id: decId, consultar_a_validado: con }, com || 'Requiere revisión');
                    }}
                    disabled={savingId === d.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    {textosMap['validar.btn.rechazar'] || 'Marcar Revisión'}
                  </button>

                  <button
                    onClick={() => {
                      const decId = (document.getElementById(`dec-select-${d.id}`) as HTMLSelectElement)?.value;
                      const con = (document.getElementById(`dec-consult-${d.id}`) as HTMLInputElement)?.value;
                      const com = (document.getElementById(`dec-comentario-${d.id}`) as HTMLInputElement)?.value;
                      executeValidation('decision', d.id, 'APROBADO', { decisor_validado_id: decId, consultar_a_validado: con }, com || 'Validado');
                    }}
                    disabled={savingId === d.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === d.id ? 'Guardando...' : (textosMap['validar.btn.aprobar_decision'] || 'Aprobar Autoridad de Decisión')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: INTERFACES / RELACIONES */}
      {activeTab === 'interfaces' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span>Relaciones operativas de entrega y devolución mutua. Revisa los flujos pendientes o añade nuevos contratos de entrega.</span>
              <span className="font-semibold block text-blue-800">{pendingInterfaces.length} pendientes por validar</span>
            </div>
            <button
              onClick={() => {
                setIntErrorMsg(null);
                setShowNewIntModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#191919] hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#F6911E]" />
              <span>Nueva Relación</span>
            </button>
          </div>
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

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-slate-600 font-semibold block mb-1 text-[10px] uppercase">Comentarios / Justificación:</label>
                  <input
                    type="text"
                    id={`int-comentario-${i.id}`}
                    defaultValue={i.comentario_validacion || ''}
                    placeholder="Notas sobre esta validación..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const out = (document.getElementById(`int-output-${i.id}`) as HTMLTextAreaElement)?.value;
                      const com = (document.getElementById(`int-comentario-${i.id}`) as HTMLInputElement)?.value;
                      executeValidation('interfaz', i.id, 'RECHAZADO', { devuelve_output: out }, com || 'Requiere revisión');
                    }}
                    disabled={savingId === i.id}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    {textosMap['validar.btn.rechazar'] || 'Marcar Revisión'}
                  </button>

                  <button
                    onClick={() => {
                      const out = (document.getElementById(`int-output-${i.id}`) as HTMLTextAreaElement)?.value;
                      const com = (document.getElementById(`int-comentario-${i.id}`) as HTMLInputElement)?.value;
                      executeValidation('interfaz', i.id, 'APROBADO', { devuelve_output: out }, com || 'Validado');
                    }}
                    disabled={savingId === i.id}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                  >
                    {savingId === i.id ? 'Guardando...' : (textosMap['validar.btn.aprobar_interfaz'] || 'Aprobar Relación')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* MODAL: NUEVA RESPONSABILIDAD */}
      {showNewRespModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#191919] text-[#F6911E] rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Nueva Responsabilidad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewRespModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {respErrorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {respErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreateResponsabilidad} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proceso de Trabajo <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRespFrenteId}
                    onChange={e => setNewRespFrenteId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    {frentes.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.id}: {f.nombre_corto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Persona Asignada <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRespPersonaId}
                    onChange={e => setNewRespPersonaId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción de la Responsabilidad <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Liderar el diseño y calibración metodológica de las guías de investigación..."
                  value={newRespTexto}
                  onChange={e => setNewRespTexto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F6911E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rol Propuesto (Taxonomía ENFOQUE) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newRespRol}
                  onChange={e => setNewRespRol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                >
                  <option value="Owner / Ejecuta">Owner / Ejecuta</option>
                  <option value="Ejecuta">Ejecuta</option>
                  <option value="Decide">Decide</option>
                  <option value="Decide / Ejecuta">Decide / Ejecuta</option>
                  <option value="Contribuye">Contribuye</option>
                  <option value="Informado">Informado</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justificación / Comentario de Propuesta (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Necesario para asegurar control de calidad en campo..."
                  value={newRespComentario}
                  onChange={e => setNewRespComentario(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRespModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNewResp}
                  className="px-4 py-2 rounded-xl bg-[#191919] hover:bg-[#F6911E] hover:text-[#191919] text-white font-bold transition-all disabled:opacity-50"
                >
                  {savingNewResp ? 'Guardando...' : 'Registrar Responsabilidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA RELACIÓN (INTERFAZ) */}
      {showNewIntModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#191919] text-[#F6911E] rounded-lg">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Nueva Relación / Interfaz</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewIntModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {intErrorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {intErrorMsg}
              </div>
            )}

            <form onSubmit={handleCreateInterfaz} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Persona que Entrega (De) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newIntDeId}
                    onChange={e => setNewIntDeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Persona que Recibe (Hacia) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newIntHaciaId}
                    onChange={e => setNewIntHaciaId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proceso Principal Vinculado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newIntFrenteId}
                  onChange={e => setNewIntFrenteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                >
                  {frentes.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.id}: {f.nombre_corto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entregable / Input <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Qué entrega formalmente la primera persona a la segunda (ej: Brief técnico completo con cuotas)..."
                  value={newIntEntrega}
                  onChange={e => setNewIntEntrega(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F6911E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Output de Retorno / Devolución Requerida (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Qué devuelve o confirma la segunda persona para cerrar el ciclo (ej: Matriz de factibilidad y costeo aprobado)..."
                  value={newIntDevuelve}
                  onChange={e => setNewIntDevuelve(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#F6911E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewIntModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNewInt}
                  className="px-4 py-2 rounded-xl bg-[#191919] hover:bg-[#F6911E] hover:text-[#191919] text-white font-bold transition-all disabled:opacity-50"
                >
                  {savingNewInt ? 'Guardando...' : 'Registrar Relación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
