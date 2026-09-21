'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextoSistema } from '@/lib/db';
import { useUser } from '@/components/UserContext';
import { isUserAdmin } from '@/lib/auth';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit3,
  Sliders
} from 'lucide-react';

interface AdminTextosClientProps {
  initialTextos: TextoSistema[];
  onUpdateTextos?: (textos: TextoSistema[]) => void;
}

export default function AdminTextosClient({ initialTextos, onUpdateTextos }: AdminTextosClientProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const isAdmin = isUserAdmin(currentUser.id, currentUser.email);

  const [textos, setTextos] = useState<TextoSistema[]>(initialTextos);
  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const t of initialTextos) {
      init[t.clave] = t.valor;
    }
    return init;
  });

  const [previews, setPreviews] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMessages, setStatusMessages] = useState<Record<string, { type: 'success' | 'error'; msg: string }>>({});
  const [activeSection, setActiveSection] = useState<string>('ALL');

  const sections = ['ALL', ...Array.from(new Set(textos.map(t => t.seccion)))];

  const filteredTextos = textos.filter(t => activeSection === 'ALL' || t.seccion === activeSection);

  const handleValueChange = (clave: string, val: string) => {
    setEditedValues(prev => ({ ...prev, [clave]: val }));
  };

  const togglePreview = (clave: string) => {
    setPreviews(prev => ({ ...prev, [clave]: !prev[clave] }));
  };

  const handleSave = async (clave: string) => {
    if (!isAdmin) {
      alert('Solo los administradores autorizados pueden guardar cambios.');
      return;
    }

    setSavingKey(clave);
    setStatusMessages(prev => ({ ...prev, [clave]: undefined as any }));

    try {
      const res = await fetch('/api/admin/textos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave,
          valor: editedValues[clave],
          usuario: currentUser.nombre,
          userId: currentUser.id,
          userEmail: currentUser.email
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setTextos(prev => {
        const next = prev.map(t => (t.clave === clave ? { ...t, valor: editedValues[clave], updated_at: new Date().toISOString() } : t));
        if (onUpdateTextos) onUpdateTextos(next);
        return next;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('enfoque:textos-updated', {
          detail: { clave, valor: editedValues[clave] }
        }));
      }
      router.refresh();

      setStatusMessages(prev => ({
        ...prev,
        [clave]: { type: 'success', msg: 'Guardado correctamente' }
      }));

      setTimeout(() => {
        setStatusMessages(prev => {
          const next = { ...prev };
          delete next[clave];
          return next;
        });
      }, 3000);
    } catch (err: any) {
      setStatusMessages(prev => ({
        ...prev,
        [clave]: { type: 'error', msg: err.message }
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const handleReset = async (clave: string) => {
    if (!isAdmin) {
      alert('Solo los administradores autorizados pueden restablecer valores.');
      return;
    }

    const t = textos.find(item => item.clave === clave);
    if (!t) return;

    if (!confirm(`¿Restablecer este texto a su valor de fábrica predeterminado?\n\n"${t.valor_por_defecto}"`)) {
      return;
    }

    setSavingKey(clave);
    try {
      const res = await fetch('/api/admin/textos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clave,
          reset: true,
          usuario: currentUser.nombre,
          userId: currentUser.id,
          userEmail: currentUser.email
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restablecer');

      setEditedValues(prev => ({ ...prev, [clave]: t.valor_por_defecto }));
      setTextos(prev => {
        const next = prev.map(item => (item.clave === clave ? { ...item, valor: t.valor_por_defecto } : item));
        if (onUpdateTextos) onUpdateTextos(next);
        return next;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('enfoque:textos-updated', {
          detail: { clave, valor: t.valor_por_defecto }
        }));
      }
      router.refresh();

      setStatusMessages(prev => ({
        ...prev,
        [clave]: { type: 'success', msg: 'Restablecido al valor de fábrica' }
      }));

      setTimeout(() => {
        setStatusMessages(prev => {
          const next = { ...prev };
          delete next[clave];
          return next;
        });
      }, 3000);
    } catch (err: any) {
      setStatusMessages(prev => ({
        ...prev,
        [clave]: { type: 'error', msg: err.message }
      }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-1 flex items-center space-x-1">
          <Sliders className="w-3.5 h-3.5" />
          <span>Sección:</span>
        </span>
        {sections.map(sec => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeSection === sec
                ? 'bg-[#191919] text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {sec === 'ALL' ? `Todas (${textos.length})` : sec}
          </button>
        ))}
      </div>

      {/* Texts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTextos.map(t => {
          const isModified = editedValues[t.clave] !== t.valor;
          const isDifferentFromDefault = editedValues[t.clave] !== t.valor_por_defecto;
          const isPreviewing = previews[t.clave];
          const status = statusMessages[t.clave];

          return (
            <div
              key={t.clave}
              className={`bg-white rounded-xl border p-5 transition-all shadow-xs space-y-3 ${
                isModified ? 'border-[#F6911E] ring-1 ring-[#F6911E]/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">{t.etiqueta}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {t.clave}
                    </span>
                    {t.tipo_campo === 'markdown' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                        Markdown Ligero
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                    Sección: <strong className="text-slate-600">{t.seccion}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {t.tipo_campo === 'markdown' && (
                    <button
                      type="button"
                      onClick={() => togglePreview(t.clave)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    >
                      {isPreviewing ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isPreviewing ? 'Editar' : 'Vista Previa'}</span>
                    </button>
                  )}

                  {isDifferentFromDefault && (
                    <button
                      type="button"
                      onClick={() => handleReset(t.clave)}
                      disabled={!isAdmin || savingKey === t.clave}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
                      title="Restablecer al valor original de fábrica"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Original</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSave(t.clave)}
                    disabled={!isAdmin || savingKey === t.clave || !isModified}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                      isModified
                        ? 'bg-[#F6911E] text-[#191919] hover:bg-[#FFAA34]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingKey === t.clave ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>

              {/* Edit Area or Preview */}
              {isPreviewing ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm font-sans text-slate-800 leading-relaxed">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Vista previa renderizada:
                  </span>
                  <MarkdownRenderer content={editedValues[t.clave]} />
                </div>
              ) : t.tipo_campo === 'textarea' || t.tipo_campo === 'markdown' ? (
                <textarea
                  rows={t.tipo_campo === 'markdown' ? 4 : 2}
                  disabled={!isAdmin}
                  value={editedValues[t.clave]}
                  onChange={e => handleValueChange(t.clave, e.target.value)}
                  className="w-full p-3 bg-slate-50 hover:bg-white focus:bg-white text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F6911E]/30 focus:border-[#F6911E] transition-all disabled:opacity-60 leading-relaxed"
                  placeholder="Escribe el texto aquí..."
                />
              ) : (
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={editedValues[t.clave]}
                  onChange={e => handleValueChange(t.clave, e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F6911E]/30 focus:border-[#F6911E] transition-all disabled:opacity-60 font-medium"
                  placeholder="Escribe el texto aquí..."
                />
              )}

              {/* Status and Hint */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Valor de fábrica:{' '}
                  <span className="italic text-slate-500 line-clamp-1 max-w-lg">
                    "{t.valor_por_defecto}"
                  </span>
                </span>
                {status && (
                  <span
                    className={`inline-flex items-center space-x-1 font-semibold ${
                      status.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {status.type === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{status.msg}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
