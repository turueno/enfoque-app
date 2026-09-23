'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginAdminAction } from '@/app/admin/actions';

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await loginAdminAction(password);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Contraseña incorrecta');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al intentar iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-[#F6911E] mb-1">
              <Lock className="w-6 h-6 text-[#F6911E]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#191919]">
              Área de Administración
            </h1>
            <p className="text-xs text-slate-500 font-editorial leading-relaxed">
              Esta sección está reservada para el administrador del sistema. Permite editar textos fijos, etiquetas globales y entidades organizacionales de ENFOQUE.
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Contraseña de Administrador
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F6911E] focus:border-transparent transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#191919] hover:bg-[#F6911E] hover:text-[#191919] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Verificando acceso...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar a Ajustes</span>
                </>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la plataforma pública</span>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          ENFOQUE • Acceso restringido para control de gobernanza
        </p>
      </div>
    </div>
  );
}
