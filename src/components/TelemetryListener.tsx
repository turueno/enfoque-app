'use client';

import { useUserTelemetry } from '@/hooks/useUserTelemetry';

export default function TelemetryListener() {
  useUserTelemetry();
  return null;
}
