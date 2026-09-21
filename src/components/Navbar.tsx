'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from './UserContext';
import {
  Compass,
  User,
  Calendar,
  Grid,
  Layers,
  Users,
  GitCommit,
  ArrowLeftRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Search,
  History,
  ChevronDown,
  Settings
} from 'lucide-react';

interface NavbarProps {
  initialTextosMap?: Record<string, string>;
}

export default function Navbar({ initialTextosMap = {} }: NavbarProps) {
  const pathname = usePathname();
  const { currentUser, setCurrentUser, availableUsers } = useUser();
  const [textosMap, setTextosMap] = useState<Record<string, string>>(initialTextosMap);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ total: number; items: { id: string; tipo: string; titulo: string; subtitulo: string; enlace: string }[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live update navigation labels when changed in admin CMS
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.clave) {
        setTextosMap(prev => ({ ...prev, [e.detail.clave]: e.detail.valor }));
      }
    };
    window.addEventListener('enfoque:textos-updated', handler);
    return () => window.removeEventListener('enfoque:textos-updated', handler);
  }, []);

  const navItems = [
    { name: 'Inicio', href: '/', icon: Compass },
    { name: textosMap['nav.item.enfoque'] || 'Enfoque', href: '/mi-enfoque', icon: User },
    { name: textosMap['nav.item.agenda'] || 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Mapa', href: '/mapa', icon: Grid },
    { name: textosMap['admin.entidades.subtab.procesos'] || 'Procesos', href: '/procesos', icon: Layers },
    { name: textosMap['admin.entidades.subtab.personas'] || 'Personas', href: '/personas', icon: Users },
    { name: textosMap['admin.entidades.subtab.decisiones'] || 'Decisiones', href: '/decisiones', icon: GitCommit },
    { name: textosMap['admin.entidades.subtab.interfaces'] || 'Interfaces', href: '/interfaces', icon: ArrowLeftRight },
    { name: 'Validar', href: '/validar', icon: CheckCircle2 },
    { name: textosMap['admin.entidades.subtab.principios'] || 'Principios', href: '/principios', icon: BookOpen },
    { name: 'Revisor IA', href: '/revisor', icon: Sparkles },
    { name: 'Auditoría', href: '/auditoria', icon: History },
    { name: 'Ajustes', href: '/admin', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              {/* Official Brand Logo */}
              <img
                src="/logo.png"
                alt="Provokers"
                className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="border-l border-slate-300 pl-3">
                <span className="font-bold text-[#191919] text-lg tracking-tight group-hover:text-[#F6911E] transition-colors">
                  {textosMap['nav.app_name'] || 'ENFOQUE'}
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-editorial border-l border-slate-300 pl-2">
                  {textosMap['nav.app_subtitle'] || 'Gobernanza & Movimiento'}
                </span>
              </div>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-6 relative" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar proceso, persona, decisión, rol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm text-[#191919] placeholder-slate-400 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F6911E]/30 focus:border-[#F6911E] transition-all"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-slate-300 border-t-[#F6911E] rounded-full animate-spin" />
              )}
            </div>

            {/* Live search results */}
            {searchResults && searchResults.items && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 py-2 max-h-96 overflow-y-auto z-50">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Resultados ({searchResults.total})</span>
                  <span className="text-[10px] text-slate-400">Esc para cerrar</span>
                </div>
                {searchResults.items.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 font-editorial">No se encontraron coincidencias</div>
                ) : (
                  searchResults.items.map((item, idx) => (
                    <Link
                      key={`${item.id}-${idx}`}
                      href={item.enlace}
                      onClick={() => setSearchResults(null)}
                      className="block px-3 py-2 hover:bg-orange-50/50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 text-[#191919]">
                          {item.tipo === 'frente' ? 'proceso' : item.tipo}
                        </span>
                        <span className="text-xs font-medium text-[#191919] truncate">
                          {item.titulo}
                        </span>
                      </div>
                      {item.subtitulo && (
                        <p className="text-[11px] text-slate-500 font-editorial truncate mt-0.5 pl-1">
                          {item.subtitulo}
                        </p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Settings button */}
          <Link
            href="/admin"
            title="Administrador de Contenidos y Entidades (Ajustes)"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold ${
              pathname.startsWith('/admin')
                ? 'bg-[#191919] text-white border-[#191919] shadow-sm'
                : 'bg-white hover:bg-orange-50/80 border-slate-200 text-slate-700 hover:text-[#191919] hover:border-[#F6911E]/50'
            }`}
          >
            <Settings className={`w-3.5 h-3.5 ${pathname.startsWith('/admin') ? 'text-[#F6911E]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Ajustes</span>
          </Link>

          {/* User selector (Google Workspace simulation) */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-[#191919] text-[#F6911E] font-bold text-xs flex items-center justify-center">
                {currentUser.nombre.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-[#191919] leading-tight">
                  {currentUser.nombre}
                </div>
                <div className="text-[10px] text-slate-500 leading-none">
                  Google Workspace
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Conectado con Workspace
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {currentUser.nombre}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {currentUser.email}
                  </div>
                </div>
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Cambiar identidad (Enfoque)
                  </div>
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2.5 transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {u.nombre.charAt(0)}
                      </span>
                      <div className="truncate flex-1">
                        <div>{u.nombre}</div>
                        <div className="text-[10px] text-slate-400">{u.rol_funcional}</div>
                      </div>
                      {u.id === currentUser.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Navigation Row */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-[#191919] text-white shadow-sm border-b-2 border-[#F6911E]'
                    : 'text-slate-600 hover:text-[#191919] hover:bg-orange-50/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F6911E]' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
