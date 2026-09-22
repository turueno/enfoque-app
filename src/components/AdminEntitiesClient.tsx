'use client';

import React, { useState } from 'react';
import { Frente, Persona, Decision, Interfaz, Responsabilidad, Principio } from '@/lib/types';
import { TextoSistema } from '@/lib/db';
import { useUser } from '@/components/UserContext';
import { isUserAdmin } from '@/lib/auth';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Users,
  GitCommit,
  ArrowLeftRight,
  ClipboardList,
  Compass,
  X,
  Save,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';

interface AdminEntitiesClientProps {
  initialFrentes: (Frente & { owner_nombre: string | null })[];
  initialPersonas: Persona[];
  initialDecisiones: (Decision & { frente_nombre: string; decisor_nombre: string | null })[];
  initialInterfaces: Interfaz[];
  initialResponsabilidades: (Responsabilidad & { frente_nombre: string; persona_nombre: string })[];
  initialPrincipios: Principio[];
  textos?: TextoSistema[];
}

export default function AdminEntitiesClient({
  initialFrentes,
  initialPersonas,
  initialDecisiones,
  initialInterfaces,
  initialResponsabilidades,
  initialPrincipios,
  textos = []
}: AdminEntitiesClientProps) {
  const { currentUser } = useUser();
  const isAdmin = isUserAdmin(currentUser.id, currentUser.email);

  const getText = (clave: string, defaultVal: string) => {
    const found = textos.find(t => t.clave === clave);
    return found ? found.valor : defaultVal;
  };

  const [activeTab, setActiveTab] = useState<'procesos' | 'personas' | 'decisiones' | 'interfaces' | 'responsabilidades' | 'principios'>('procesos');

  // Local state
  const [frentes, setFrentes] = useState(initialFrentes);
  const [personas, setPersonas] = useState(initialPersonas);
  const [decisiones, setDecisiones] = useState(initialDecisiones);
  const [interfaces, setInterfaces] = useState(initialInterfaces);
  const [responsabilidades, setResponsabilidades] = useState(initialResponsabilidades);
  const [principios, setPrincipios] = useState(initialPrincipios);

  // Search & Filters for responsabilidades
  const [respSearch, setRespSearch] = useState('');
  const [respFrenteFilter, setRespFrenteFilter] = useState('ALL');

  // Modals state
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEntity, setCurrentEntity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});

  const openCreateModal = (type: string) => {
    setModalType(type);
    setModalMode('create');
    setErrorMsg(null);

    if (type === 'proceso') {
      const nextNum = frentes.length + 1;
      const defaultId = `F0${nextNum}`;
      setFormData({
        id: defaultId,
        nombre_corto: '',
        nombre_original: '',
        tipo_frente: 'Función permanente',
        owner_id: personas[0]?.id || ''
      });
    } else if (type === 'persona') {
      const nextNum = personas.length + 1;
      const defaultId = `P0${nextNum}`;
      setFormData({
        id: defaultId,
        nombre: '',
        email: '',
        rol_funcional: '',
        territorio: '',
        nota: '',
        activo: true
      });
    } else if (type === 'decision') {
      const nextNum = decisiones.length + 1;
      const defaultId = `D${nextNum < 10 ? '0' : ''}${nextNum}`;
      setFormData({
        id: defaultId,
        frente_id: frentes[0]?.id || 'F01',
        decision: '',
        decisor_id: personas[0]?.id || '',
        consultar_a: '',
        momento: ''
      });
    } else if (type === 'interfaz') {
      const nextNum = interfaces.length + 1;
      const defaultId = `I${nextNum < 10 ? '0' : ''}${nextNum}`;
      setFormData({
        id: defaultId,
        de_id: personas[0]?.id || '',
        hacia_id: personas[1]?.id || '',
        entrega: '',
        devuelve: '',
        frentes: frentes[0]?.id || 'F01',
        estado: 'Operativa'
      });
    } else if (type === 'responsabilidad') {
      const nextNum = responsabilidades.length + 1;
      const defaultId = `R${String(nextNum).padStart(3, '0')}`;
      setFormData({
        id: defaultId,
        frente_id: frentes[0]?.id || 'F01',
        persona_id: personas[0]?.id || '',
        responsabilidad: '',
        rol: 'Ejecuta'
      });
    } else if (type === 'principio') {
      const nextNum = principios.length + 1;
      const defaultId = `PR${nextNum < 10 ? '0' : ''}${nextNum}`;
      setFormData({
        id: defaultId,
        principio: '',
        texto_original: '',
        interpretacion_propuesta: '',
        donde_aplica: 'Todos los frentes',
        estado: 'Por desarrollar'
      });
    }
  };

  const openEditModal = (type: string, item: any) => {
    setModalType(type);
    setModalMode('edit');
    setCurrentEntity(item);
    setErrorMsg(null);

    if (type === 'proceso') {
      setFormData({
        id: item.id,
        nombre_corto: item.nombre_corto,
        nombre_original: item.nombre_original,
        tipo_frente: item.tipo_frente,
        owner_id: item.owner_id_validado || item.owner_id_propuesto || ''
      });
    } else if (type === 'persona') {
      setFormData({
        id: item.id,
        nombre: item.nombre,
        email: item.email || '',
        rol_funcional: item.rol_funcional_validado || item.rol_funcional_propuesto || '',
        territorio: item.territorio_principal || '',
        nota: item.nota || '',
        activo: Boolean(item.activo)
      });
    } else if (type === 'decision') {
      setFormData({
        id: item.id,
        frente_id: item.frente_id,
        decision: item.decision,
        decisor_id: item.decisor_validado_id || item.decisor_propuesto_id || '',
        consultar_a: item.consultar_a_validado || item.consultar_a_propuesto || '',
        momento: item.momento_trigger || ''
      });
    } else if (type === 'interfaz') {
      setFormData({
        id: item.id,
        de_id: item.de_persona_id || '',
        hacia_id: item.hacia_persona_id || '',
        entrega: item.entrega_input,
        devuelve: item.devuelve_output || '',
        frentes: item.frentes_relacionados || '',
        estado: item.estado || 'Operativa'
      });
    } else if (type === 'responsabilidad') {
      setFormData({
        id: item.id,
        frente_id: item.frente_id,
        persona_id: item.persona_id,
        responsabilidad: item.responsabilidad_original,
        rol: item.rol_validado || item.rol_propuesto || 'Ejecuta'
      });
    } else if (type === 'principio') {
      setFormData({
        id: item.id,
        principio: item.principio,
        texto_original: item.texto_original || '',
        interpretacion_propuesta: item.interpretacion_propuesta || '',
        donde_aplica: item.donde_aplica || 'Todos los frentes',
        estado: item.estado || 'Por desarrollar'
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentEntity(null);
    setFormData({});
    setErrorMsg(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Solo los administradores autorizados pueden realizar cambios.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (modalMode === 'create') {
        const payload: any = {
          tipo: modalType === 'proceso' ? 'frente' : modalType,
          usuario: currentUser.nombre,
          userId: currentUser.id,
          userEmail: currentUser.email,
          data: { ...formData }
        };

        if (modalType === 'interfaz') {
          const deP = personas.find(p => p.id === formData.de_id);
          const haciaP = personas.find(p => p.id === formData.hacia_id);
          payload.data.de_nombre = deP?.nombre || formData.de_id;
          payload.data.hacia_nombre = haciaP?.nombre || formData.hacia_id;
        }

        const res = await fetch('/api/entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Error al crear entidad');

        // Update local state
        if (modalType === 'proceso') {
          const ownerP = personas.find(p => p.id === formData.owner_id);
          setFrentes(prev => [
            ...prev,
            {
              id: formData.id,
              nombre_corto: formData.nombre_corto,
              nombre_original: formData.nombre_original || formData.nombre_corto,
              tipo_frente: formData.tipo_frente,
              owner_id_propuesto: formData.owner_id,
              owner_id_validado: formData.owner_id,
              owner_nombre: ownerP?.nombre || null,
              estado_definicion: 'Definido',
              estado_validacion: 'DEFINIDO',
              validado_por: currentUser.nombre,
              fecha_validacion: new Date().toISOString(),
              comentario_validacion: 'Creado vía CMS',
              responsabilidades_count: 0,
              decisiones_count: 0,
              interfaces_count: 0,
              alert_count: 0,
              resultado_principal: null
            }
          ]);
        } else if (modalType === 'persona') {
          setPersonas(prev => [
            ...prev,
            {
              id: formData.id,
              nombre: formData.nombre,
              email: formData.email,
              rol_funcional_propuesto: formData.rol_funcional,
              rol_funcional_validado: formData.rol_funcional,
              territorio_principal: formData.territorio,
              activo: 1,
              nota: formData.nota,
              estado_validacion: 'DEFINIDO',
              validado_por: currentUser.nombre,
              fecha_validacion: new Date().toISOString(),
              comentario_validacion: 'Creado vía CMS'
            }
          ]);
        } else if (modalType === 'decision') {
          const f = frentes.find(item => item.id === formData.frente_id);
          const p = personas.find(item => item.id === formData.decisor_id);
          setDecisiones(prev => [
            {
              id: formData.id,
              frente_id: formData.frente_id,
              frente_nombre: f?.nombre_corto || formData.frente_id,
              decision: formData.decision,
              decisor_propuesto_id: formData.decisor_id,
              decisor_propuesto_nombre: p?.nombre || null,
              decisor_validado_id: formData.decisor_id,
              decisor_nombre: p?.nombre || null,
              consultar_a_propuesto: formData.consultar_a,
              consultar_a_validado: formData.consultar_a,
              momento_trigger: formData.momento,
              criterio_decision: null,
              estado_definicion: 'Definido',
              estado_validacion: 'DEFINIDO',
              validado_por: currentUser.nombre,
              fecha_validacion: new Date().toISOString(),
              comentario_validacion: 'Creado vía CMS'
            },
            ...prev
          ]);
        } else if (modalType === 'interfaz') {
          const deP = personas.find(p => p.id === formData.de_id);
          const haciaP = personas.find(p => p.id === formData.hacia_id);
          setInterfaces(prev => [
            {
              id: formData.id,
              de_persona_id: formData.de_id,
              de_persona_nombre: deP?.nombre || formData.de_id,
              hacia_persona_id: formData.hacia_id,
              hacia_persona_nombre: haciaP?.nombre || formData.hacia_id,
              entrega_input: formData.entrega,
              devuelve_output: formData.devuelve,
              frentes_relacionados: formData.frentes,
              frecuencia: 'Según proyecto',
              condicion_activacion: null,
              problema_actual: null,
              estado: formData.estado,
              estado_definicion: 'Definido',
              estado_validacion: 'DEFINIDO',
              validado_por: currentUser.nombre,
              fecha_validacion: new Date().toISOString(),
              comentario_validacion: 'Creado vía CMS'
            },
            ...prev
          ]);
        } else if (modalType === 'responsabilidad') {
          const f = frentes.find(item => item.id === formData.frente_id);
          const p = personas.find(item => item.id === formData.persona_id);
          setResponsabilidades(prev => [
            {
              id: formData.id,
              frente_id: formData.frente_id,
              frente_nombre: f?.nombre_corto || formData.frente_id,
              persona_id: formData.persona_id,
              persona_nombre: p?.nombre || formData.persona_id,
              responsabilidad_original: formData.responsabilidad,
              rol_propuesto: formData.rol,
              rol_validado: formData.rol,
              estado_revision: 'Definido',
              estado_validacion: 'DEFINIDO',
              celda_origen: 'CMS Manual',
              validado_por: currentUser.nombre,
              fecha_validacion: new Date().toISOString(),
              comentario_validacion: 'Creado vía CMS'
            },
            ...prev
          ]);
        } else if (modalType === 'principio') {
          setPrincipios(prev => [
            ...prev,
            {
              id: formData.id,
              principio: formData.principio,
              texto_original: formData.texto_original || null,
              interpretacion_propuesta: formData.interpretacion_propuesta || null,
              donde_aplica: formData.donde_aplica || 'Todos los frentes',
              estado: formData.estado || 'Por desarrollar'
            }
          ]);
        }

        closeModal();
      } else {
        // EDIT MODE
        const payload: any = {
          tipo: modalType === 'proceso' ? 'frente' : modalType,
          id: currentEntity.id,
          usuario: currentUser.nombre,
          userId: currentUser.id,
          userEmail: currentUser.email,
          data: { ...formData }
        };

        if (modalType === 'interfaz') {
          const deP = personas.find(p => p.id === formData.de_id);
          const haciaP = personas.find(p => p.id === formData.hacia_id);
          payload.data.de_nombre = deP?.nombre || formData.de_id;
          payload.data.hacia_nombre = haciaP?.nombre || formData.hacia_id;
        }

        const res = await fetch('/api/entities', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Error al actualizar entidad');

        // Update local state
        if (modalType === 'proceso') {
          const ownerP = personas.find(p => p.id === formData.owner_id);
          setFrentes(prev =>
            prev.map(f =>
              f.id === currentEntity.id
                ? {
                    ...f,
                    nombre_corto: formData.nombre_corto,
                    nombre_original: formData.nombre_original,
                    tipo_frente: formData.tipo_frente,
                    owner_id_validado: formData.owner_id,
                    owner_nombre: ownerP?.nombre || null
                  }
                : f
            )
          );
        } else if (modalType === 'persona') {
          setPersonas(prev =>
            prev.map(p =>
              p.id === currentEntity.id
                ? {
                    ...p,
                    nombre: formData.nombre,
                    email: formData.email,
                    rol_funcional_validado: formData.rol_funcional,
                    territorio_principal: formData.territorio,
                    nota: formData.nota,
                    activo: formData.activo ? 1 : 0
                  }
                : p
            )
          );
        } else if (modalType === 'decision') {
          const f = frentes.find(item => item.id === formData.frente_id);
          const p = personas.find(item => item.id === formData.decisor_id);
          setDecisiones(prev =>
            prev.map(d =>
              d.id === currentEntity.id
                ? {
                    ...d,
                    frente_id: formData.frente_id,
                    frente_nombre: f?.nombre_corto || d.frente_nombre,
                    decision: formData.decision,
                    decisor_validado_id: formData.decisor_id,
                    decisor_nombre: p?.nombre || null,
                    consultar_a_validado: formData.consultar_a,
                    momento_trigger: formData.momento
                  }
                : d
            )
          );
        } else if (modalType === 'interfaz') {
          const deP = personas.find(p => p.id === formData.de_id);
          const haciaP = personas.find(p => p.id === formData.hacia_id);
          setInterfaces(prev =>
            prev.map(i =>
              i.id === currentEntity.id
                ? {
                    ...i,
                    de_persona_id: formData.de_id,
                    de_persona_nombre: deP?.nombre || i.de_persona_nombre,
                    hacia_persona_id: formData.hacia_id,
                    hacia_persona_nombre: haciaP?.nombre || i.hacia_persona_nombre,
                    entrega_input: formData.entrega,
                    devuelve_output: formData.devuelve,
                    frentes_relacionados: formData.frentes,
                    estado: formData.estado
                  }
                : i
            )
          );
        } else if (modalType === 'responsabilidad') {
          const f = frentes.find(item => item.id === formData.frente_id);
          const p = personas.find(item => item.id === formData.persona_id);
          setResponsabilidades(prev =>
            prev.map(r =>
              r.id === currentEntity.id
                ? {
                    ...r,
                    frente_id: formData.frente_id,
                    frente_nombre: f?.nombre_corto || r.frente_nombre,
                    persona_id: formData.persona_id,
                    persona_nombre: p?.nombre || r.persona_nombre,
                    responsabilidad_original: formData.responsabilidad,
                    rol_validado: formData.rol
                  }
                : r
            )
          );
        } else if (modalType === 'principio') {
          setPrincipios(prev =>
            prev.map(pr =>
              pr.id === currentEntity.id
                ? {
                    ...pr,
                    principio: formData.principio,
                    texto_original: formData.texto_original || null,
                    interpretacion_propuesta: formData.interpretacion_propuesta || null,
                    donde_aplica: formData.donde_aplica || 'Todos los frentes',
                    estado: formData.estado || 'Por desarrollar'
                  }
                : pr
            )
          );
        }

        closeModal();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntity = async (type: string, id: string, name: string) => {
    if (!isAdmin) {
      alert('Solo los administradores autorizados pueden eliminar entidades.');
      return;
    }

    const actionText = type === 'persona' ? 'desactivar' : 'eliminar';
    if (!confirm(`¿Estás seguro de que deseas ${actionText} "${name}" (${id})?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/entities?tipo=${type}&id=${id}&usuario=${encodeURIComponent(
          currentUser.nombre
        )}&userId=${currentUser.id}&userEmail=${encodeURIComponent(currentUser.email)}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      if (type === 'persona') {
        setPersonas(prev => prev.map(p => (p.id === id ? { ...p, activo: 0 } : p)));
      } else if (type === 'decision') {
        setDecisiones(prev => prev.filter(d => d.id !== id));
      } else if (type === 'interfaz') {
        setInterfaces(prev => prev.filter(i => i.id !== id));
      } else if (type === 'responsabilidad') {
        setResponsabilidades(prev => prev.filter(r => r.id !== id));
      } else if (type === 'principio') {
        setPrincipios(prev => prev.filter(pr => pr.id !== id));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const filteredResponsabilidades = responsabilidades.filter(r => {
    if (respFrenteFilter !== 'ALL' && r.frente_id !== respFrenteFilter) return false;
    if (
      respSearch.trim() &&
      !r.responsabilidad_original.toLowerCase().includes(respSearch.toLowerCase()) &&
      !r.persona_nombre.toLowerCase().includes(respSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('procesos')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'procesos'
              ? 'bg-[#191919] text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-[#F6911E]" />
          <span>{getText('admin.entidades.subtab.procesos', 'Procesos')} ({frentes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('personas')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'personas'
              ? 'bg-[#191919] text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-[#F6911E]" />
          <span>{getText('admin.entidades.subtab.personas', 'Personas')} ({personas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('decisiones')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'decisiones'
              ? 'bg-[#191919] text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GitCommit className="w-4 h-4 text-[#F6911E]" />
          <span>{getText('admin.entidades.subtab.decisiones', 'Decisiones')} ({decisiones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interfaces')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'interfaces'
              ? 'bg-[#191919] text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-[#F6911E]" />
          <span>{getText('admin.entidades.subtab.interfaces', 'Interfaces')} ({interfaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responsabilidades')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'responsabilidades'
              ? 'bg-[#191919] text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-[#F6911E]" />
          <span>{getText('admin.entidades.subtab.responsabilidades', 'Responsabilidades')} ({responsabilidades.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('principios')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'principios'
              ? 'bg-[#191919] text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4 text-[#F6911E]" />
          <span>{getText('admin.entidades.subtab.principios', 'Principios Transversales')} ({principios.length})</span>
        </button>
      </div>

      {/* 1. PROCESOS */}
      {activeTab === 'procesos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{getText('admin.entidades.subtab.procesos', 'Procesos')}</span>
                <span className="text-xs font-normal text-slate-400">({frentes.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión de macroprocesos organizacionales, nombres clave y asignación de owners directos.
              </p>
            </div>
            <button
              onClick={() => openCreateModal('proceso')}
              disabled={!isAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getText('admin.entidades.btn.nuevo_proceso', 'Nuevo Proceso')}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3 pl-4">ID</th>
                  <th className="p-3">Nombre del Proceso</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Owner Responsable</th>
                  <th className="p-3 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frentes.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-slate-800">{f.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{f.nombre_corto}</div>
                      <div className="text-[11px] text-slate-400 font-mono line-clamp-1">
                        {f.nombre_original}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {f.tipo_frente}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {f.owner_nombre || <span className="text-slate-400 italic">Sin definir</span>}
                    </td>
                    <td className="p-3 text-right pr-4">
                      <button
                        onClick={() => openEditModal('proceso', f)}
                        disabled={!isAdmin}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] disabled:opacity-50"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PERSONAS */}
      {activeTab === 'personas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{getText('admin.entidades.subtab.personas', 'Personas')}</span>
                <span className="text-xs font-normal text-slate-400">({personas.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Directorio de colaboradores, roles funcionales, territorio y estado activo en la organización.
              </p>
            </div>
            <button
              onClick={() => openCreateModal('persona')}
              disabled={!isAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getText('admin.entidades.btn.nueva_persona', 'Nueva Persona')}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3 pl-4">ID</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Rol Funcional</th>
                  <th className="p-3">Territorio</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personas.map(p => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${p.activo ? 'hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-60'}`}
                  >
                    <td className="p-3 pl-4 font-mono font-bold text-slate-800">{p.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.nombre}</div>
                      <div className="text-[11px] text-slate-400">{p.email || 'Sin correo'}</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      {p.rol_funcional_validado || p.rol_funcional_propuesto || '—'}
                    </td>
                    <td className="p-3 text-slate-600">{p.territorio_principal || '—'}</td>
                    <td className="p-3">
                      {p.activo ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <UserCheck className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                          <UserX className="w-3 h-3" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4 space-x-2">
                      <button
                        onClick={() => openEditModal('persona', p)}
                        disabled={!isAdmin}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] disabled:opacity-50"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      {p.activo ? (
                        <button
                          onClick={() => handleDeleteEntity('persona', p.id, p.nombre)}
                          disabled={!isAdmin}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] disabled:opacity-50"
                          title="Desactivar colaborador"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Desactivar</span>
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DECISIONES */}
      {activeTab === 'decisiones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{getText('admin.entidades.subtab.decisiones', 'Decisiones')}</span>
                <span className="text-xs font-normal text-slate-400">({decisiones.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catálogo de decisiones con autoridad final asignada, personas de consulta y momentos disparadores.
              </p>
            </div>
            <button
              onClick={() => openCreateModal('decision')}
              disabled={!isAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getText('admin.entidades.btn.nueva_decision', 'Nueva Decisión')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisiones.map(d => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {d.id} · {d.frente_id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {d.estado_validacion}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{d.decision}</h3>
                  <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-1.5 text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-800">Decisor: </span>
                      <strong className="text-slate-900 font-bold">{d.decisor_nombre || 'Sin asignar'}</strong>
                    </div>
                    {(d.consultar_a_validado || d.consultar_a_propuesto) && (
                      <div>
                        <span className="font-semibold text-slate-800">Consultar a: </span>
                        <span>{d.consultar_a_validado || d.consultar_a_propuesto}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal('decision', d)}
                    disabled={!isAdmin}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-50"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEntity('decision', d.id, d.decision)}
                    disabled={!isAdmin}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. INTERFACES */}
      {activeTab === 'interfaces' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{getText('admin.entidades.subtab.interfaces', 'Interfaces')}</span>
                <span className="text-xs font-normal text-slate-400">({interfaces.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Red de acuerdos operativos, entregas y retornos entre integrantes.
              </p>
            </div>
            <button
              onClick={() => openCreateModal('interfaz')}
              disabled={!isAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getText('admin.entidades.btn.nueva_interfaz', 'Nueva Interfaz')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interfaces.map(i => (
              <div
                key={i.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {i.id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                      {i.estado}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {i.de_persona_nombre} ➔ {i.hacia_persona_nombre}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Debe entregar:</span>
                      <p className="text-slate-900 font-medium text-sm leading-relaxed">{i.entrega_input}</p>
                    </div>
                    {i.devuelve_output && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Devuelve:</span>
                        <p className="text-slate-700 text-xs leading-relaxed">{i.devuelve_output}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal('interfaz', i)}
                    disabled={!isAdmin}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs disabled:opacity-50"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteEntity('interfaz', i.id, `${i.de_persona_nombre} -> ${i.hacia_persona_nombre}`)
                    }
                    disabled={!isAdmin}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RESPONSABILIDADES */}
      {activeTab === 'responsabilidades' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{getText('admin.entidades.subtab.responsabilidades', 'Responsabilidades')}</span>
                <span className="text-xs font-normal text-slate-400">({responsabilidades.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Matriz de responsabilidades y roles asignados a cada integrante por proceso.
              </p>
            </div>
            <button
              onClick={() => openCreateModal('responsabilidad')}
              disabled={!isAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors self-start sm:self-auto disabled:opacity-50 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getText('admin.entidades.btn.nueva_responsabilidad', 'Nueva Responsabilidad')}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <input
                type="text"
                placeholder="Buscar responsabilidad..."
                value={respSearch}
                onChange={e => setRespSearch(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-56 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <select
                value={respFrenteFilter}
                onChange={e => setRespFrenteFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
              >
                <option value="ALL">Todos los Procesos</option>
                {frentes.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.id}: {f.nombre_corto}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3 pl-4">ID</th>
                  <th className="p-3">Proceso</th>
                  <th className="p-3">Persona</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Responsabilidad</th>
                  <th className="p-3 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResponsabilidades.slice(0, 100).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-slate-700">{r.id}</td>
                    <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{r.frente_nombre}</td>
                    <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{r.persona_nombre}</td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {r.rol_validado || r.rol_propuesto}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 max-w-md line-clamp-2">
                      {r.responsabilidad_original}
                    </td>
                    <td className="p-3 text-right pr-4 space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal('responsabilidad', r)}
                        disabled={!isAdmin}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] disabled:opacity-50"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEntity('responsabilidad', r.id, r.responsabilidad_original)}
                        disabled={!isAdmin}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PRINCIPIOS TRANSVERSALES */}
      {activeTab === 'principios' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{getText('admin.entidades.subtab.principios', 'Principios Transversales')}</span>
                <span className="text-xs font-normal text-slate-400">({principios.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Criterios operativos rectores y transversales aplicables a través de los procesos organizacionales.
              </p>
            </div>
            <button
              onClick={() => openCreateModal('principio')}
              disabled={!isAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F6911E] text-[#191919] text-xs font-bold hover:bg-[#FFAA34] transition-colors self-start sm:self-auto disabled:opacity-50 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{getText('admin.entidades.btn.nuevo_principio', 'Nuevo Principio')}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3 pl-4 w-20">ID</th>
                  <th className="p-3 w-48">Principio</th>
                  <th className="p-3 min-w-[280px]">Interpretación Operativa</th>
                  <th className="p-3 w-36">Dónde Aplica</th>
                  <th className="p-3 w-28">Estado</th>
                  <th className="p-3 text-right pr-4 w-32">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {principios.map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#191919] text-[#FFAA34] text-[11px] font-mono font-bold">
                        {pr.id}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {pr.principio}
                    </td>
                    <td className="p-3 text-slate-700">
                      <p className="line-clamp-2 font-editorial italic text-slate-800">
                        "{pr.interpretacion_propuesta || 'Sin interpretación definida'}"
                      </p>
                      {pr.texto_original && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          Origen: {pr.texto_original}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {pr.donde_aplica || 'Todos los frentes'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        pr.estado === 'Activo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : pr.estado === 'Por desarrollar'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {pr.estado || 'Por desarrollar'}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4 space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal('principio', pr)}
                        disabled={!isAdmin}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] disabled:opacity-50 transition-colors"
                        title="Editar principio"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEntity('principio', pr.id, pr.principio)}
                        disabled={!isAdmin}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] disabled:opacity-50 transition-colors"
                        title="Eliminar principio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DIALOG */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0">
              <h2 className="text-base font-bold text-slate-900">
                {modalMode === 'create' ? 'Agregar ' : 'Editar '}
                {modalType === 'proceso'
                  ? getText('admin.entidades.subtab.procesos', 'Proceso')
                  : modalType === 'persona'
                  ? getText('admin.entidades.subtab.personas', 'Persona')
                  : modalType === 'decision'
                  ? getText('admin.entidades.subtab.decisiones', 'Decisión')
                  : modalType === 'interfaz'
                  ? getText('admin.entidades.subtab.interfaces', 'Interfaz')
                  : modalType === 'responsabilidad'
                  ? getText('admin.entidades.subtab.responsabilidades', 'Responsabilidad')
                  : getText('admin.entidades.subtab.principios', 'Principio Transversal')}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mx-5 mt-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-3 overflow-y-auto flex-1 max-h-[calc(90vh-140px)]">
                {/* PROCESO FORM */}
                {modalType === 'proceso' && (
                <>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ID del Proceso:</label>
                    <input
                      type="text"
                      disabled={modalMode === 'edit'}
                      required
                      value={formData.id || ''}
                      onChange={e => setFormData({ ...formData, id: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: F08"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nombre Corto:</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre_corto || ''}
                      onChange={e => setFormData({ ...formData, nombre_corto: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Estrategia de Expansión"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nombre / Descripción Original:</label>
                    <textarea
                      rows={2}
                      value={formData.nombre_original || ''}
                      onChange={e => setFormData({ ...formData, nombre_original: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Descripción detallada o nombre formal del macroproceso..."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tipo de Proceso:</label>
                    <select
                      value={formData.tipo_frente || 'Función permanente'}
                      onChange={e => setFormData({ ...formData, tipo_frente: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Función permanente">Función permanente</option>
                      <option value="Proceso transversal">Proceso transversal</option>
                      <option value="Iniciativa de transformación">Iniciativa de transformación</option>
                      <option value="Unidad de negocio / capacidad">Unidad de negocio / capacidad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Owner Responsable:</label>
                    <select
                      value={formData.owner_id || ''}
                      onChange={e => setFormData({ ...formData, owner_id: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Sin asignar</option>
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* PERSONA FORM */}
              {modalType === 'persona' && (
                <>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ID:</label>
                    <input
                      type="text"
                      disabled={modalMode === 'edit'}
                      required
                      value={formData.id || ''}
                      onChange={e => setFormData({ ...formData, id: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: P08"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nombre Completo:</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre || ''}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Carlos Méndez"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Correo Electrónico:</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="ejemplo@enfoque.io"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Rol Funcional:</label>
                    <input
                      type="text"
                      value={formData.rol_funcional || ''}
                      onChange={e => setFormData({ ...formData, rol_funcional: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Arquitectura de Operaciones"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Territorio Principal:</label>
                    <input
                      type="text"
                      value={formData.territorio || ''}
                      onChange={e => setFormData({ ...formData, territorio: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Operaciones y logística"
                    />
                  </div>
                  {modalMode === 'edit' && (
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="persona-activo"
                        checked={formData.activo}
                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="persona-activo" className="text-slate-700 font-medium">
                        Colaborador Activo
                      </label>
                    </div>
                  )}
                </>
              )}

              {/* DECISION FORM */}
              {modalType === 'decision' && (
                <>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Proceso Relacionado:</label>
                    <select
                      value={formData.frente_id || ''}
                      onChange={e => setFormData({ ...formData, frente_id: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {frentes.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.id}: {f.nombre_corto}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Decisión a Tomar:</label>
                    <input
                      type="text"
                      required
                      value={formData.decision || ''}
                      onChange={e => setFormData({ ...formData, decision: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Autorizar cambios metodológicos mayores"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Decisor Final:</label>
                    <select
                      value={formData.decisor_id || ''}
                      onChange={e => setFormData({ ...formData, decisor_id: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Sin asignar</option>
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.rol_funcional_propuesto})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Consultar a:</label>
                    <input
                      type="text"
                      value={formData.consultar_a || ''}
                      onChange={e => setFormData({ ...formData, consultar_a: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Mónica Freyre; Sandra Montes de Oca"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Momento / Trigger:</label>
                    <input
                      type="text"
                      value={formData.momento || ''}
                      onChange={e => setFormData({ ...formData, momento: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Ej: Antes del kickoff del proyecto"
                    />
                  </div>
                </>
              )}

              {/* INTERFAZ FORM */}
              {modalType === 'interfaz' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">De (Emisor):</label>
                      <select
                        value={formData.de_id || ''}
                        onChange={e => setFormData({ ...formData, de_id: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Hacia (Receptor):</label>
                      <select
                        value={formData.hacia_id || ''}
                        onChange={e => setFormData({ ...formData, hacia_id: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Input que entrega:</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.entrega || ''}
                      onChange={e => setFormData({ ...formData, entrega: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Descripción de lo que entrega para iniciar el flujo..."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Output que devuelve a cambio:</label>
                    <textarea
                      rows={2}
                      value={formData.devuelve || ''}
                      onChange={e => setFormData({ ...formData, devuelve: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Entregable de confirmación o cierre de ciclo..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Procesos involucrados:</label>
                      <input
                        type="text"
                        value={formData.frentes || ''}
                        onChange={e => setFormData({ ...formData, frentes: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        placeholder="Ej: F01, F02"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Estado:</label>
                      <select
                        value={formData.estado || 'Operativa'}
                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Operativa">Operativa</option>
                        <option value="En riesgo">En riesgo</option>
                        <option value="Bloqueada">Bloqueada</option>
                        <option value="Por definir">Por definir</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* RESPONSABILIDAD FORM */}
              {modalType === 'responsabilidad' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Proceso:</label>
                      <select
                        value={formData.frente_id || ''}
                        onChange={e => setFormData({ ...formData, frente_id: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        {frentes.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.id}: {f.nombre_corto}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Persona:</label>
                      <select
                        value={formData.persona_id || ''}
                        onChange={e => setFormData({ ...formData, persona_id: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        {personas.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Rol en esta actividad:</label>
                    <select
                      value={formData.rol || 'Ejecuta'}
                      onChange={e => setFormData({ ...formData, rol: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="Owner">Owner (Responsable Final del Proceso)</option>
                      <option value="Decide">Decide (Autoridad sobre la decisión)</option>
                      <option value="Ejecuta">Ejecuta (Realiza la tarea y responde por la entrega)</option>
                      <option value="Contribuye">Contribuye (Aporta insumos o soporte técnico)</option>
                      <option value="Informado">Informado (Recibe reportes o visibilidad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Descripción de la Responsabilidad:</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.responsabilidad || ''}
                      onChange={e => setFormData({ ...formData, responsabilidad: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Describe qué hace la persona en este proceso..."
                    />
                  </div>
                </>
              )}

              {/* PRINCIPIO FORM */}
              {modalType === 'principio' && (
                <>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ID del Principio:</label>
                    <input
                      type="text"
                      disabled={modalMode === 'edit'}
                      required
                      value={formData.id || ''}
                      onChange={e => setFormData({ ...formData, id: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      placeholder="Ej: PR04"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nombre / Enunciado del Principio:</label>
                    <input
                      type="text"
                      required
                      value={formData.principio || ''}
                      onChange={e => setFormData({ ...formData, principio: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      placeholder="Ej: Preservación de contexto y trazabilidad"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Interpretación Operativa Propuesta:</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.interpretacion_propuesta || ''}
                      onChange={e => setFormData({ ...formData, interpretacion_propuesta: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="Explica cómo se traduce este principio en la operación y toma de decisiones diarias..."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Texto Original de Referencia (Opcional):</label>
                    <textarea
                      rows={2}
                      value={formData.texto_original || ''}
                      onChange={e => setFormData({ ...formData, texto_original: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                      placeholder="Texto literal del documento de origen o anexo..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Dónde Aplica:</label>
                      <input
                        type="text"
                        value={formData.donde_aplica || ''}
                        onChange={e => setFormData({ ...formData, donde_aplica: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        placeholder="Ej: Todos los frentes"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Estado:</label>
                      <select
                        value={formData.estado || 'Por desarrollar'}
                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Por desarrollar">Por desarrollar</option>
                        <option value="Activo">Activo</option>
                        <option value="En revisión">En revisión</option>
                        <option value="Consolidado">Consolidado</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              </div>

              <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#191919] text-white text-xs font-bold hover:bg-[#2b2b2b] transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#F6911E]" />
                  <span>{loading ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
