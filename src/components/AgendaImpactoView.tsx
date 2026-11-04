'use client';

import React, { useState } from 'react';
import { TemaImpacto, Persona, Frente, Resultado } from '@/lib/types';
import { UserProfile } from './UserContext';
import {
  Zap,
  Plus,
  Clock,
  User,
  Layers,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  GitCommit,
  UserCheck,
  ArrowLeftRight,
  Filter,
  Check,
  X
} from 'lucide-react';

interface AgendaImpactoViewProps {
  temas: TemaImpacto[];
  personas: Persona[];
  frentes: (Frente & { owner_nombre?: string | null })[];
  resultados: (Resultado & { frente_nombre: string; owner_nombre: string | null })[];
  currentUser: UserProfile;
  onRefresh: () => void;
}

export default function AgendaImpactoView({
  temas,
  personas,
  frentes,
  resultados,
  currentUser,
  onRefresh
}: AgendaImpactoViewProps) {
  // Filters
  const [filterHorizonte, setFilterHorizonte] = useState<string>('ALL');
  const [filterEstado, setFilterEstado] = useState<string>('ALL');
  const [filterFrente, setFilterFrente] = useState<string>('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deriveModalOpen, setDeriveModalOpen] = useState(false);
  const [deriveType, setDeriveType] = useState<'decision' | 'responsabilidad' | 'interfaz'>('decision');
  const [selectedTema, setSelectedTema] = useState<TemaImpacto | null>(null);

  // Loading & error
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Tema Form state
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horizonte, setHorizonte] = useState<'30 días' | '60 días' | '90 días' | 'Fin de año' | 'Personalizado'>('90 días');
  const [fechaLimite, setFechaLimite] = useState('');
  const [frenteId, setFrenteId] = useState(frentes[0]?.id || 'F01');
  const [resultadoId, setResultadoId] = useState('');
  const [responsableId, setResponsableId] = useState(currentUser.id || 'P01');
  const [involucradosIds, setInvolucradosIds] = useState<string[]>([]);
  const [prioridad, setPrioridad] = useState<'P1' | 'P2'>('P1');

  // Derive Form state
  const [deriveDecisionTexto, setDeriveDecisionTexto] = useState('');
  const [deriveDecisorId, setDeriveDecisorId] = useState(currentUser.id || 'P01');
  const [deriveConsultarA, setDeriveConsultarA] = useState('');
  const [deriveMomentoTrigger, setDeriveMomentoTrigger] = useState('');

  const [deriveRespTexto, setDeriveRespTexto] = useState('');
  const [deriveRespPersonaId, setDeriveRespPersonaId] = useState(currentUser.id || 'P01');
  const [deriveRespRol, setDeriveRespRol] = useState('Owner / Ejecuta');

  const [deriveIntDePersonaId, setDeriveIntDePersonaId] = useState(currentUser.id || 'P01');
  const [deriveIntHaciaPersonaId, setDeriveIntHaciaPersonaId] = useState(personas[1]?.id || 'P02');
  const [deriveIntEntrega, setDeriveIntEntrega] = useState('');
  const [deriveIntDevuelve, setDeriveIntDevuelve] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filtered Temas
  const filteredTemas = temas.filter(t => {
    if (filterHorizonte !== 'ALL' && t.horizonte_temporal !== filterHorizonte) return false;
    if (filterEstado !== 'ALL' && t.estado !== filterEstado) return false;
    if (filterFrente !== 'ALL' && t.frente_id !== filterFrente) return false;
    return true;
  });

  // KPI Calculations
  const totalActivos = temas.filter(t => t.estado !== 'Resuelto').length;
  const totalBloqueados = temas.filter(t => t.estado === 'Bloqueado').length;
  const totalEnCurso = temas.filter(t => t.estado === 'En curso').length;
  const totalResueltos = temas.filter(t => t.estado === 'Resuelto').length;

  // Handle Create Tema
  const handleCreateTema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/agenda/impacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          usuario: currentUser.nombre,
          data: {
            titulo,
            descripcion,
            horizonte_temporal: horizonte,
            fecha_limite: fechaLimite || null,
            frente_id: frenteId,
            resultado_id: resultadoId || null,
            responsable_id: responsableId,
            involucrados_ids: involucradosIds,
            prioridad
          }
        })
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'Error al crear tema de impacto');
      }

      setCreateModalOpen(false);
      setTitulo('');
      setDescripcion('');
      showToast('⚡ Tema de Impacto creado e integrado a la agenda.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (temaId: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/agenda/impacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          temaId,
          usuario: currentUser.nombre,
          data: { estado: nuevoEstado }
        })
      });

      if (res.ok) {
        showToast(`Estatus actualizado a: ${nuevoEstado}`);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Derive Modal
  const openDerive = (tema: TemaImpacto, type: 'decision' | 'responsabilidad' | 'interfaz') => {
    setSelectedTema(tema);
    setDeriveType(type);
    if (type === 'decision') {
      setDeriveDecisionTexto(`Definir e implementar solución para: ${tema.titulo}`);
      setDeriveDecisorId(tema.responsable_id || currentUser.id || 'P01');
      setDeriveMomentoTrigger(`Antes de cumplir horizonte de ${tema.horizonte_temporal}`);
    } else if (type === 'responsabilidad') {
      setDeriveRespTexto(`Liderar resolución de iniciativa: ${tema.titulo}`);
      setDeriveRespPersonaId(tema.responsable_id || currentUser.id || 'P01');
    } else {
      setDeriveIntDePersonaId(tema.responsable_id || currentUser.id || 'P01');
      setDeriveIntEntrega(`Insumos y avances para resolver ${tema.titulo}`);
      setDeriveIntDevuelve(`Revisión, validación o contra-entrega requerida`);
    }
    setDeriveModalOpen(true);
  };

  // Handle Submit Derive
  const handleSubmitDerive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTema) return;

    setSubmitting(true);
    try {
      let payloadData: any = { tipoEntidad: deriveType, frente_id: selectedTema.frente_id || 'F01' };

      if (deriveType === 'decision') {
        payloadData.decision = deriveDecisionTexto;
        payloadData.decisor_id = deriveDecisorId;
        payloadData.consultar_a = deriveConsultarA;
        payloadData.momento_trigger = deriveMomentoTrigger;
      } else if (deriveType === 'responsabilidad') {
        payloadData.responsabilidad = deriveRespTexto;
        payloadData.persona_id = deriveRespPersonaId;
        payloadData.rol = deriveRespRol;
      } else if (deriveType === 'interfaz') {
        const deP = personas.find(p => p.id === deriveIntDePersonaId);
        const haciaP = personas.find(p => p.id === deriveIntHaciaPersonaId);
        payloadData.de_persona_id = deriveIntDePersonaId;
        payloadData.de_persona_nombre = deP?.nombre || 'Colaborador';
        payloadData.hacia_persona_id = deriveIntHaciaPersonaId;
        payloadData.hacia_persona_nombre = haciaP?.nombre || 'Colaborador';
        payloadData.entrega_input = deriveIntEntrega;
        payloadData.devuelve_output = deriveIntDevuelve;
      }

      const res = await fetch('/api/agenda/impacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'derivar',
          temaId: selectedTema.id,
          usuario: currentUser.nombre,
          data: payloadData
        })
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'Error al derivar entidad');
      }

      setDeriveModalOpen(false);
      showToast(`¡Conexión creada! Nueva ${deriveType} vinculada exitosamente.`);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#191919] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#F6911E]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="p-6 bg-gradient-to-r from-[#191919] via-slate-900 to-[#2b2b2b] rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#F6911E]/20 text-[#FFAA34] text-[11px] font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Horizonte Ejecutivo Acotado</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Impact: Desafíos Urgentes en Períodos Definidos
          </h2>
          <p className="text-xs text-slate-300 font-editorial max-w-2xl leading-relaxed">
            Iniciativas coyunturales y bloqueos clave que deben resolverse a 30, 60, 90 días o antes de fin de año. Cada tema puede abrir directamente nuevas decisiones, responsabilidades y relaciones en la organización.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#F6911E] hover:bg-[#FFAA34] text-[#191919] text-xs font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Tema de Impacto</span>
        </button>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Temas Activos</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalActivos}</span>
            <span className="text-xs text-slate-400">en agenda</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">En Curso</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-amber-800">{totalEnCurso}</span>
            <span className="text-xs text-amber-700">avanzando</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">Bloqueados</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-rose-800">{totalBloqueados}</span>
            <span className="text-xs text-rose-700">foco crítico</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Resueltos</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-800">{totalResueltos}</span>
            <span className="text-xs text-emerald-700">completados</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-600 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtrar:</span>
          </div>

          {/* Horizonte */}
          <select
            value={filterHorizonte}
            onChange={e => setFilterHorizonte(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">Cualquier Horizonte</option>
            <option value="30 días">30 días</option>
            <option value="60 días">60 días</option>
            <option value="90 días">90 días</option>
            <option value="Fin de año">Fin de año</option>
          </select>

          {/* Estado */}
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">Cualquier Estado</option>
            <option value="En curso">En curso</option>
            <option value="Requiere Atención">Requiere Atención</option>
            <option value="Bloqueado">Bloqueado</option>
            <option value="Resuelto">Resuelto</option>
          </select>

          {/* Proceso / Frente */}
          <select
            value={filterFrente}
            onChange={e => setFilterFrente(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">Cualquier Proceso</option>
            {frentes.map(f => (
              <option key={f.id} value={f.id}>
                {f.id}: {f.nombre_corto}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Mostrando {filteredTemas.length} de {temas.length} temas
        </span>
      </div>

      {/* Impact Cards Grid */}
      {filteredTemas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Zap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No hay temas de impacto registrados con este filtro</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Registra una nueva iniciativa urgente de 30, 60, 90 días o antes de fin de año para impulsar la tracción ejecutiva.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#191919] hover:bg-slate-800 text-white text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Primer Tema</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTemas.map(tema => {
            const decIds: string[] = (() => {
              try { return JSON.parse(tema.decisiones_generadas_ids_json || '[]'); } catch { return []; }
            })();
            const respIds: string[] = (() => {
              try { return JSON.parse(tema.responsabilidades_generadas_ids_json || '[]'); } catch { return []; }
            })();
            const intIds: string[] = (() => {
              try { return JSON.parse(tema.interfaces_generadas_ids_json || '[]'); } catch { return []; }
            })();

            const isResolved = tema.estado === 'Resuelto';
            const isBlocked = tema.estado === 'Bloqueado';

            return (
              <div
                key={tema.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                  isBlocked
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isResolved
                    ? 'border-slate-200 opacity-70 bg-slate-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#F6911E]/15 text-[#191919] font-black text-[10px] tracking-wide uppercase">
                        <Zap className="w-3 h-3 text-[#F6911E]" />
                        <span>{tema.horizonte_temporal}</span>
                      </span>

                      {tema.frente_nombre && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {tema.frente_id}: {tema.frente_nombre}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : tema.estado === 'Requiere Atención'
                            ? 'bg-amber-100 text-amber-800'
                            : isResolved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tema.estado}
                      </span>
                    </div>

                    {/* Quick status selector */}
                    <select
                      value={tema.estado}
                      onChange={e => handleStatusChange(tema.id, e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 font-semibold text-slate-600 focus:outline-none"
                    >
                      <option value="En curso">En curso</option>
                      <option value="Requiere Atención">Requiere Atención</option>
                      <option value="Bloqueado">Bloqueado</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{tema.titulo}</h3>
                    {tema.descripcion && (
                      <p className="text-xs text-slate-600 mt-1 font-editorial leading-relaxed">{tema.descripcion}</p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-700 font-semibold">Líder:</strong> {tema.responsable_nombre || 'Sin asignar'}
                      </span>
                    </div>

                    {tema.fecha_limite && (
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Meta: {tema.fecha_limite}</span>
                      </div>
                    )}
                  </div>

                  {/* Connected Entities Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Conexiones:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono ${
                        decIds.length > 0 ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {decIds.length} Decisiones ({decIds.join(', ') || '0'})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono ${
                        respIds.length > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {respIds.length} Responsabilidades ({respIds.join(', ') || '0'})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono ${
                        intIds.length > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {intIds.length} Relaciones ({intIds.join(', ') || '0'})
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar: Derivations */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-150 rounded-b-2xl flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Derivar a gobernanza:</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openDerive(tema, 'decision')}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors shadow-2xs"
                      title="Abrir una decisión en el sistema vinculada a este tema"
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>+ Decisión</span>
                    </button>

                    <button
                      onClick={() => openDerive(tema, 'responsabilidad')}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors shadow-2xs"
                      title="Crear y asignar una nueva responsabilidad operativa"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>+ Responsabilidad</span>
                    </button>

                    <button
                      onClick={() => openDerive(tema, 'interfaz')}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-amber-800 hover:bg-amber-50 text-xs font-bold transition-colors shadow-2xs"
                      title="Crear un acuerdo de entrega e interfaz entre personas"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>+ Relación</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREAR TEMA DE IMPACTO */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#191919] text-[#F6911E] rounded-lg">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Nuevo Tema de Impacto</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTema} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Tema / Iniciativa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rediseñar protocolo de calibración comercial en 60 días"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F6911E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Foco esperado</label>
                <textarea
                  rows={2}
                  placeholder="Explica qué problema crítico resuelve y qué resultado tangible se busca..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F6911E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horizonte Temporal</label>
                  <select
                    value={horizonte}
                    onChange={e => setHorizonte(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="30 días">30 días (Crítico)</option>
                    <option value="60 días">60 días</option>
                    <option value="90 días">90 días (Trimestral)</option>
                    <option value="Fin de año">Antes de Fin de Año</option>
                    <option value="Personalizado">Fecha Personalizada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Límite (Opcional)</label>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={e => setFechaLimite(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proceso Principal</label>
                  <select
                    value={frenteId}
                    onChange={e => setFrenteId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    {frentes.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.id}: {f.nombre_corto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Líder Responsable</label>
                  <select
                    value={responsableId}
                    onChange={e => setResponsableId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resultado / KPI impactado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resultado / KPI Clave (Opcional)</label>
                <select
                  value={resultadoId}
                  onChange={e => setResultadoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="">-- No vincular a un KPI específico --</option>
                  {resultados.map(r => (
                    <option key={r.id} value={r.id}>
                      [{r.frente_nombre}] {r.resultado_validado || r.resultado_propuesto} {r.meta ? `(Meta: ${r.meta})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#191919] hover:bg-[#F6911E] hover:text-[#191919] text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Crear Tema de Impacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DERIVAR ENTIDAD (DECISIÓN, RESPONSABILIDAD O INTERFAZ) */}
      {deriveModalOpen && selectedTema && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Derivación desde Tema de Impacto
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {deriveType === 'decision' && 'Abrir Nueva Decisión'}
                  {deriveType === 'responsabilidad' && 'Asignar Nueva Responsabilidad'}
                  {deriveType === 'interfaz' && 'Establecer Acuerdo de Entrega (Interfaz)'}
                </h3>
              </div>
              <button onClick={() => setDeriveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Tema vinculado: <strong className="text-slate-800">{selectedTema.titulo}</strong> ({selectedTema.frente_id}: {selectedTema.frente_nombre})
            </p>

            <form onSubmit={handleSubmitDerive} className="space-y-4">
              {/* Form fields for Decisión */}
              {deriveType === 'decision' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Texto de la Decisión <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={deriveDecisionTexto}
                      onChange={e => setDeriveDecisionTexto(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Autoridad Decisoria</label>
                      <select
                        value={deriveDecisorId}
                        onChange={e => setDeriveDecisorId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Personas a Consultar</label>
                      <input
                        type="text"
                        placeholder="Ej. José Antonio, Sandra"
                        value={deriveConsultarA}
                        onChange={e => setDeriveConsultarA(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Momento Trigger / Disparador</label>
                    <input
                      type="text"
                      placeholder="Ej. Antes de presentar propuesta final al cliente"
                      value={deriveMomentoTrigger}
                      onChange={e => setDeriveMomentoTrigger(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* Form fields for Responsabilidad */}
              {deriveType === 'responsabilidad' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Descripción de la Responsabilidad <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={deriveRespTexto}
                      onChange={e => setDeriveRespTexto(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Persona Asignada</label>
                      <select
                        value={deriveRespPersonaId}
                        onChange={e => setDeriveRespPersonaId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Rol Operativo</label>
                      <select
                        value={deriveRespRol}
                        onChange={e => setDeriveRespRol(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                      >
                        <option value="Owner / Ejecuta">Owner / Ejecuta</option>
                        <option value="Ejecuta">Ejecuta</option>
                        <option value="Contribuye">Contribuye</option>
                        <option value="Supervisa">Supervisa</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Form fields for Interfaz / Relación */}
              {deriveType === 'interfaz' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Quién Entrega</label>
                      <select
                        value={deriveIntDePersonaId}
                        onChange={e => setDeriveIntDePersonaId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Quién Recibe</label>
                      <select
                        value={deriveIntHaciaPersonaId}
                        onChange={e => setDeriveIntHaciaPersonaId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
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
                      Qué Entrega (Input) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deriveIntEntrega}
                      onChange={e => setDeriveIntEntrega(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qué Devuelve (Output / Respuesta)</label>
                    <input
                      type="text"
                      placeholder="Ej. Aprobación técnica o retroalimentación"
                      value={deriveIntDevuelve}
                      onChange={e => setDeriveIntDevuelve(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeriveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#191919] hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear y Conectar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
