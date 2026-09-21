'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardSnapshotParsed } from '@/lib/snapshots';
import { StructuralAlert, Frente } from '@/lib/types';
import { useUser } from '@/components/UserContext';
import { isUserAdmin } from '@/lib/auth';
import {
  Camera,
  History,
  Clock,
  CheckCircle2,
  GitCommit,
  ArrowLeftRight,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  X,
  Trash2,
  Calendar,
  User,
  Plus,
  Check,
  ChevronDown,
  Target
} from 'lucide-react';
import Tooltip, { InfoTooltip } from '@/components/Tooltip';

interface DashboardStats {
  requiereDecision: number;
  requiereCoordinacion: number;
  porValidarTotal: number;
  sinOwnerClaro: number;
  enRiesgo: number;
  alertsTotal: number;
}

interface DashboardClientProps {
  initialSnapshots: DashboardSnapshotParsed[];
  liveStats: DashboardStats;
  liveFrentes: (Frente & {
    owner_nombre: string | null;
    responsabilidades_count: number;
    decisiones_count: number;
    interfaces_count: number;
    resultado_principal: string | null;
    alert_count: number;
  })[];
  liveAlerts: StructuralAlert[];
  textos: Record<string, string>;
}

export default function DashboardClient({
  initialSnapshots,
  liveStats,
  liveFrentes,
  liveAlerts,
  textos
}: DashboardClientProps) {
  const { currentUser } = useUser();
  const isAdmin = isUserAdmin(currentUser.id, currentUser.email);

  const [snapshots, setSnapshots] = useState<DashboardSnapshotParsed[]>(initialSnapshots);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('LIVE');
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Capture form state
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeSnapshot = selectedSnapshotId !== 'LIVE'
    ? snapshots.find(s => s.id === selectedSnapshotId) || null
    : null;

  const isHistorical = activeSnapshot !== null;

  // Active metrics to display
  const currentStats: DashboardStats = isHistorical && activeSnapshot
    ? activeSnapshot.stats
    : liveStats;

  // Active processes to display
  const currentFrentes = isHistorical && activeSnapshot
    ? activeSnapshot.frentes
    : liveFrentes;

  // Most recent snapshot for trend deltas (when in live mode)
  const baselineSnapshot = snapshots.length > 0 ? snapshots[0] : null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const handleCaptureSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotTitle.trim()) {
      setErrorMsg('Por favor ingresa un título o nombre para el corte.');
      return;
    }

    if (!isAdmin) {
      setErrorMsg('Solo los administradores autorizados pueden capturar cortes de gobernanza.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: snapshotTitle.trim(),
          notas: snapshotNotes.trim(),
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.nombre
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar el corte');
      }

      setSnapshots(prev => [data.snapshot, ...prev]);
      setSnapshotTitle('');
      setSnapshotNotes('');
      setIsCaptureModalOpen(false);
      setSuccessToast(`Corte "${data.snapshot.titulo}" guardado exitosamente en el histórico.`);
      setTimeout(() => setSuccessToast(null), 4500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSnapshot = async (id: string, titulo: string) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar cortes históricos.');
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar el corte "${titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const params = new URLSearchParams({
        id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.nombre
      });

      const res = await fetch(`/api/snapshots?${params.toString()}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar snapshot');
      }

      setSnapshots(prev => prev.filter(s => s.id !== id));
      if (selectedSnapshotId === id) {
        setSelectedSnapshotId('LIVE');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderDelta = (currentVal: number, baselineVal: number) => {
    if (isHistorical || !baselineSnapshot) return null;
    const diff = currentVal - baselineVal;
    if (diff === 0) return null;
    const isReduction = diff < 0;
    return (
      <span
        title={`Variación respecto a "${baselineSnapshot.titulo}"`}
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          isReduction ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {diff > 0 ? `+${diff}` : diff} vs corte
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
            {textos['home.hero.title'] || 'Tablero de Movimiento y Gobernanza'}
          </h1>
          <InfoTooltip
            content={textos['home.hero.subtitle'] || 'Visualización explícita de quién responde, decide, ejecuta y coordina en la organización.'}
            position="bottom"
            maxWidth="max-w-md"
            size={16}
          />
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/agenda"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-all shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 fill-current" />
            <span>Agenda Semanal</span>
          </Link>
          <Link
            href="/validar"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#191919] text-white text-xs font-semibold hover:bg-[#2b2b2b] transition-all shadow-sm border-l-2 border-[#F6911E]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F6911E]" />
            <span>Validar Pendientes ({currentStats.porValidarTotal})</span>
          </Link>
          <Link
            href="/revisor"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-[#191919] text-xs font-semibold hover:bg-orange-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F6911E]" />
            <span>Revisor IA</span>
          </Link>
        </div>
      </div>

      {/* Snapshot Control Bar / Time Machine */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1">
          <Clock className="w-4 h-4 text-[#F6911E] shrink-0 ml-1" />
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Vista del Tablero:
          </span>
          <div className="relative flex-1 max-w-md">
            <select
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-slate-800 focus:ring-2 focus:ring-[#F6911E] focus:outline-none cursor-pointer"
            >
              <option value="LIVE">🔴 Estado Actual (En vivo en tiempo real)</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  📸 {formatDate(s.created_at)} — {s.titulo} ({s.por_validar_total} pend.)
                </option>
              ))}
            </select>
          </div>
          {isHistorical && (
            <button
              onClick={() => setSelectedSnapshotId('LIVE')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Volver al estado en vivo"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">En vivo</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#191919] hover:bg-[#2b2b2b] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-[#F6911E]" />
            <span>Capturar Corte Actual</span>
          </button>

          <button
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="Ver catálogo completo de cortes históricos"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Historial ({snapshots.length})</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Historical Mode Alert Banner */}
      {isHistorical && activeSnapshot && (
        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-[#FFAA34] text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-[#F6911E] text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                  Fotografía Histórica
                </span>
                <span className="text-xs text-slate-500">
                  {formatDate(activeSnapshot.created_at)}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#191919] mt-0.5">
                {activeSnapshot.titulo}
              </h3>
              {activeSnapshot.notas && (
                <p className="text-xs text-slate-600 mt-1 font-editorial">
                  "{activeSnapshot.notas}"
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Registrado por: <strong className="text-slate-700">{activeSnapshot.created_by}</strong> • {activeSnapshot.por_validar_total} pendientes • {activeSnapshot.requiere_decision} decisiones sin validar.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedSnapshotId('LIVE')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#191919] hover:bg-[#2b2b2b] text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-end sm:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#F6911E]" />
            <span>Volver al Estado en Vivo</span>
          </button>
        </div>
      )}

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Requiere decisión */}
        <Link
          href="/decisiones"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>{textos['home.metrics.decision_title'] || 'Requiere decisión'}</span>
              <InfoTooltip
                content={textos['home.metrics.decision_desc'] || 'Decisiones organizacionales sin validar o pendientes de ratificación'}
                size={12}
              />
            </span>
            <GitCommit className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{currentStats.requiereDecision}</span>
            <div className="flex items-center space-x-1">
              {baselineSnapshot && renderDelta(currentStats.requiereDecision, baselineSnapshot.requiere_decision)}
              <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                Pendientes
              </span>
            </div>
          </div>
        </Link>

        {/* Requiere coordinación */}
        <Link
          href="/interfaces"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>{textos['home.metrics.coordination_title'] || 'Coordinación'}</span>
              <InfoTooltip
                content={textos['home.metrics.coordination_desc'] || 'Dependencias e interfaces operativas entre personas y procesos'}
                size={12}
              />
            </span>
            <ArrowLeftRight className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{currentStats.requiereCoordinacion}</span>
            <div className="flex items-center space-x-1">
              {baselineSnapshot && renderDelta(currentStats.requiereCoordinacion, baselineSnapshot.requiere_coordinacion)}
              <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded">
                Interfaces
              </span>
            </div>
          </div>
        </Link>

        {/* Por validar */}
        <Link
          href="/validar"
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>{textos['home.metrics.validate_title'] || 'Por validar'}</span>
              <InfoTooltip
                content={textos['home.metrics.validate_desc'] || 'Total de registros propuestos que requieren validación formal del equipo'}
                size={12}
              />
            </span>
            <CheckCircle2 className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{currentStats.porValidarTotal}</span>
            <div className="flex items-center space-x-1">
              {baselineSnapshot && renderDelta(currentStats.porValidarTotal, baselineSnapshot.por_validar_total)}
              <span className="text-[11px] text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded">
                Propuestos
              </span>
            </div>
          </div>
        </Link>

        {/* Sin owner claro */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>Sin owner claro</span>
              <InfoTooltip
                content="Alertas estructurales de procesos o resultados estratégicos sin un responsable principal definido"
                size={12}
              />
            </span>
            <HelpCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{currentStats.sinOwnerClaro}</span>
            <div className="flex items-center space-x-1">
              {baselineSnapshot && renderDelta(currentStats.sinOwnerClaro, baselineSnapshot.sin_owner_claro)}
              <span className="text-[11px] text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded">
                Alertas
              </span>
            </div>
          </div>
        </div>

        {/* En riesgo */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>En riesgo</span>
              <InfoTooltip
                content="Resultados con semáforo en atención o crítico que requieren intervención inmediata"
                size={12}
              />
            </span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{currentStats.enRiesgo}</span>
            <div className="flex items-center space-x-1">
              {baselineSnapshot && renderDelta(currentStats.enRiesgo, baselineSnapshot.en_riesgo)}
              <span className="text-[11px] text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded">
                Resultados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Structural Alerts Banner if live and any */}
      {!isHistorical && liveAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-amber-900">
                  {liveAlerts.length} Observaciones Estructurales Detectadas
                </h3>
                <InfoTooltip
                  content="El motor de reglas identificó puntos organizacionales que requieren diferenciación de roles o formalización."
                  position="top"
                  size={13}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {liveAlerts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-lg bg-white/80 border border-amber-200/80 text-xs flex items-start space-x-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">{a.titulo}: </span>
                      <span className="text-slate-600">{a.mensaje}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Procesos Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {textos['home.frentes.title'] || `Los ${currentFrentes.length} Procesos de Trabajo`}
            </h2>
          </div>
          <Link
            href="/procesos"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Ver detalle completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentFrentes.map((f) => {
            const hasAlerts = (f.alert_count ?? 0) > 0;
            return (
              <Link
                key={f.id}
                href={`/frentes/${f.id}`}
                className="group relative flex flex-col justify-between rounded-xl bg-white p-5 border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {f.id}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {f.tipo_frente}
                      </span>
                    </div>
                    {hasAlerts ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{f.alert_count} alerta{(f.alert_count ?? 0) > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {f.estado_definicion}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[#191919] group-hover:text-[#F6911E] transition-colors">
                    {f.nombre_corto}
                  </h3>

                  {/* Owner */}
                  <div className="mt-2.5 flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {f.owner_nombre ? f.owner_nombre.charAt(0) : '?'}
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400">Owner: </span>
                      <span className="font-semibold text-slate-800">
                        {f.owner_nombre || 'Sin definir'}
                      </span>
                    </div>
                  </div>

                  {/* Resultado Principal en Tooltip interactivo */}
                  {f.resultado_principal && (
                    <div className="mt-3">
                      <Tooltip
                        position="top"
                        maxWidth="max-w-sm"
                        content={
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[#FFAA34] tracking-wider block">
                              Resultado Esperado ({f.nombre_corto}):
                            </span>
                            <p className="text-xs text-slate-100 font-editorial">
                              "{f.resultado_principal}"
                            </p>
                          </div>
                        }
                      >
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-orange-50 hover:bg-orange-100/80 border border-orange-200/80 text-[11px] text-amber-900 font-medium transition-colors cursor-help">
                          <Target className="w-3.5 h-3.5 text-[#F6911E] shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {f.resultado_principal}
                          </span>
                        </span>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* Métricas inferiores del frente */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex space-x-3">
                    <span>
                      <strong className="text-slate-800 font-semibold">{f.responsabilidades_count}</strong> resps
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-800 font-semibold">{f.decisiones_count}</strong> decs
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-800 font-semibold">{f.interfaces_count}</strong> inters
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Modal: Capturar Corte Actual */}
      {isCaptureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#191919] text-[#F6911E] rounded-lg">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Capturar Corte de Gobernanza
                </h3>
              </div>
              <button
                onClick={() => setIsCaptureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdmin && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Solo los administradores autorizados (José Antonio Turueño) pueden generar nuevos cortes históricos.
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCaptureSnapshot} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre o Hito del Corte <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Línea Base Inicial, Corte Semanal 37, Cierre Q3"
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#F6911E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observaciones de contexto (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej. Estado del tablero tras sesión de alineación con el equipo de dirección..."
                  value={snapshotNotes}
                  onChange={(e) => setSnapshotNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#F6911E] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Foto actual a registrar:</div>
                <div className="flex justify-between text-[11px]">
                  <span>Por validar:</span>
                  <span className="font-mono font-bold text-purple-700">{liveStats.porValidarTotal}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Decisiones pendientes:</span>
                  <span className="font-mono font-bold text-amber-700">{liveStats.requiereDecision}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Interfaces activas:</span>
                  <span className="font-mono font-bold text-blue-700">{liveStats.requiereCoordinacion}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Alertas estructurales:</span>
                  <span className="font-mono font-bold text-slate-700">{liveAlerts.length}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCaptureModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isAdmin}
                  className="px-4 py-2 rounded-lg bg-[#191919] hover:bg-[#2b2b2b] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Fotografía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Historial Completo de Cortes */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="bg-white max-w-md w-full h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-[#F6911E]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Historial de Cortes ({snapshots.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {snapshots.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No hay cortes históricos guardados aún. Haz clic en "Capturar Corte Actual" para registrar la primera foto.
                  </div>
                ) : (
                  snapshots.map((s) => {
                    const isSelected = selectedSnapshotId === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[#F6911E] bg-orange-50/40 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(s.created_at)}</span>
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">
                              {s.titulo}
                            </h4>
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSnapshot(s.id, s.titulo)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              title="Eliminar este corte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {s.notas && (
                          <p className="text-xs text-slate-600 mt-2 font-editorial italic">
                            "{s.notas}"
                          </p>
                        )}

                        {/* Snapshot mini metrics */}
                        <div className="mt-3 grid grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded-lg text-center text-[10px]">
                          <div>
                            <div className="text-slate-400">Por Validar</div>
                            <div className="font-bold text-purple-700">{s.por_validar_total}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Decisiones</div>
                            <div className="font-bold text-amber-700">{s.requiere_decision}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Interfaces</div>
                            <div className="font-bold text-blue-700">{s.requiere_coordinacion}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Alertas</div>
                            <div className="font-bold text-slate-800">{s.alerts_count}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400">
                            Por: {s.created_by}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedSnapshotId(s.id);
                              setIsHistoryDrawerOpen(false);
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-[#F6911E] text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSelected ? 'Activo en Tablero' : 'Ver en Tablero'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
