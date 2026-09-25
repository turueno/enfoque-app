'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Interfaz, Persona, Frente } from '@/lib/types';
import { useUser } from './UserContext';
import {
  ArrowLeftRight,
  Filter,
  Network,
  List,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';

interface InterfacesClientProps {
  initialInterfaces: Interfaz[];
  personas: Persona[];
  frentes: Frente[];
}

export default function InterfacesClient({
  initialInterfaces,
  personas,
  frentes,
}: InterfacesClientProps) {
  const { currentUser } = useUser();
  const [interfaces, setInterfaces] = useState(initialInterfaces);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [frenteFilter, setFrenteFilter] = useState('ALL');
  const [personaFilter, setPersonaFilter] = useState('ALL');
  const [selectedInterface, setSelectedInterface] = useState<Interfaz | null>(null);
  const [editingInterface, setEditingInterface] = useState<Interfaz | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Edit / Validate State
  const [devuelveOutput, setDevuelveOutput] = useState('');
  const [estadoValidado, setEstadoValidado] = useState<'Operativa' | 'En riesgo' | 'Bloqueada' | 'Por definir'>('Operativa');
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);

  // New Interface Form State
  const [newDeId, setNewDeId] = useState(personas[0]?.id || 'P01');
  const [newHaciaId, setNewHaciaId] = useState(personas[1]?.id || 'P02');
  const [newEntrega, setNewEntrega] = useState('');
  const [newDevuelve, setNewDevuelve] = useState('');
  const [newFrentes, setNewFrentes] = useState(frentes[0]?.id || 'F01');

  // Filtered interfaces
  const filtered = useMemo(() => {
    return interfaces.filter(i => {
      if (frenteFilter !== 'ALL' && !(i.frentes_relacionados || '').includes(frenteFilter)) return false;
      if (personaFilter !== 'ALL') {
        const matchesDe = i.de_persona_id === personaFilter || (personas.find(p => p.id === personaFilter)?.nombre === i.de_persona_nombre);
        const matchesHacia = i.hacia_persona_id === personaFilter || (personas.find(p => p.id === personaFilter)?.nombre === i.hacia_persona_nombre);
        if (!matchesDe && !matchesHacia) return false;
      }
      return true;
    });
  }, [interfaces, frenteFilter, personaFilter, personas]);

  // Select interface for sidebar inspection
  const handleSelectInterface = (item: Interfaz) => {
    setSelectedInterface(item);
  };

  // Open modal for interface details & editing
  const handleEditInterface = (item: Interfaz) => {
    setEditingInterface(item);
    setDevuelveOutput(item.devuelve_output || '');
    setEstadoValidado(item.estado);
    setComentario(item.comentario_validacion || '');
  };

  const handleSaveInterface = async () => {
    if (!editingInterface) return;
    setSaving(true);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entidadTipo: 'interfaz',
          id: editingInterface.id,
          accion: 'APROBADO',
          usuario: currentUser.nombre,
          comentario,
          cambios: {
            devuelve_output: devuelveOutput,
            estado: estadoValidado
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setInterfaces(prev => prev.map(item => {
          if (item.id === editingInterface.id) {
            const updated: Interfaz = {
              ...item,
              devuelve_output: devuelveOutput,
              estado: estadoValidado,
              estado_validacion: 'APROBADO',
              comentario_validacion: comentario
            };
            if (selectedInterface?.id === item.id) {
              setSelectedInterface(updated);
            }
            return updated;
          }
          return item;
        }));
        setEditingInterface(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Node positions for Circular Directed Graph
  const graphNodes = useMemo(() => {
    const total = personas.length;
    const centerX = 300;
    const centerY = 300;
    const radius = 220;

    return personas.map((p, idx) => {
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      return {
        ...p,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [personas]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, typeof graphNodes[0]>();
    graphNodes.forEach(n => {
      map.set(n.id, n);
      map.set(n.nombre, n);
    });
    return map;
  }, [graphNodes]);

  return (
    <div className="space-y-6">
      {/* Controls & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Filters */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2 text-xs">
          <div className="flex items-center space-x-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filtros:</span>
          </div>

          <select
            value={frenteFilter}
            onChange={(e) => setFrenteFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">Todos los Procesos ({interfaces.length})</option>
            {frentes.map(f => (
              <option key={f.id} value={f.id}>{f.id}: {f.nombre_corto}</option>
            ))}
          </select>

          <select
            value={personaFilter}
            onChange={(e) => setPersonaFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">Todas las Personas</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Right: View toggle & New button */}
        <div className="flex items-center space-x-3">
          <div className="inline-flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('graph')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'graph' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Red Visual</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista de Interfaces</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE: GRAPH (Requerimiento 12 del prompt) */}
      {viewMode === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph Container */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center relative min-h-[580px] overflow-hidden">
            <div className="absolute top-4 left-4 z-10 text-xs text-slate-400">
              Haz clic en cualquier conexión o integrante para inspeccionar dependencias.
            </div>

            <svg viewBox="0 0 600 600" className="w-full max-w-[560px] h-auto select-none">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="14"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
                </marker>
                <marker
                  id="arrowhead-active"
                  markerWidth="10"
                  markerHeight="7"
                  refX="16"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                </marker>
              </defs>

              {/* Edges / Connections */}
              {filtered.map((inter) => {
                const source = nodeMap.get(inter.de_persona_id || '') || nodeMap.get(inter.de_persona_nombre);
                const target = nodeMap.get(inter.hacia_persona_id || '') || nodeMap.get(inter.hacia_persona_nombre);
                if (!source || !target) return null;

                const isSelected = selectedInterface?.id === inter.id;
                const isNodeConnected = selectedNode && (source.id === selectedNode || target.id === selectedNode);

                // Curve arc path
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;

                return (
                  <g key={inter.id} className="cursor-pointer" onClick={() => handleSelectInterface(inter)}>
                    <path
                      d={`M ${source.x} ${source.y} A ${dr} ${dr} 0 0,1 ${target.x} ${target.y}`}
                      fill="none"
                      stroke={isSelected ? '#2563eb' : isNodeConnected ? '#3b82f6' : '#cbd5e1'}
                      strokeWidth={isSelected ? 3.5 : isNodeConnected ? 2.5 : 1.5}
                      strokeDasharray={inter.estado === 'En riesgo' ? '4 2' : undefined}
                      markerEnd={isSelected || isNodeConnected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                      className="hover:stroke-blue-500 transition-colors"
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {graphNodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const inboundCount = filtered.filter(i => (i.hacia_persona_id === node.id || i.hacia_persona_nombre === node.nombre)).length;
                const outboundCount = filtered.filter(i => (i.de_persona_id === node.id || i.de_persona_nombre === node.nombre)).length;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  >
                    <circle
                      r="26"
                      fill={isSelected ? '#1e293b' : '#ffffff'}
                      stroke={isSelected ? '#0f172a' : '#94a3b8'}
                      strokeWidth={isSelected ? 3 : 2}
                      className="group-hover:stroke-slate-900 group-hover:scale-105 transition-all shadow-md"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="11"
                      fontWeight="bold"
                      fill={isSelected ? '#ffffff' : '#1e293b'}
                      className="pointer-events-none font-mono"
                    >
                      {node.id}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="42"
                      fontSize="11"
                      fontWeight="600"
                      fill="#334155"
                      className="pointer-events-none"
                    >
                      {node.nombre.split(' ')[0]}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="54"
                      fontSize="9"
                      fill="#64748b"
                      className="pointer-events-none font-mono"
                    >
                      ↓{inboundCount} ↑{outboundCount}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Sidebar: Contextual Contract Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedInterface ? `Detalle de Interfaz ${selectedInterface.id}` : 'Inspección de Dependencias'}
                </h3>
                {selectedInterface && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedInterface.estado === 'Operativa' ? 'bg-emerald-50 text-emerald-800' :
                    selectedInterface.estado === 'En riesgo' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedInterface.estado}
                  </span>
                )}
              </div>

              {!selectedInterface ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Selecciona una flecha en el grafo para revisar el contrato mutuo de entrega y respuesta.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{selectedInterface.de_persona_nombre}</span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      <span>{selectedInterface.hacia_persona_nombre}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Procesos: {selectedInterface.frentes_relacionados}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Entrega / Input requerido:
                    </span>
                    <p className="text-slate-900 font-medium text-sm leading-relaxed bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                      {selectedInterface.entrega_input}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Devuelve / Output de confirmación:
                    </span>
                    <p className="text-slate-800 text-sm leading-relaxed bg-purple-50/40 p-3 rounded-lg border border-purple-100">
                      {selectedInterface.devuelve_output || <span className="text-slate-400 italic">No formalizado (Alerta 8)</span>}
                    </p>
                  </div>

                  {selectedInterface.problema_actual && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">
                        Problema reportado:
                      </span>
                      <p className="text-slate-800 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                        {selectedInterface.problema_actual}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedInterface && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleEditInterface(selectedInterface)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 text-center"
                >
                  Validar / Editar Contrato
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE: LIST */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((i) => (
              <div
                key={i.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {i.id}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      i.estado === 'Operativa' ? 'bg-emerald-50 text-emerald-800' :
                      i.estado === 'En riesgo' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {i.estado}
                    </span>
                  </div>

                  <div className="mt-2 font-bold text-sm text-slate-900 flex items-center space-x-2">
                    <span>{i.de_persona_nombre}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{i.hacia_persona_nombre}</span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Entrega / Input:</span>
                      <p className="text-slate-800 mt-0.5 font-medium">{i.entrega_input}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Devuelve / Output:</span>
                      <p className="text-slate-700 mt-0.5">{i.devuelve_output || 'Sin definir'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">Procesos: {i.frentes_relacionados}</span>
                  <button
                    onClick={() => handleEditInterface(i)}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Validar / Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail / Validation Modal */}
      {editingInterface && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {editingInterface.id}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Validar Interfaz de Trabajo
                </h2>
              </div>
              <button onClick={() => setEditingInterface(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900">
                {editingInterface.de_persona_nombre} ➔ {editingInterface.hacia_persona_nombre}
              </div>
              <p className="text-slate-600"><strong className="text-slate-700">Input entregado:</strong> {editingInterface.entrega_input}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Output devuelto / Confirmación requerida:
                </label>
                <textarea
                  value={devuelveOutput}
                  onChange={(e) => setDevuelveOutput(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="Qué entrega de vuelta la persona que recibe para cerrar el ciclo..."
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Estado Operativo:
                </label>
                <select
                  value={estadoValidado}
                  onChange={(e) => setEstadoValidado(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Operativa">Operativa</option>
                  <option value="En riesgo">En riesgo</option>
                  <option value="Bloqueada">Bloqueada</option>
                  <option value="Por definir">Por definir</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Comentario de Validación:
                </label>
                <input
                  type="text"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="Acuerdos o notas del equipo..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingInterface(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveInterface}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Interfaz Validada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
