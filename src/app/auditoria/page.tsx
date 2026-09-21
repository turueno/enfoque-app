import React from 'react';
import { getAuditoriaLogs } from '@/lib/queries';
import { History, ShieldCheck, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AuditoriaPage() {
  const logs = getAuditoriaLogs(150);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bitácora de Auditoría y Trazabilidad
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registro cronológico inmutable de cambios en Owners, Roles, Decisiones, Interfaces y Estados de Validación.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Total eventos: {logs.length}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-3 pl-4">Fecha / Hora</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">ID</th>
                <th className="p-3">Campo</th>
                <th className="p-3">Valor Anterior</th>
                <th className="p-3">Valor Nuevo</th>
                <th className="p-3 pr-4">Motivo / Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 pl-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="p-3 font-medium text-slate-800 flex items-center space-x-1.5 whitespace-nowrap">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.usuario}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {log.entidad_tipo === 'frente' ? 'proceso' : log.entidad_tipo}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600 font-bold whitespace-nowrap">
                    {log.entidad_id}
                  </td>
                  <td className="p-3 text-slate-700 font-medium whitespace-nowrap">
                    {log.campo}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px] max-w-[150px] truncate">
                    {log.valor_anterior || '—'}
                  </td>
                  <td className="p-3 font-mono text-slate-900 font-semibold text-[11px] max-w-[200px] truncate">
                    {log.valor_nuevo || '—'}
                  </td>
                  <td className="p-3 pr-4 text-slate-500 text-[11px] max-w-[220px] truncate">
                    {log.motivo || 'Actualización de estado'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
