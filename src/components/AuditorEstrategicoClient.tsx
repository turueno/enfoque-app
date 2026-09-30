'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AuditoriaEstrategicaReport,
  AuditoriaEstrategicaItem,
  AssistantChatMessage,
  HipotesisSolucion
} from '@/lib/types';
import {
  ShieldAlert,
  Sparkles,
  Bot,
  Compass,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Send,
  MessageSquare,
  RefreshCw,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Calendar,
  X
} from 'lucide-react';
import { useUser } from './UserContext';

interface AuditorEstrategicoClientProps {
  initialReport: AuditoriaEstrategicaReport;
}

export default function AuditorEstrategicoClient({
  initialReport
}: AuditorEstrategicoClientProps) {
  const { currentUser } = useUser();
  const [report, setReport] = useState<AuditoriaEstrategicaReport>(initialReport);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'alta' | 'media' | 'baja'>('ALL');

  // Drawer / Copiloto State
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuditoriaEstrategicaItem | null>(null);
  const [chatMessages, setChatMessages] = useState<AssistantChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Quick action feedback
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/auditor-estrategico');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setReport(json.data);
        }
      }
    } catch (err) {
      console.error('Error al refrescar auditoría:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const openAssistantForItem = (item: AuditoriaEstrategicaItem) => {
    setSelectedItem(item);
    setChatMessages([
      {
        role: 'assistant',
        content: `Hola. He cargado el contexto de: **"${item.titulo}"**.\n\nEste punto impacta el principio de **${item.principio_transversal}** en el proceso de **${item.proceso_afectado || 'Operación'}**.\n\n¿Deseas profundizar en las implicaciones operativas, afilar una hipótesis alternativa o redactar un acuerdo para la minuta de la semana?`
      }
    ]);
    setAssistantOpen(true);
  };

  const openGeneralAssistant = () => {
    setSelectedItem(null);
    setChatMessages([
      {
        role: 'assistant',
        content: `Hola ${currentUser?.nombre || ''}. Soy tu Copiloto Estratégico de Gobernanza. He auditado la agenda y los procesos contra la Estrategia PHPVKS 3.0 (*A quién, Cómo, Desde dónde* y los 7 procesos clave).\n\n¿Sobre qué frente o fricción operativa te gustaría rebotar ideas o simular soluciones?`
      }
    ]);
    setAssistantOpen(true);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const newMessages: AssistantChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userText }
    ];
    setChatMessages(newMessages);
    setSendingMessage(true);

    try {
      const res = await fetch('/api/auditor-estrategico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensajes: newMessages,
          contextoItem: selectedItem
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.respuesta) {
          setChatMessages([
            ...newMessages,
            { role: 'assistant', content: data.respuesta }
          ]);
          return;
        }
      }
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Ocurrió un inconveniente al generar la respuesta. Por favor intenta reformular o pulsar de nuevo.'
        }
      ]);
    } catch (err) {
      console.error('Error enviando mensaje a copiloto:', err);
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'No fue posible conectar con el asistente. Verifica la conexión o el estado de la API.'
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCopyAcuerdo = (sol: HipotesisSolucion) => {
    const textToCopy = sol.acuerdo_propuesto || sol.accion_sugerida;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAction(sol.id);
    setTimeout(() => setCopiedAction(null), 3000);
  };

  const filteredItems = report.items.filter(it => {
    if (activeFilter === 'ALL') return true;
    return it.severidad === activeFilter;
  });

  const getSeveridadBadge = (sev: 'alta' | 'media' | 'baja') => {
    switch (sev) {
      case 'alta':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Alta Desalineación</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Atención Estratégica</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Oportunidad Menor</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Resumen Ejecutivo y Salud Estratégica */}
      <div className="bg-[#191919] rounded-2xl p-6 sm:p-8 text-white shadow-xl border-l-8 border-[#F6911E] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-[#F6911E]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFAA34]/20 text-[#FFAA34] text-xs font-bold uppercase tracking-wider border border-[#FFAA34]/30">
                <Compass className="w-3.5 h-3.5 text-[#F6911E]" />
                <span>Auditor de Alineación Estratégica & Principios 3.0</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {report.modelUsed ? `Auditado con ${report.modelUsed}` : 'Motor Heurístico Determinista'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Vigilancia de la Estrategia PHPVKS en la Operación y Agenda
            </h1>

            <p className="text-sm text-slate-300 font-editorial leading-relaxed">
              Audita que la agenda semanal, las interfaces entre personas y las decisiones no deriven en investigación plana ni burocracia, sino que sostengan el principio de <strong className="text-white font-semibold">entender el target mejor que nadie</strong> con oficio artesanal e hipótesis afiladas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Re-auditando...' : 'Re-auditar'}</span>
            </button>

            <button
              onClick={openGeneralAssistant}
              className="px-4 py-2.5 rounded-xl bg-[#F6911E] hover:bg-[#e07f15] text-[#191919] text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#F6911E]/20"
            >
              <Bot className="w-4 h-4" />
              <span>Copiloto Estratégico (IA)</span>
            </button>
          </div>
        </div>

        {/* Semáforo de Salud y Recomendación Inmediata */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Diagnóstico General</span>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                report.resumen_ejecutivo.nivel_salud_estrategica === 'Riesgo de Desalineación'
                  ? 'bg-rose-500 animate-pulse'
                  : report.resumen_ejecutivo.nivel_salud_estrategica === 'Requiere Atención'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`} />
              <span className="text-sm font-bold text-white">
                {report.resumen_ejecutivo.nivel_salud_estrategica}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              {report.resumen_ejecutivo.total_observaciones} puntos evaluados en agenda y frentes
            </p>
          </div>

          <div className="md:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-[#FFAA34] block mb-1">Recomendación Inmediata para el Comité Directivo</span>
            <p className="text-slate-200 leading-relaxed font-editorial">
              "{report.resumen_ejecutivo.recomendacion_inmediata}"
            </p>
          </div>
        </div>
      </div>

      {/* Filtros de Severidad */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2">
          {(['ALL', 'alta', 'media', 'baja'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === f
                  ? 'bg-[#191919] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'ALL' ? 'Todos los hallazgos' : f === 'alta' ? 'Alta severidad' : f === 'media' ? 'Atención' : 'Menor'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Mostrando {filteredItems.length} de {report.items.length} auditorías
        </span>
      </div>

      {/* Lista de Fichas de Auditoría: Diagnóstico + Implicaciones + Hipótesis */}
      <div className="space-y-6">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
          >
            {/* Header del Hallazgo */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  {getSeveridadBadge(item.severidad)}
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[11px] font-bold">
                    Principio: {item.principio_transversal}
                  </span>
                  {item.proceso_afectado && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{item.proceso_afectado}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {item.titulo}
                </h3>
              </div>

              <button
                onClick={() => openAssistantForItem(item)}
                className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F6911E] text-xs font-bold border border-[#F6911E]/30 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Profundizar con Copiloto</span>
              </button>
            </div>

            {/* Cuerpo: Triada Diagnóstico -> Implicaciones -> Pregunta */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Diagnóstico de Alineación */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>1. Diagnóstico de Desalineación</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-editorial">
                    {item.diagnostico_alineacion}
                  </p>
                </div>

                {/* 2. Implicaciones Operativas y Estratégicas */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Comprensión de Implicaciones</span>
                  </div>
                  <p className="text-amber-950 leading-relaxed font-editorial">
                    {item.implicaciones_operativas}
                  </p>
                </div>
              </div>

              {/* Pregunta Directiva Retadora */}
              <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-[#191919] font-bold text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F6911E]" />
                  <span>Pregunta Clave para la Mesa Directiva:</span>
                </div>
                <p className="text-[#191919] font-bold text-sm italic">
                  "{item.pregunta_directiva}"
                </p>
              </div>

              {/* 3. Hipótesis & Ideas de Solución Plausibles */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F6911E]" />
                  <span>3. Hipótesis e Ideas de Solución Plausibles</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {item.hipotesis_soluciones.map(sol => (
                    <div
                      key={sol.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1 text-xs">
                        <h4 className="font-bold text-slate-900">{sol.titulo}</h4>
                        <p className="text-slate-600 font-editorial leading-relaxed text-[11px]">
                          {sol.explicacion}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{sol.accion_sugerida}</span>
                        {sol.acuerdo_propuesto && (
                          <button
                            onClick={() => handleCopyAcuerdo(sol)}
                            className="inline-flex items-center space-x-1 text-[#F6911E] hover:text-[#e07f15] font-bold"
                          >
                            <span>{copiedAction === sol.id ? '¡Copiado!' : 'Copiar Acuerdo'}</span>
                            <FileCheck className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enlaces de Acción en Plataforma */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <span>Involucrados:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.involucrados.map((inv, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {inv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Link
                    href="/agenda"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                  >
                    <span>Ir a Agenda Semanal</span>
                    <Calendar className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer / Modal Lateral del Copiloto Estratégico */}
      {assistantOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
            {/* Header del Copiloto */}
            <div className="p-4 border-b border-slate-200 bg-[#191919] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F6911E] text-[#191919] flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Copiloto Estratégico IA</h3>
                  <p className="text-[11px] text-slate-400 font-editorial">
                    {selectedItem ? `Anclado a: ${selectedItem.titulo.slice(0, 30)}...` : 'Modo Consulta General de Estrategia'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed font-editorial ${
                      msg.role === 'user'
                        ? 'bg-[#191919] text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl p-3 text-slate-500 text-xs flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#F6911E] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#F6911E] animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-[#F6911E] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-medium text-slate-600">Razonando implicaciones...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input y Sugerencias Rápidas */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setInputMessage('¿Cómo redactarías este acuerdo para la minuta de hoy?')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium"
                >
                  📝 Redactar acuerdo
                </button>
                <button
                  type="button"
                  onClick={() => setInputMessage('Explícame el impacto de segundo orden si no resolvemos esto este mes.')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium"
                >
                  ⚠️ Impacto de no actuar
                </button>
                <button
                  type="button"
                  onClick={() => setInputMessage('Dame una hipótesis de solución intermedia o piloto rápido.')}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium"
                >
                  💡 Solución piloto
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Pregunta o pide afinar una solución..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F6911E]/40 focus:border-[#F6911E]"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sendingMessage}
                  className="p-2 rounded-xl bg-[#F6911E] text-[#191919] hover:bg-[#e07f15] disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
