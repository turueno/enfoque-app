'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Decision, Frente, Persona } from '@/lib/types';
import { useUser } from './UserContext';
import { GitCommit, Filter, CheckCircle2, AlertTriangle, Plus, X, ChevronRight } from 'lucide-react';

interface DecisionesClientProps {
  initialDecisiones: (Decision & { frente_nombre: string; decisor_nombre: string | null })[];
  frentes: Frente[];
  personas: Persona[];
}

export default function DecisionesClient({
  initialDecisiones,
  frentes,
  personas,
}: DecisionesClientProps) {
  const { currentUser } = useUser();
  const [decisiones, setDecisiones] = useState(initialDecisiones);
  const [frenteFilter, setFrenteFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDec, setSelectedDec] = useState<(typeof initialDecisiones)[0] | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Validation Form State
  const [selectedDecisorId, setSelectedDecisorId] = useState('');
  const [consultarA, setConsultarA] = useState('');
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  // New Decision Form State
  const [newFrenteId, setNewFrenteId] = useState(frentes[0]?.id || 'F01');
  const [newDecision, setNewDecision] = useState('');
  const [newDecisorId, setNewDecisorId] = useState(personas[0]?.id || 'P01');
  const [newConsultarA, setNewConsultarA] = useState('');
  const [newMomento, setNewMomento] = useState('');

  const filteredDecisiones = decisiones.filter(d => {
    if (frenteFilter !== 'ALL' && d.frente_id !== frenteFilter) return false;
    if (statusFilter !== 'ALL' && d.estado_validacion !== statusFilter) return false;
    return true;
  });

  const openValidationModal = (d: (typeof initialDecisiones)[0]) => {
    setSelectedDec(d);
    setSelectedDecisorId(d.decisor_validado_id || d.decisor_propuesto_id || '');
    setConsultarA(d.consultar_a_validado || d.consultar_a_propuesto || '');
    setComentario(d.comentario_validacion || '');
  };

  const handleValidate = async (accion: 'APROBADO' | 'RECHAZADO' | 'MODIFICADO') => {
    if (!selectedDec) return;
    setSaving(true);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entidadTipo: 'decision',
          id: selectedDec.id,
          accion,
          usuario: currentUser.nombre,
          comentario,
          cambios: {
            decisor_validado_id: selectedDecisorId,
            consultar_a_validado: consultarA
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        setDecisiones(prev => prev.map(item => {
          if (item.id === selectedDec.id) {
            const decPersona = personas.find(p => p.id === selectedDecisorId);
            return {
              ...item,
              estado_validacion: result.estado,
              decisor_validado_id: selectedDecisorId,
              decisor_nombre: decPersona?.nombre || item.decisor_nombre,
              consultar_a_validado: consultarA,
              comentario_validacion: comentario
            };
          }
          return item;
        }));
        setSelectedDec(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecision.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'decision',
          usuario: currentUser.nombre,
          data: {
            frente_id: newFrenteId,
            decision: newDecision,
            decisor_id: newDecisorId,
            consultar_a: newConsultarA,
            momento: newMomento
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        const decPersona = personas.find(p => p.id === newDecisorId);
        const frenteObj = frentes.find(f => f.id === newFrenteId);
        const newEntry = {
          id: result.id,
          frente_id: newFrenteId,
          frente_nombre: frenteObj?.nombre_corto || newFrenteId,
          decision: newDecision,
          decisor_propuesto_id: newDecisorId,
          decisor_propuesto_nombre: decPersona?.nombre || null,
          decisor_validado_id: newDecisorId,
          decisor_nombre: decPersona?.nombre || null,
          consultar_a_propuesto: newConsultarA,
          consultar_a_validado: newConsultarA,
          momento_trigger: newMomento,
          criterio_decision: null,
          estado_definicion: 'Definido',
          estado_validacion: 'DEFINIDO' as const,
          validado_por: currentUser.nombre,
          fecha_validacion: new Date().toISOString(),
          comentario_validacion: 'Creado dinámicamente'
        };
        setDecisiones([newEntry, ...decisiones]);
        setShowNewModal(false);
        setNewDecision('');
        setNewConsultarA('');
        setNewMomento('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1 text-slate-500 text-xs">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filtros:</span>
          </div>

          <select
            value={frenteFilter}
            onChange={(e) => setFrenteFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">Todos los Procesos ({decisiones.length})</option>
            {frentes.map(f => (
              <option key={f.id} value={f.id}>{f.id}: {f.nombre_corto}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="POR VALIDAR">Por validar</option>
            <option value="APROBADO">Aprobado</option>
            <option value="REQUIERE REVISIÓN">Requiere revisión</option>
            <option value="DEFINIDO">Definido</option>
          </select>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir Decisión</span>
        </button>
      </div>

      {/* Decision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDecisiones.map((d) => {
          const hasMultipleDecisors = (d.decisor_propuesto_nombre || '').includes(';') || (d.decisor_propuesto_nombre || '').includes('/');

          return (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {d.id}
                    </span>
                    <Link
                      href={`/frentes/${d.frente_id}`}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      {d.frente_id}: {d.frente_nombre}
                    </Link>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    d.estado_validacion === 'APROBADO' ? 'bg-emerald-50 text-emerald-700' :
                    d.estado_validacion === 'REQUIERE REVISIÓN' ? 'bg-amber-100 text-amber-800' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    {d.estado_validacion}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {d.decision}
                </h3>

                {hasMultipleDecisors && (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Alerta: Múltiples decisores propuestos. Requiere decisor único.</span>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold text-xs">Decisor Final:</span>
                    <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 text-xs">
                      {d.decisor_nombre || 'Sin asignar'}
                    </span>
                  </div>

                  {(d.consultar_a_validado || d.consultar_a_propuesto) && (
                    <div>
                      <span className="text-slate-500 font-semibold block mb-0.5">Consultar a:</span>
                      <p className="text-slate-800 font-medium text-xs leading-relaxed">{d.consultar_a_validado || d.consultar_a_propuesto}</p>
                    </div>
                  )}

                  {d.momento_trigger && (
                    <div>
                      <span className="text-slate-500 font-semibold block mb-0.5">Momento / Disparador:</span>
                      <p className="text-slate-800 text-xs leading-relaxed">{d.momento_trigger}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {d.validado_por ? `Validado por ${d.validado_por}` : 'Propuesta de origen'}
                </span>
                <button
                  onClick={() => openValidationModal(d)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>Validar / Editar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Modal */}
      {selectedDec && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedDec.id}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Validación de Autoridad de Decisión
                </h2>
              </div>
              <button onClick={() => setSelectedDec(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs">
              <span className="text-slate-400 font-semibold block">Decisión:</span>
              <p className="text-slate-900 font-medium mt-0.5">{selectedDec.decision}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Decisor Final Validado (Una sola persona responsable):
                </label>
                <select
                  value={selectedDecisorId}
                  onChange={(e) => setSelectedDecisorId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                >
                  <option value="">Seleccionar decisor único</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.rol_funcional_propuesto})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Personas Consultadas Validadas:
                </label>
                <input
                  type="text"
                  value={consultarA}
                  onChange={(e) => setConsultarA(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  placeholder="Ej: Sandra Montes de Oca; Karen Heitler"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Comentario de Validación / Criterio:
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  placeholder="Motivo del acuerdo o criterio organizacional..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleValidate('RECHAZADO')}
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100"
              >
                Marcar Revisión
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedDec(null)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleValidate('APROBADO')}
                  disabled={saving || !selectedDecisorId}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Aprobar Decisión'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Decision Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateDecision} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Añadir Nueva Decisión Organizacional
              </h2>
              <button type="button" onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Proceso:</label>
                <select
                  value={newFrenteId}
                  onChange={(e) => setNewFrenteId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {frentes.map(f => (
                    <option key={f.id} value={f.id}>{f.id}: {f.nombre_corto}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Decisión a Tomar:</label>
                <input
                  type="text"
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  required
                  placeholder="Ej: Autorizar cambios en la arquitectura metodológica"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Decisor Final:</label>
                <select
                  value={newDecisorId}
                  onChange={(e) => setNewDecisorId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Consultar a:</label>
                <input
                  type="text"
                  value={newConsultarA}
                  onChange={(e) => setNewConsultarA(e.target.value)}
                  placeholder="Nombres o roles a consultar"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Momento / Trigger:</label>
                <input
                  type="text"
                  value={newMomento}
                  onChange={(e) => setNewMomento(e.target.value)}
                  placeholder="Ej: Antes de presentar la propuesta al cliente"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !newDecision.trim()}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear Decisión'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
