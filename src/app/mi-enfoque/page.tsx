import React from 'react';
import { getAllPersonas, getMiEnfoque } from '@/lib/queries';
import MiEnfoqueClient from '@/components/MiEnfoqueClient';

export const dynamic = 'force-dynamic';

export default async function MiEnfoquePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const personas = getAllPersonas();
  const params = await searchParams;
  const initialId = params.id || 'P04'; // Default José Antonio Turueño

  const enfoqueData = getMiEnfoque(initialId);

  return (
    <MiEnfoqueClient
      personas={personas}
      initialId={initialId}
      initialData={enfoqueData}
    />
  );
}
