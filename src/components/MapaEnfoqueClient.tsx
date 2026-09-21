'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Frente, Persona, Responsabilidad } from '@/lib/types';
import { X, Filter, ChevronRight, Layers, User, CheckCircle2, AlertCircle } from 'lucide-react';

import Tooltip from '@/components/Tooltip';

interface MatrixCellData {
  roles: string[];
  roleCodes: ('O' | 'D' | 'E' | 'C' | 'I')[];
  isOwner: boolean;
  responsabilidades: Responsabilidad[];
}

interface MapaEnfoqueClientProps {
  frentes: (Frente & { owner_nombre: string | null })[];
  personas: Persona[];
  matrix: Record<string, Record<string, MatrixCellData>>;
}

const ROLE_BADGES = {
  O: { bg: 'bg-[#191919] text-[#FFAA34] border-[#191919]', label: 'Owner', desc: 'Owner del Proceso: máxima responsabilidad y accountability sobre el resultado final' },
  D: { bg: 'bg-[#F6911E] text-white border-[#F6911E]', label: 'Decide', desc: 'Decide: autoridad para tomar decisiones y dar aprobaciones finales' },
  E: { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Ejecuta', desc: 'Ejecuta: realiza directamente las tareas y entregables de trabajo' },
  C: { bg: 'bg-blue-100 text-blue-900 border-blue-200', label: 'Contribuye', desc: 'Contribuye: aporta insumos, análisis o soporte en la ejecución' },
  I: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Informado', desc: 'Informado: debe mantenerse al tanto del avance y resultados' },
};

export default function MapaEnfoqueClient({
  frentes,
  personas,
  matrix,
}: MapaEnfoqueClientProps) {
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('ALL');
  const [selectedFrenteFilter, setSelectedFrenteFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedValidationFilter, setSelectedValidationFilter] = useState<string>('ALL');

  // Cell drill-down modal
  const [activeCell, setActiveCell] = useState<{
    frente: Frente;
    persona: Persona;
    data: MatrixCellData;
  } | null>(null);

  // Filtered lists
  const filteredFrentes = useMemo(() => {
    return frentes.filter(f => selectedFrenteFilter === 'ALL' || f.id === selectedFrenteFilter);
  }, [frentes, selectedFrenteFilter]);

  const filteredPersonas = useMemo(() => {
    return personas.filter(p => selectedPersonaFilter === 'ALL' || p.id === selectedPersonaFilter);
  }, [personas, selectedPersonaFilter]);

  const cellMatchesFilters = (cell: MatrixCellData) => {
    if (selectedRoleFilter !== 'ALL') {
      if (!cell.roleCodes.includes(selectedRoleFilter as any)) return false;
    }
    if (selectedValidationFilter !== 'ALL') {
      const hasMatchingValidation = cell.responsabilidades.some(
        r => r.estado_validacion === selectedValidationFilter
      );
      if (!hasMatchingValidation && cell.responsabilidades.length > 0) return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Legend & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Visual Role Legend con Tooltips */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 text-xs">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
            Roles:
          </span>
          {Object.entries(ROLE_BADGES).map(([code, style]) => (
            <Tooltip
              key={code}
              position="top"
              content={
                <div className="space-y-0.5">
                  <div className="font-bold text-[#FFAA34]">{code} = {style.label}</div>
                  <div className="text-[11px] text-slate-200 font-normal">{style.desc}</div>
                </div>
              }
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-md border text-xs font-mono font-bold transition-transform hover:scale-110 cursor-help ${style.bg}`}
              >
                {code}
              </span>
            </Tooltip>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 text-xs">
          <div className="flex items-center space-x-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filtros:</span>
          </div>

          <select
            value={selectedFrenteFilter}
            onChange={(e) => setSelectedFrenteFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Todos los Procesos</option>
            {frentes.map(f => (
              <option key={f.id} value={f.id}>{f.id}: {f.nombre_corto}</option>
            ))}
          </select>

          <select
            value={selectedPersonaFilter}
            onChange={(e) => setSelectedPersonaFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Todas las Personas</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Cualquier Rol</option>
            <option value="O">O — Owner</option>
            <option value="D">D — Decide</option>
            <option value="E">E — Ejecuta</option>
            <option value="C">C — Contribuye</option>
            <option value="I">I — Informado</option>
          </select>

          <select
            value={selectedValidationFilter}
            onChange={(e) => setSelectedValidationFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">Todo Estado</option>
            <option value="POR VALIDAR">Por validar</option>
            <option value="APROBADO">Aprobado</option>
            <option value="REQUIERE REVISIÓN">Requiere revisión</option>
            <option value="DEFINIDO">Definido</option>
          </select>
        </div>
      </div>

      {/* Desktop / Tablet Matrix Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="p-3.5 pl-5 w-72 sticky left-0 bg-slate-50 z-20">
                  Proceso / Iniciativa
                </th>
                {filteredPersonas.map((p) => (
                  <th key={p.id} className="p-3.5 text-center min-w-[130px] border-l border-slate-200">
                    <Link href={`/personas/${p.id}`} className="hover:text-blue-600 block">
                      <div className="text-xs font-bold text-slate-900 truncate">{p.nombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">{p.id}</div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredFrentes.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Frente row header */}
                  <td className="p-3.5 pl-5 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 border-r border-slate-200">
                    <Link href={`/frentes/${f.id}`} className="block group">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {f.id}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {f.nombre_corto}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate">
                        Owner: <strong className="text-slate-700">{f.owner_nombre || 'Sin definir'}</strong>
                      </div>
                    </Link>
                  </td>

                  {/* Intersections */}
                  {filteredPersonas.map((p) => {
                    const cell = matrix[f.id]?.[p.id];
                    if (!cell) return <td key={p.id} className="p-3 border-l border-slate-200" />;

                    const matches = cellMatchesFilters(cell);
                    const hasContent = cell.roleCodes.length > 0 || cell.responsabilidades.length > 0;

                    if (!hasContent) {
                      return (
                        <td
                          key={p.id}
                          className="p-3 text-center border-l border-slate-200 text-slate-300 font-mono text-xs select-none"
                        >
                          —
                        </td>
                      );
                    }

                    return (
                      <td
                        key={p.id}
                        onClick={() => setActiveCell({ frente: f, persona: p, data: cell })}
                        className={`p-3 text-center border-l border-slate-200 cursor-pointer hover:bg-blue-50/60 transition-all ${
                          matches ? 'opacity-100' : 'opacity-25'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-1 flex-wrap gap-y-1">
                          {cell.roleCodes.map((code) => {
                            const badge = ROLE_BADGES[code];
                            return (
                              <span
                                key={code}
                                className={`w-6 h-6 rounded-md border flex items-center justify-center font-mono font-bold text-xs shadow-xs ${badge.bg}`}
                                title={`${badge.label}: ${cell.responsabilidades.length} responsabilidades`}
                              >
                                {code}
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {cell.responsabilidades.length} resp{cell.responsabilidades.length > 1 ? 's' : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked View (Requirement 23: avoid excessive horizontal scroll on mobile) */}
      <div className="block md:hidden space-y-4">
        {filteredFrentes.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {f.id}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{f.nombre_corto}</h3>
              </div>
              <Link href={`/frentes/${f.id}`} className="text-xs text-blue-600 font-medium flex items-center">
                <span>Ver</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredPersonas.map((p) => {
                const cell = matrix[f.id]?.[p.id];
                if (!cell || cell.roleCodes.length === 0) return null;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveCell({ frente: f, persona: p, data: cell })}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-1 rounded"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{p.nombre}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cell.responsabilidades.length} responsabilidades</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {cell.roleCodes.map((c) => (
                        <span key={c} className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold ${ROLE_BADGES[c].bg}`}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over Drill Down Modal for Intersections */}
      {activeCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {activeCell.frente.id} × {activeCell.persona.id}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Cruce Organizacional</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">
                    {activeCell.persona.nombre} en {activeCell.frente.nombre_corto}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveCell(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roles in this Frente */}
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Roles asignados:</span>
                <div className="flex items-center space-x-1.5">
                  {activeCell.data.roleCodes.map((code) => (
                    <span
                      key={code}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${ROLE_BADGES[code].bg}`}
                    >
                      {code} — {ROLE_BADGES[code].label}
                    </span>
                  ))}
                  {activeCell.data.isOwner && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-600 text-white">
                      Owner del Proceso
                    </span>
                  )}
                </div>
              </div>

              {/* Responsibilities list */}
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Responsabilidades Registradas ({activeCell.data.responsabilidades.length})
                </h3>

                {activeCell.data.responsabilidades.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No hay responsabilidades detalladas cargadas.</p>
                ) : (
                  activeCell.data.responsabilidades.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 space-y-2 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-800 px-2 py-0.5 rounded bg-slate-100">
                          {r.id}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Rol: {r.rol_validado || r.rol_propuesto}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Texto Original de Origen ({r.celda_origen || 'Excel'}):
                        </span>
                        <p className="text-sm text-[#191919] font-editorial leading-relaxed mt-0.5">
                          "{r.responsabilidad_original}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                        <span>Estado: <strong className="text-slate-700">{r.estado_validacion}</strong></span>
                        <Link
                          href={`/validar?id=${r.id}&tipo=responsabilidad`}
                          className="text-blue-600 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <span>Validar / Modificar</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between">
              <Link
                href={`/frentes/${activeCell.frente.id}`}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Ver página completa de {activeCell.frente.nombre_corto} →
              </Link>
              <button
                onClick={() => setActiveCell(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
