'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from './UserContext';
import { Persona, Frente, AgendaItem, ReunionMinuta, PriorityLevel } from '@/lib/types';
import {
  Calendar,
  Users,
  User,
  Layers,
  Star,
  Copy,
  Check,
  Play,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeftRight,
  Shield,
  GitCommit,
  X,
  Sparkles,
  History,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

interface AgendaClientProps {
  initialData?: {
    ciclo: string;
    items: AgendaItem[];
    stats: { p1: number; p2: number; p3: number; total: number; destacados: number };
  };
  initialMode?: 'semanal' | 'bilateral' | 'proceso' | 'minutas';
  initialPersonaA?: string;
  initialPersonaB?: string;
  initialFrente?: string;
  initialSemanalData?: {
    ciclo: string;
    items: AgendaItem[];
    stats: { p1: number; p2: number; p3: number; total: number; destacados: number };
  };
  personas: Persona[];
  frentes: (Frente & { owner_nombre?: string | null })[];
  initialMinutas: ReunionMinuta[];
  textosMap?: Record<string, string>;
}

export default function AgendaClient({
  initialData,
  initialMode = 'semanal',
  initialPersonaA,
  initialPersonaB,
  initialFrente,
  initialSemanalData,
  personas,
  frentes,
  initialMinutas,
  textosMap = {}
}: AgendaClientProps) {
  const effectiveInitial = initialData || initialSemanalData || {
    ciclo: '',
    items: [],
    stats: { p1: 0, p2: 0, p3: 0, total: 0, destacados: 0 }
  };

  const { currentUser } = useUser();

  // Mode: semanal | bilateral | proceso | minutas
  const [meetingMode, setMeetingMode] = useState<'semanal' | 'bilateral' | 'proceso' | 'minutas'>(initialMode);

  // Bilateral Selectors (Defaults: initial query params or currentUser and next persona)
  const defaultPersonaA = initialPersonaA || currentUser.id || personas[0]?.id || 'P01';
  const defaultPersonaB = initialPersonaB || personas.find(p => p.id !== defaultPersonaA)?.id || personas[1]?.id || 'P02';
  const [personaAId, setPersonaAId] = useState(defaultPersonaA);
  const [personaBId, setPersonaBId] = useState(defaultPersonaB);

  // Proceso Selector
  const [frenteId, setFrenteId] = useState(initialFrente || frentes[0]?.id || 'F01');

  // Items and state
  const [items, setItems] = useState<AgendaItem[]>(effectiveInitial.items);
  const [ciclo, setCiclo] = useState<string>(effectiveInitial.ciclo);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveModeOpen, setLiveModeOpen] = useState(false);
  const [liveTimerSeconds, setLiveTimerSeconds] = useState(30 * 60); // 30 min default
  const [timerRunning, setTimerRunning] = useState(false);

  // Minutas
  const [minutas, setMinutas] = useState<ReunionMinuta[]>(initialMinutas);
  const [saveMinutaModalOpen, setSaveMinutaModalOpen] = useState(false);
  const [minutaTitle, setMinutaTitle] = useState('');
  const [savingMinuta, setSavingMinuta] = useState(false);

  // In-meeting quick agreements recorded per item (item.id -> acuerdo string)
  const [agreements, setAgreements] = useState<Record<string, string>>({});

  // Load agenda data when selectors change
  useEffect(() => {
    if (meetingMode === 'minutas') return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = `/api/agenda?tipo=${meetingMode}`;
        if (meetingMode === 'bilateral') {
          url += `&personaA=${encodeURIComponent(personaAId)}&personaB=${encodeURIComponent(personaBId)}`;
        } else if (meetingMode === 'proceso') {
          url += `&frente=${encodeURIComponent(frenteId)}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data.success) {
          setItems(data.items || []);
          if (data.ciclo) setCiclo(data.ciclo);
        }
      } catch (err) {
        console.error('Error cargando agenda:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [meetingMode, personaAId, personaBId, frenteId]);

  // Live timer countdown
  useEffect(() => {
    let interval: any = null;
    if (liveModeOpen && timerRunning && liveTimerSeconds > 0) {
      interval = setInterval(() => {
        setLiveTimerSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [liveModeOpen, timerRunning, liveTimerSeconds]);

  // Priority group separation
  const { p1Items, p2Items, p3Items, destacadosCount } = useMemo(() => {
    const p1 = items.filter(i => i.prioridad_efectiva === 'P1');
    const p2 = items.filter(i => i.prioridad_efectiva === 'P2');
    const p3 = items.filter(i => i.prioridad_efectiva === 'P3');
    const dest = items.filter(i => i.destacado_semana).length;
    return { p1Items: p1, p2Items: p2, p3Items: p3, destacadosCount: dest };
  }, [items]);

  // Toggle Star (⭐ Pin)
  const handleToggleStar = async (item: AgendaItem) => {
    const newDest = !item.destacado_semana;
    const newEff = newDest ? 'P1' : item.prioridad_manual || item.prioridad_calculada;

    setItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, destacado_semana: newDest, prioridad_efectiva: newEff }
          : i
      )
    );

    try {
      await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_star',
          entidadTipo: item.entidad_tipo,
          entidadId: item.entidad_id,
          usuario: currentUser.nombre,
          semana: ciclo
        })
      });
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  // Set Manual Priority (P1 / P2 / P3 / reset)
  const handleSetPriority = async (item: AgendaItem, newPriority: PriorityLevel | null) => {
    const newEff = item.destacado_semana ? 'P1' : newPriority || item.prioridad_calculada;

    setItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, prioridad_manual: newPriority, prioridad_efectiva: newEff }
          : i
      )
    );

    try {
      await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_priority',
          entidadTipo: item.entidad_tipo,
          entidadId: item.entidad_id,
          prioridad: newPriority,
          usuario: currentUser.nombre,
          semana: ciclo
        })
      });
    } catch (err) {
      console.error('Error setting priority:', err);
    }
  };

  // Record inline agreement
  const handleAgreementChange = (itemId: string, text: string) => {
    setAgreements(prev => ({ ...prev, [itemId]: text }));
  };

  // Copy Agenda to Clipboard (Formatted for Slack, Teams, Calendar)
  const handleCopyAgenda = () => {
    let meetingTitle = 'Reunión Semanal de Equipo';
    if (meetingMode === 'bilateral') {
      const pA = personas.find(p => p.id === personaAId)?.nombre || 'A';
      const pB = personas.find(p => p.id === personaBId)?.nombre || 'B';
      meetingTitle = `Sincronización 1 a 1: ${pA} & ${pB}`;
    } else if (meetingMode === 'proceso') {
      const f = frentes.find(fr => fr.id === frenteId);
      meetingTitle = `Revisión de Proceso: ${f?.nombre_corto || frenteId}`;
    }

    let text = `🗓️ **AGENDA: ${meetingTitle.toUpperCase()}**\n`;
    text += `⏱️ Duración estimada: 30 min | Ciclo: ${ciclo}\n\n`;

    if (p1Items.length > 0) {
      text += `🔴 **BLOQUE 1: FOCO CRÍTICO & BLOQUEOS (15 min)**\n`;
      p1Items.forEach((i, idx) => {
        text += `${idx + 1}. ${i.destacado_semana ? '⭐ ' : ''}[${i.entidad_tipo.toUpperCase()}] ${i.titulo}\n`;
        text += `   • ${i.subtitulo}\n`;
        text += `   • Acción sugerida: ${i.accion_sugerida}\n`;
        if (agreements[i.id]) text += `   • 📝 Acuerdo: ${agreements[i.id]}\n`;
      });
      text += '\n';
    }

    if (p2Items.length > 0) {
      text += `🟡 **BLOQUE 2: POR DESTRABAR & VALIDAR (10 min)**\n`;
      p2Items.forEach((i, idx) => {
        text += `${idx + 1}. [${i.entidad_tipo.toUpperCase()}] ${i.titulo}\n`;
        text += `   • ${i.subtitulo}\n`;
        text += `   • Acción: ${i.accion_sugerida}\n`;
        if (agreements[i.id]) text += `   • 📝 Acuerdo: ${agreements[i.id]}\n`;
      });
      text += '\n';
    }

    if (p3Items.length > 0) {
      text += `🟢 **BLOQUE 3: SEGUIMIENTO OPERATIVO (5 min)**\n`;
      p3Items.slice(0, 5).forEach((i, idx) => {
        text += `${idx + 1}. [${i.entidad_tipo.toUpperCase()}] ${i.titulo}\n`;
        if (agreements[i.id]) text += `   • 📝 Acuerdo: ${agreements[i.id]}\n`;
      });
    }

    text += `\n_Generado automáticamente desde Enfoque (Sistema Operativo de Gestión)_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Save Minuta to DB
  const handleSaveMinuta = async () => {
    setSavingMinuta(true);
    try {
      const acuerdosArray = Object.entries(agreements)
        .filter(([_, text]) => text && text.trim() !== '')
        .map(([itemId, text]) => {
          const item = items.find(i => i.id === itemId);
          return {
            temaId: itemId,
            acuerdo: text,
            responsable: item?.involucrados[0] || currentUser.nombre
          };
        });

      let defaultTitle = `Minuta Semanal ${ciclo}`;
      let participantes = [currentUser.nombre];
      let fId: string | null = null;

      if (meetingMode === 'bilateral') {
        const pA = personas.find(p => p.id === personaAId)?.nombre || 'A';
        const pB = personas.find(p => p.id === personaBId)?.nombre || 'B';
        defaultTitle = `Minuta 1 a 1: ${pA} & ${pB} (${ciclo})`;
        participantes = [pA, pB];
      } else if (meetingMode === 'proceso') {
        const f = frentes.find(fr => fr.id === frenteId);
        defaultTitle = `Minuta de Proceso: ${f?.nombre_corto || frenteId} (${ciclo})`;
        fId = frenteId;
      }

      const titleToSave = minutaTitle.trim() || defaultTitle;

      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guardar_minuta',
          usuario: currentUser.nombre,
          minuta: {
            tipo_reunion: meetingMode === 'minutas' ? 'semanal_general' : meetingMode,
            titulo: titleToSave,
            participantes,
            frente_id: fId,
            acuerdos: acuerdosArray,
            temas_tratados: items.map(i => i.id)
          }
        })
      });

      const data = await res.json();
      if (data.success && data.minuta) {
        setMinutas(prev => [data.minuta, ...prev]);
        setSaveMinutaModalOpen(false);
        setMinutaTitle('');
        alert('Minuta y acuerdos guardados exitosamente.');
      }
    } catch (err) {
      console.error('Error guardando minuta:', err);
    } finally {
      setSavingMinuta(false);
    }
  };

  // Quick Inline Resolution: change interface status
  const handleQuickStatusChange = async (item: AgendaItem, newStatus: string) => {
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_status',
          entidadTipo: 'interfaz',
          entidadId: item.entidad_id,
          estado: newStatus,
          usuario: currentUser.nombre
        })
      });
      if (res.ok) {
        setItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, estado: newStatus } : i))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inline Approve for POR VALIDAR items
  const handleInlineApprove = async (item: AgendaItem) => {
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entidadTipo: item.entidad_tipo,
          id: item.entidad_id,
          accion: 'APROBADO',
          comentario: `Validado y aprobado directamente en reunión de agenda por ${currentUser.nombre}`,
          usuario: currentUser.nombre
        })
      });
      if (res.ok) {
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, estado: 'Validada', prioridad_efectiva: 'P3' }
              : i
          )
        );
      }
    } catch (err) {
      console.error('Error aprobando en sesión:', err);
    }
  };

  // Format timer seconds into mm:ss
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Render Card Component
  const renderAgendaCard = (item: AgendaItem) => {
    const isP1 = item.prioridad_efectiva === 'P1';
    const isP2 = item.prioridad_efectiva === 'P2';
    const currentAgreement = agreements[item.id] || '';

    return (
      <div
        key={item.id}
        className={`bg-white rounded-2xl border p-4 shadow-xs transition-all space-y-3 ${
          item.destacado_semana
            ? 'border-amber-400 ring-2 ring-amber-400/20'
            : isP1
            ? 'border-rose-200 hover:border-rose-300'
            : isP2
            ? 'border-amber-200 hover:border-amber-300'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* Pin Star Button */}
            <button
              type="button"
              onClick={() => handleToggleStar(item)}
              className={`p-1.5 rounded-lg transition-colors ${
                item.destacado_semana
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
              }`}
              title={item.destacado_semana ? 'Quitar estrella de prioridad' : 'Fijar como Prioridad ⭐ de la semana'}
            >
              <Star className={`w-4 h-4 ${item.destacado_semana ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>

            {/* Priority Selector Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => handleSetPriority(item, 'P1')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  item.prioridad_efectiva === 'P1'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                P1
              </button>
              <button
                onClick={() => handleSetPriority(item, 'P2')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  item.prioridad_efectiva === 'P2'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                P2
              </button>
              <button
                onClick={() => handleSetPriority(item, 'P3')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  item.prioridad_efectiva === 'P3'
                    ? 'bg-slate-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                P3
              </button>
            </div>

            {/* Entity Badge */}
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
              {item.entidad_tipo}
            </span>

            {/* Status Pill */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                item.estado === 'En riesgo' || item.estado === 'Bloqueada'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : item.estado === 'POR VALIDAR'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {item.estado}
            </span>

            {item.frente_nombre && (
              <span className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">
                📁 {item.frente_nombre}
              </span>
            )}
          </div>

          {/* Involved People */}
          {item.involucrados.length > 0 && (
            <div className="flex items-center space-x-1 text-[11px] text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.involucrados.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 leading-snug">{item.titulo}</h3>
          <p className="text-sm text-slate-700 font-editorial leading-relaxed">{item.subtitulo}</p>
        </div>

        {/* Action Bar / Recommended Focus */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-150 text-sm">
          <div className="flex items-center space-x-2 text-slate-800">
            <Sparkles className="w-4 h-4 text-[#F6911E] shrink-0" />
            <span className="leading-snug">
              <strong className="text-slate-900 font-semibold">Foco de la reunión:</strong> {item.accion_sugerida}
            </span>
          </div>

          {/* Quick Actions (e.g. resolve in meeting) */}
          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
            {item.entidad_tipo === 'interfaz' && (
              <div className="flex items-center space-x-1 text-[10px]">
                <span className="text-slate-400 text-[9px] uppercase font-bold">Cambiar a:</span>
                <button
                  onClick={() => handleQuickStatusChange(item, 'Operativa')}
                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold"
                >
                  Operativa
                </button>
                <button
                  onClick={() => handleQuickStatusChange(item, 'En riesgo')}
                  className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold"
                >
                  En riesgo
                </button>
              </div>
            )}

            {item.estado === 'POR VALIDAR' && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleInlineApprove(item)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-2xs"
                  title="Aprobar de común acuerdo en esta sesión"
                >
                  <Check className="w-3 h-3" />
                  <span>Aprobar aquí</span>
                </button>
                <Link
                  href="/validar"
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px] hover:bg-slate-200 transition-colors"
                >
                  <span>Revisar ficha</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Agreement Note Input */}
        <div className="pt-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Anotar acuerdo rápido de esta reunión para el tema (ej. 'Carlos entrega el jueves')..."
              value={currentAgreement}
              onChange={e => handleAgreementChange(item.id, e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F6911E] focus:border-[#F6911E]"
            />
          </div>
          {currentAgreement && (
            <span className="text-[10px] text-emerald-700 font-bold px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md shrink-0">
              ✓ Listo para minuta
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#191919] text-[#F6911E] rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                {textosMap['agenda.hero.title'] || 'Agenda Inteligente & Prioridades'}
              </h1>
              <p className="text-sm text-slate-500 font-editorial">
                {textosMap['agenda.hero.subtitle'] ||
                  'Estructuración ejecutiva de reuniones periódicas basada en bloqueos, decisiones y dependencias vivas.'}
              </p>
            </div>
          </div>
        </div>

        {/* Ciclo / Week Badge */}
        <div className="flex items-center space-x-2.5">
          <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ciclo: {ciclo}</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setMeetingMode('semanal')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              meetingMode === 'semanal'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-[#F6911E]" />
            <span>Semanal de Equipo (General)</span>
          </button>

          <button
            onClick={() => setMeetingMode('bilateral')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              meetingMode === 'bilateral'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-[#F6911E]" />
            <span>Bilateral (1 a 1)</span>
          </button>

          <button
            onClick={() => setMeetingMode('proceso')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              meetingMode === 'proceso'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-[#F6911E]" />
            <span>Por Proceso</span>
          </button>

          <button
            onClick={() => setMeetingMode('minutas')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              meetingMode === 'minutas'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Histórico de Minutas ({minutas.length})</span>
          </button>
        </div>

        {/* Global Meeting Actions */}
        {meetingMode !== 'minutas' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyAgenda}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              title="Copiar texto listo para pegar en Calendar, Slack o WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Agenda</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setLiveModeOpen(true);
                setTimerRunning(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Sesión en Vivo (30m)</span>
            </button>

            <button
              onClick={() => setSaveMinutaModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Guardar Minuta</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTEXT SELECTORS (BILATERAL / PROCESO) */}
      {meetingMode === 'bilateral' && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <User className="w-4 h-4 text-[#F6911E]" />
            <span>Participantes de la sesión 1 a 1:</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Persona A</label>
              <select
                value={personaAId}
                onChange={e => setPersonaAId(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                {personas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0 mt-3" />

            <div className="flex-1 sm:flex-initial">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Persona B</label>
              <select
                value={personaBId}
                onChange={e => setPersonaBId(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                {personas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {meetingMode === 'proceso' && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Layers className="w-4 h-4 text-[#F6911E]" />
            <span>Seleccionar Macroproceso a revisar:</span>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={frenteId}
              onChange={e => setFrenteId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {frentes.map(f => (
                <option key={f.id} value={f.id}>
                  {f.id}: {f.nombre_corto} {f.owner_nombre ? `(${f.owner_nombre})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* METRIC STRIP & TIME ESTIMATE */}
      {meetingMode !== 'minutas' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Temas en Agenda</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-slate-900">{items.length}</span>
              <span className="text-[11px] text-slate-400">total</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-900 flex items-center space-x-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Prioridades ⭐</span>
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-amber-900">{destacadosCount}</span>
              <span className="text-[10px] text-amber-700">fijadas hoy</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-rose-900">🔴 P1: Foco Crítico</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-rose-900">{p1Items.length}</span>
              <span className="text-[10px] text-rose-700 font-semibold">15 min sug.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/30 border border-amber-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-900">🟡 P2: Por Destrabar</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-amber-900">{p2Items.length}</span>
              <span className="text-[10px] text-amber-700 font-semibold">10 min sug.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-700">🟢 P3: Seguimiento</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-slate-700">{p3Items.length}</span>
              <span className="text-[10px] text-slate-500 font-semibold">5 min sug.</span>
            </div>
          </div>
        </div>
      )}

      {/* AGENDA CONTENT: 3 PRIORITY BLOCKS */}
      {meetingMode !== 'minutas' ? (
        <div className="space-y-8">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400 font-editorial animate-pulse">
              Compilando agenda y calculando prioridades operativas...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">¡Todo alineado! No hay temas en agenda</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se detectaron entregas en riesgo, decisiones bloqueadas ni validaciones pendientes para esta selección.
              </p>
            </div>
          )}

          {/* 1. BLOQUE P1: FOCO CRÍTICO */}
          {p1Items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-rose-500 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Bloque 1: Foco Crítico & Bloqueos ({p1Items.length})
                  </h2>
                  <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    15 min sugeridos
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-editorial hidden sm:inline">
                  Atención prioritaria: temas en riesgo o fijados con estrella
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {p1Items.map(item => renderAgendaCard(item))}
              </div>
            </div>
          )}

          {/* 2. BLOQUE P2: POR DESTRABAR / VALIDAR */}
          {p2Items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-amber-500 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Bloque 2: Por Destrabar & Validar ({p2Items.length})
                  </h2>
                  <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    10 min sugeridos
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-editorial hidden sm:inline">
                  Acuerdos propuestos, decisiones por gatillar y validaciones
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {p2Items.map(item => renderAgendaCard(item))}
              </div>
            </div>
          )}

          {/* 3. BLOQUE P3: SEGUIMIENTO OPERATIVO */}
          {p3Items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Bloque 3: Seguimiento & Criterio ({p3Items.length})
                  </h2>
                  <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    5 min sugeridos
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-editorial hidden sm:inline">
                  Operatividad ordinaria y principios transversales
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {p3Items.slice(0, 10).map(item => renderAgendaCard(item))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* HISTÓRICO DE MINUTAS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Registro histórico de minutas y acuerdos alcanzados en sesiones periódicas.
            </p>
          </div>

          {minutas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">Aún no se han guardado minutas de reunión.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {minutas.map(m => {
                let acuerdos: any[] = [];
                let participantes: string[] = [];
                try {
                  acuerdos = JSON.parse(m.acuerdos_json || '[]');
                  participantes = JSON.parse(m.participantes_json || '[]');
                } catch (e) {
                  // ignore
                }

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{m.titulo}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {m.tipo_reunion}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Registrada por <strong>{m.created_by}</strong> el{' '}
                          {new Date(m.created_at).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {participantes.length > 0 && (
                        <div className="flex items-center space-x-1 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                            Asistentes:
                          </span>
                          {participantes.map((p, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-medium"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {acuerdos.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Acuerdos Tomados ({acuerdos.length}):
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {acuerdos.map((ac, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start space-x-2.5"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-slate-800">{ac.acuerdo}</p>
                                {ac.responsable && (
                                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                    Responsable: {ac.responsable}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Sin acuerdos registrados en esta minuta.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIVE MEETING FOCUS MODAL */}
      {liveModeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Live Header with Countdown */}
            <div className="bg-[#191919] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#F6911E] text-[#191919]">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Sesión en Vivo: Agenda Inteligente</h2>
                  <span className="text-xs text-slate-400">Ciclo {ciclo} • Modo enfocado</span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center space-x-3">
                <div
                  className={`px-3 py-1.5 rounded-xl font-mono text-sm font-bold flex items-center space-x-2 ${
                    liveTimerSeconds <= 5 * 60
                      ? 'bg-rose-900/80 text-rose-200 border border-rose-700 animate-pulse'
                      : 'bg-slate-800 text-white border border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#F6911E]" />
                  <span>{formatTimer(liveTimerSeconds)}</span>
                </div>

                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {timerRunning ? 'Pausar' : 'Reanudar'}
                </button>

                <button
                  onClick={() => setLiveModeOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                  <span className="font-bold uppercase tracking-wider text-slate-800">
                    Puntos ordenados por prioridad de impacto ({items.length})
                  </span>
                  <span>Anota acuerdos en cada punto durante la llamada</span>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                      item.prioridad_efectiva === 'P1'
                        ? 'border-rose-300 bg-rose-50/20'
                        : item.prioridad_efectiva === 'P2'
                        ? 'border-amber-200 bg-amber-50/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.prioridad_efectiva === 'P1'
                              ? 'bg-rose-600 text-white'
                              : item.prioridad_efectiva === 'P2'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-600 text-white'
                          }`}
                        >
                          {item.prioridad_efectiva}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{item.titulo}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{item.involucrados.join(', ')}</span>
                    </div>

                    <p className="text-xs text-slate-600 pl-6">{item.subtitulo}</p>

                    <div className="pl-6 pt-1">
                      <input
                        type="text"
                        placeholder="Escribir acuerdo de esta sesión..."
                        value={agreements[item.id] || ''}
                        onChange={e => handleAgreementChange(item.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleCopyAgenda}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar agenda con acuerdos</span>
              </button>

              <button
                onClick={() => {
                  setLiveModeOpen(false);
                  setSaveMinutaModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Finalizar Sesión & Guardar Minuta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE MINUTA MODAL */}
      {saveMinutaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Guardar Minuta de la Reunión</h2>
              <button
                onClick={() => setSaveMinutaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Título de la Sesión:</label>
                <input
                  type="text"
                  placeholder={`Ej: Sesión Semanal ${ciclo}`}
                  value={minutaTitle}
                  onChange={e => setMinutaTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold"
                />
              </div>

              <div>
                <span className="block text-slate-600 font-semibold mb-1">
                  Acuerdos Registrados ({Object.values(agreements).filter(Boolean).length}):
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {Object.entries(agreements).filter(([_, val]) => val && val.trim()).length === 0 ? (
                    <p className="text-slate-400 italic p-2">
                      No anotaste acuerdos en los temas. Puedes guardar la minuta igualmente para registrar la sesión.
                    </p>
                  ) : (
                    Object.entries(agreements)
                      .filter(([_, val]) => val && val.trim())
                      .map(([itemId, val], idx) => {
                        const it = items.find(i => i.id === itemId);
                        return (
                          <div key={idx} className="p-2 rounded bg-white border border-slate-200 text-[11px]">
                            <span className="font-bold text-slate-800 block truncate">{it?.titulo}</span>
                            <span className="text-emerald-700 font-medium">✓ {val}</span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSaveMinutaModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMinuta}
                disabled={savingMinuta}
                className="px-4 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors disabled:opacity-50"
              >
                {savingMinuta ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
