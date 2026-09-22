import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getFrenteById,
  getResponsabilidadesByFrente,
  getAllResultados,
  getAllDecisiones,
  getAllInterfaces,
  getPrincipiosByFrente,
  getStructuralAlerts
} from '@/lib/queries';
import {
  Shield,
  Target,
  Users,
  GitCommit,
  ArrowLeftRight,
  BookOpen,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Check
} from 'lucide-react';
import Tooltip, { InfoTooltip } from '@/components/Tooltip';

export const dynamic = 'force-dynamic';

export default async function FrenteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const frente = getFrenteById(id);

  if (!frente) {
    notFound();
  }

  const responsabilidades = getResponsabilidadesByFrente(id);
  const resultados = getAllResultados().filter(r => r.frente_id === id);
  const decisiones = getAllDecisiones().filter(d => d.frente_id === id);
  const interfaces = getAllInterfaces().filter(i => (i.frentes_relacionados || '').includes(id));
  const principios = getPrincipiosByFrente(id);
  const alerts = getStructuralAlerts().filter(a => a.frente_id === id);

  // Group responsibilities strictly by role (Requirement 11 order: Owner, Decide, Ejecuta, Contribuye, Informado)
  const roleGroups: Record<string, typeof responsabilidades> = {
    'Owner': [],
    'Decide': [],
    'Ejecuta': [],
    'Contribuye': [],
    'Informado': [],
    'Otros': []
  };

  for (const r of responsabilidades) {
    const activeRole = (r.rol_validado || r.rol_propuesto || '').toLowerCase();
    if (activeRole.includes('owner')) roleGroups['Owner'].push(r);
    else if (activeRole.includes('decide')) roleGroups['Decide'].push(r);
    else if (activeRole.includes('ejecuta')) roleGroups['Ejecuta'].push(r);
    else if (activeRole.includes('contribuye')) roleGroups['Contribuye'].push(r);
    else if (activeRole.includes('informado')) roleGroups['Informado'].push(r);
    else roleGroups['Otros'].push(r);
  }

  return (
    <div className="space-y-8">
      {/* Back button & header */}
      <div>
        <Link
          href="/procesos"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al catálogo de procesos</span>
        </Link>

        {/* 1. IDENTIDAD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                {frente.id}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {frente.tipo_frente}
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-2 flex-wrap gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {frente.nombre_corto}
              </h1>
              <Tooltip
                position="right"
                maxWidth="max-w-md"
                content={
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#FFAA34] tracking-wider block">
                      Nombre de Origen (Matriz Base)
                    </span>
                    <p className="text-xs text-slate-200 mt-1 font-mono leading-relaxed">
                      {frente.nombre_original.replace(/\n/g, ' ')}
                    </p>
                  </div>
                }
              >
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-help transition-colors">
                  📋 Origen Base
                </span>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Owner del Proceso
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {frente.owner_nombre ? frente.owner_nombre.charAt(0) : '?'}
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {frente.owner_nombre || 'Sin asignar'}
                </span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Estado
              </span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {frente.estado_validacion}
              </span>
            </div>
          </div>
        </div>

        {/* APORTE ESTRATÉGICO AL TARGET */}
        {frente.aporte_estrategico && (
          <div className="mt-4 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white rounded-xl border border-orange-200/80 p-5 shadow-sm space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                🎯 Aporte Clave a la Estrategia (Entender al Target Mejor que Nadie)
              </span>
            </div>
            <p className="text-sm text-slate-800 font-editorial leading-relaxed pl-0.5">
              {frente.aporte_estrategico}
            </p>
          </div>
        )}
      </div>

      {/* ALERTAS DEL FRENTE (Requirement 11) */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Alertas Estructurales ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.map(a => (
              <div key={a.id} className="p-2.5 rounded-lg bg-white/90 border border-amber-200 text-xs">
                <strong className="text-slate-900">{a.titulo}: </strong>
                <span className="text-slate-700">{a.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. RESULTADO ESPERADO Y MÉTRICAS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Resultados Esperados & Indicadores</span>
        </div>

        {resultados.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hay resultados definidos para este proceso.</p>
        ) : (
          <div className="space-y-4">
            {resultados.map((res) => (
              <div key={res.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {res.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {res.resultado_validado || res.resultado_propuesto}
                    </h3>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    res.estado === 'Bien' ? 'bg-emerald-100 text-emerald-800' :
                    res.estado === 'Atención' ? 'bg-amber-100 text-amber-800' :
                    res.estado === 'Crítico' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {res.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 font-semibold block">Indicador Sugerido:</span>
                    <p className="text-slate-700 mt-0.5">{res.indicador_validado || res.indicador_sugerido || 'Por definir'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Responsable del resultado:</span>
                    <p className="text-slate-700 mt-0.5 font-medium">{res.owner_nombre || 'Sin definir'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. QUIÉN HACE QUÉ (Agrupadas por Rol estrictamente) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">
              Quién Hace Qué ({responsabilidades.length} Responsabilidades)
            </h2>
            <InfoTooltip
              content="Jerarquía de accountability: Owner (Dueño y responsable de entrega) → Decide (Autoridad de arbitraje) → Ejecuta (Manos a la obra) → Contribuye (Aporte activo) → Informado (Notificado)."
              position="top"
              maxWidth="max-w-xs"
            />
          </div>
        </div>

        {['Owner', 'Decide', 'Ejecuta', 'Contribuye', 'Informado', 'Otros'].map((roleKey) => {
          const list = roleGroups[roleKey];
          if (!list || list.length === 0) return null;

          return (
            <div key={roleKey} className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${
                  roleKey === 'Owner' ? 'bg-purple-600' :
                  roleKey === 'Decide' ? 'bg-amber-500' :
                  roleKey === 'Ejecuta' ? 'bg-emerald-500' :
                  roleKey === 'Contribuye' ? 'bg-blue-500' : 'bg-slate-400'
                }`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rol: {roleKey} ({list.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {r.persona_nombre ? r.persona_nombre.charAt(0) : '?'}
                        </span>
                        <span>{r.persona_nombre}</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {r.id}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">
                      {r.responsabilidad_original}
                    </p>

                    {r.comentario_propuesta && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 font-medium">
                        💡 <strong>Calibración Owner:</strong> {r.comentario_propuesta}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      <span>Origen: {r.celda_origen}</span>
                      <span className="font-mono">{r.rol_validado || r.rol_propuesto}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. DECISIONES Y 5. INTERFACES (Grid 2 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DECISIONES */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            <GitCommit className="w-4 h-4 text-amber-600" />
            <span>Decisiones del Proceso ({decisiones.length})</span>
          </div>

          {decisiones.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay decisiones asignadas a este proceso.</p>
          ) : (
            <div className="space-y-3">
              {decisiones.map((d) => (
                <div key={d.id} className="p-3.5 rounded-lg bg-amber-50/40 border border-amber-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{d.decision}</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-amber-900 border border-amber-200">
                      {d.id}
                    </span>
                  </div>
                  <div className="text-slate-600 space-y-1 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-700">Decisor: </span>
                      <strong className="text-slate-900 font-bold">{d.decisor_nombre || 'Sin asignar'}</strong>
                    </div>
                    {d.consultar_a_propuesto && (
                      <div>
                        <span className="font-semibold text-slate-700">Consultar a: </span>
                        <span>{d.consultar_a_validado || d.consultar_a_propuesto}</span>
                      </div>
                    )}
                    {d.momento_trigger && (
                      <div>
                        <span className="font-semibold text-slate-700">Momento: </span>
                        <span>{d.momento_trigger}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INTERFACES */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>Interfaces y Dependencias ({interfaces.length})</span>
          </div>

          {interfaces.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay interfaces conectadas directamente a este proceso.</p>
          ) : (
            <div className="space-y-3">
              {interfaces.map((i) => (
                <div key={i.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {i.de_persona_nombre} ➔ {i.hacia_persona_nombre}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {i.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Input entregado:</span>
                    <p className="text-slate-800">{i.entrega_input}</p>
                  </div>
                  {i.devuelve_output && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Output devuelto:</span>
                      <p className="text-slate-600">{i.devuelve_output}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. PRINCIPIOS APLICABLES */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Principios Transversales en este Proceso</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {principios.map((pr) => (
            <div key={pr.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{pr.principio}</span>
                <span className="font-mono text-[10px] text-slate-400">{pr.id}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {pr.interpretacion_propuesta}
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Aplicación:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {pr.aplicacion}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
