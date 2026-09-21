'use client';

import React, { useState } from 'react';
import { useUser } from '@/components/UserContext';
import { isUserAdmin } from '@/lib/auth';
import { TextoSistema } from '@/lib/db';
import { Frente, Persona, Decision, Interfaz, Responsabilidad, Principio } from '@/lib/types';
import AdminTextosClient from './AdminTextosClient';
import AdminEntitiesClient from './AdminEntitiesClient';
import { FileText, Database, ShieldAlert, ShieldCheck, Settings } from 'lucide-react';

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
  const { currentUser } = useUser();
  const isAdmin = isUserAdmin(currentUser.id, currentUser.email);
  const [activeTab, setActiveTab] = useState<'textos' | 'entidades'>('textos');
  const [textos, setTextos] = useState<TextoSistema[]>(props.initialTextos);

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

        {/* Admin status pill */}
        <div className="flex items-center space-x-3">
          {isAdmin ? (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Acceso Autorizado: Administrador</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Modo Lectura (Sin permisos de edición)</span>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Acceso restringido para modificaciones</p>
            <p className="mt-0.5 text-amber-800">
              Estás conectado con la identidad <span className="font-semibold">{currentUser.nombre}</span> ({currentUser.email}). 
              Puedes consultar todos los textos y entidades, pero solo los usuarios administradores (ej. José Antonio Turueño) pueden guardar cambios o crear nuevos registros. 
              Usa el selector de usuario en la barra superior si necesitas cambiar a tu cuenta de administrador.
            </p>
          </div>
        </div>
      )}

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
