'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/components/UserContext';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Tablero Principal',
  '/tablero': 'Tablero Principal',
  '/agenda': 'Agenda Inteligente',
  '/frentes': 'Frentes y Procesos',
  '/personas': 'Personas y Roles',
  '/decisiones': 'Decisiones y Raci',
  '/principios': 'Principios Transversales',
  '/revisor': 'Revisor Heurístico IA',
  '/chat': 'Asistente IA',
  '/auditoria': 'Historial de Auditoría',
  '/admin': 'Administración'
};

function getFriendlyRouteLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(route) && route !== '/') {
      return label;
    }
  }
  return pathname;
}

function sendTelemetryPayload(data: Record<string, any>, useBeacon = false) {
  try {
    const payload = JSON.stringify(data);
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
      const sent = navigator.sendBeacon('/api/telemetry', blob);
      if (sent) return;
    }
    // Fallback a fetch keepalive
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  } catch (e) {
    // Silencioso para no interferir con la UX
  }
}

export function useUserTelemetry() {
  const { currentUser } = useUser();
  const pathname = usePathname();

  const sessionStartRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>('');
  const lastPathnameRef = useRef<string>('');
  const sessionInitiatedRef = useRef<boolean>(false);

  // 1. Inicialización de sesión por pestaña
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let sid = sessionStorage.getItem('enfoque_session_id');
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('enfoque_session_id', sid);
    }
    sessionIdRef.current = sid;

    // Registrar inicio de sesión solo una vez por montura inicial si hay usuario
    if (currentUser?.id && !sessionInitiatedRef.current) {
      sessionInitiatedRef.current = true;
      sendTelemetryPayload({
        session_id: sid,
        persona_id: currentUser.id,
        persona_nombre: currentUser.nombre,
        persona_rol: currentUser.rol_funcional,
        tipo_evento: 'SESION_INICIADA',
        modulo_ruta: getFriendlyRouteLabel(pathname || '/'),
        detalles: `Sesión iniciada en ${getFriendlyRouteLabel(pathname || '/')}`
      });
    }
  }, [currentUser?.id]);

  // 2. Tracking reactivo de navegación por módulos
  useEffect(() => {
    if (!pathname || !currentUser?.id || !sessionIdRef.current) return;
    if (lastPathnameRef.current === pathname) return;

    lastPathnameRef.current = pathname;
    const moduloNombre = getFriendlyRouteLabel(pathname);

    sendTelemetryPayload({
      session_id: sessionIdRef.current,
      persona_id: currentUser.id,
      persona_nombre: currentUser.nombre,
      persona_rol: currentUser.rol_funcional,
      tipo_evento: 'NAVEGACION',
      modulo_ruta: moduloNombre,
      detalles: `Visualizando módulo: ${moduloNombre} (${pathname})`
    });
  }, [pathname, currentUser?.id]);

  // 3. Tracking de cierre de sesión con cálculo de duración vía sendBeacon
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      const now = Date.now();
      const duracionSegundos = Math.max(1, Math.round((now - sessionStartRef.current) / 1000));
      const sid = sessionIdRef.current || sessionStorage.getItem('enfoque_session_id') || 'desconocida';

      sendTelemetryPayload(
        {
          session_id: sid,
          persona_id: currentUser?.id,
          persona_nombre: currentUser?.nombre,
          persona_rol: currentUser?.rol_funcional,
          tipo_evento: 'SESION_CERRADA',
          modulo_ruta: getFriendlyRouteLabel(lastPathnameRef.current || window.location.pathname),
          duracion_segundos: duracionSegundos,
          detalles: `Sesión cerrada tras permanecer ${Math.floor(duracionSegundos / 60)}m ${duracionSegundos % 60}s`
        },
        true // useBeacon = true
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);
}
