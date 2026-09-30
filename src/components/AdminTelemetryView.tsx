'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UsuarioTelemetria } from '@/lib/db';
import {
  Activity,
  Users,
  Compass,
  Clock,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  Eye,
  LogOut,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

interface TelemetryStats {
  totalSesionesHoy: number;
  usuariosDistintosHoy: number;
  moduloMasVisitado: string;
  tiempoTotalMinutosHoy: number;
}

export default function AdminTelemetryView() {
  const [logs, setLogs] = useState<UsuarioTelemetria[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('ALL');
  const [selectedEvento, setSelectedEvento] = useState('ALL');

  const fetchTelemetry = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/telemetry?limit=300&stats=true');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error('Error cargando telemetría:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Auto-refresh cada 30 segundos si la pestaña está activa
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Lista única de personas registradas para el filtro
  const personasOptions = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach(l => {
      if (l.persona_id && l.persona_nombre) {
        map.set(l.persona_id, l.persona_nombre);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [logs]);

  // Filtrado reactivo de logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filtro por persona
      if (selectedPersona !== 'ALL' && log.persona_id !== selectedPersona) {
        return false;
      }
      // Filtro por tipo de evento
      if (selectedEvento !== 'ALL' && log.tipo_evento !== selectedEvento) {
        return false;
      }
      // Filtro de texto libre
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const inNombre = (log.persona_nombre || '').toLowerCase().includes(query);
        const inModulo = (log.modulo_ruta || '').toLowerCase().includes(query);
        const inDetalles = (log.detalles || '').toLowerCase().includes(query);
        const inRol = (log.persona_rol || '').toLowerCase().includes(query);
        if (!inNombre && !inModulo && !inDetalles && !inRol) return false;
      }
      return true;
    });
  }, [logs, selectedPersona, selectedEvento, searchTerm]);

  // Formateadores visuales
  const getEventBadge = (tipo: string) => {
    switch (tipo) {
      case 'SESION_INICIADA':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <LogIn className="w-3 h-3 text-emerald-600" />
            <span>Sesión Iniciada</span>
          </span>
        );
      case 'NAVEGACION':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Eye className="w-3 h-3 text-blue-600" />
            <span>Navegación</span>
          </span>
        );
      case 'SESION_CERRADA':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <LogOut className="w-3 h-3 text-amber-600" />
            <span>Sesión Cerrada</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Activity className="w-3 h-3 text-slate-500" />
            <span>{tipo}</span>
          </span>
        );
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de métricas (KPIs estilo PVKS MetaSuite) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sesiones Hoy */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sesiones Hoy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats ? stats.totalSesionesHoy : '—'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-editorial">
            Accesos de colaboradores en la jornada
          </p>
        </div>

        {/* Card 2: Usuarios Activos */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Usuarios Únicos Hoy</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats ? stats.usuariosDistintosHoy : '—'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-editorial">
            Personas del equipo conectadas
          </p>
        </div>

        {/* Card 3: Módulo Más Visitado */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Módulo Más Visitado</span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#F6911E]">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 truncate" title={stats?.moduloMasVisitado}>
            {stats ? stats.moduloMasVisitado : '—'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-editorial">
            Zona de mayor atención y lectura
          </p>
        </div>

        {/* Card 4: Tiempo Total */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tiempo Total Hoy</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats ? `${stats.tiempoTotalMinutosHoy} min` : '—'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-editorial">
            Tiempo de permanencia acumulado
          </p>
        </div>
      </div>

      {/* Barra de Filtros & Acciones */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Buscador de texto */}
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por colaborador o módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F6911E]/30 focus:border-[#F6911E]"
            />
          </div>

          {/* Filtro por Persona */}
          <div className="relative">
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F6911E]/30"
            >
              <option value="ALL">Todas las personas</option>
              {personasOptions.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filtro por Tipo de Evento */}
          <div className="relative">
            <select
              value={selectedEvento}
              onChange={(e) => setSelectedEvento(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F6911E]/30"
            >
              <option value="ALL">Todos los eventos</option>
              <option value="SESION_INICIADA">Sesiones iniciadas</option>
              <option value="NAVEGACION">Navegación de módulos</option>
              <option value="SESION_CERRADA">Cierres y duración</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Botón Refrescar */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            {filteredLogs.length} eventos
          </span>
          <button
            onClick={() => fetchTelemetry(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Actualizar bitácora ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#F6911E]' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Bitácora de Telemetría (Timeline / Tabla) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#F6911E]" />
            <h2 className="text-sm font-bold text-slate-900">
              Bitácora de Trazabilidad & Accesos de Usuarios
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-editorial">
            Monitoreo en segundo plano conectado a SQLite
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#F6911E]" />
            <span>Cargando eventos de telemetría...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-editorial">
            No se encontraron eventos registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Hora</th>
                  <th className="px-6 py-3">Colaborador / Perfil</th>
                  <th className="px-6 py-3">Tipo de Evento</th>
                  <th className="px-6 py-3">Módulo / Ruta</th>
                  <th className="px-6 py-3">Detalle & Duración</th>
                  <th className="px-6 py-3 text-right">Sesión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Hora */}
                    <td className="px-6 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    {/* Colaborador */}
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {log.persona_nombre || 'Usuario Anónimo'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-editorial truncate max-w-[200px]">
                        {log.persona_rol || log.persona_id || 'Sin rol especificado'}
                      </div>
                    </td>

                    {/* Tipo de Evento */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {getEventBadge(log.tipo_evento)}
                    </td>

                    {/* Módulo / Ruta */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {log.modulo_ruta || '—'}
                      </span>
                    </td>

                    {/* Detalle & Duración */}
                    <td className="px-6 py-3.5">
                      <div className="text-slate-600 font-editorial">
                        {log.detalles || '—'}
                      </div>
                      {log.duracion_segundos > 0 && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Permanencia: {formatDuration(log.duracion_segundos)}</span>
                        </span>
                      )}
                    </td>

                    {/* Sesión ID Hash */}
                    <td className="px-6 py-3.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.session_id ? log.session_id.slice(-8) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
