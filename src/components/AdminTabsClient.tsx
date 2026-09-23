'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/UserContext';
import { isUserAdmin } from '@/lib/auth';
import { TextoSistema } from '@/lib/db';
import { Frente, Persona, Decision, Interfaz, Responsabilidad, Principio } from '@/lib/types';
import AdminTextosClient from './AdminTextosClient';
import AdminEntitiesClient from './AdminEntitiesClient';
import { FileText, Database, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { logoutAdminAction } from '@/app/admin/actions';
import { useRouter } from 'next/navigation';

interface AdminTabsClientProps {
  initialTextos: TextoSistema[];
  initialFrentes: (Frente & { owner_nombre: string | null })[];
  initialPersonas: Persona[];
  initialDecisiones: (Decision & { frente_nombre: string; decisor_nombre: string | null })[];
  initialInterfaces: Interfaz[];
  initialResponsabilidades: (Responsabilidad & { frente_nombre: string; persona_nombre: string })[];
  initialPrincipios: Principio[];
}

export default function AdminTabsClient(props: AdminTabsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'textos' | 'entidades'>('textos');
  const [textos, setTextos] = useState<TextoSistema[]>(props.initialTextos);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAdminAction();
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const getText = (clave: string, defaultVal: string) => {
    const found = textos.find(t => t.clave === clave);
    return found ? found.valor : defaultVal;
  };

  const tab1Name = getText('admin.tab1.name', '1. Textos y Etiquetas (CMS)');
  const tab2Name = getText('admin.tab2.name', '2. Entidades Organizacionales (CRUD)');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#191919] text-[#F6911E] rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                Administrador del Sistema
              </h1>
              <p className="text-sm text-slate-500 font-editorial">
                Gestión de contenidos fijos, etiquetas de la plataforma y entidades organizacionales.
              </p>
            </div>
          </div>
        </div>

        {/* Admin status pill & Logout */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Administrador Autenticado</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('textos')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'textos'
              ? 'border-[#F6911E] text-[#191919] bg-orange-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4 text-[#F6911E]" />
          <span>{tab1Name}</span>
        </button>

        <button
          onClick={() => setActiveTab('entidades')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'entidades'
              ? 'border-[#F6911E] text-[#191919] bg-orange-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Database className="w-4 h-4 text-[#F6911E]" />
          <span>{tab2Name}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'textos' ? (
          <AdminTextosClient initialTextos={textos} onUpdateTextos={setTextos} />
        ) : (
          <AdminEntitiesClient
            initialFrentes={props.initialFrentes}
            initialPersonas={props.initialPersonas}
            initialDecisiones={props.initialDecisiones}
            initialInterfaces={props.initialInterfaces}
            initialResponsabilidades={props.initialResponsabilidades}
            initialPrincipios={props.initialPrincipios}
            textos={textos}
          />
        )}
      </div>
    </div>
  );
}
