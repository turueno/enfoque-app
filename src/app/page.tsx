import { getDashboardStats, getAllFrentes, getStructuralAlerts } from '@/lib/queries';
import { getTextosSistemaMap } from '@/lib/db';
import { getAllDashboardSnapshots } from '@/lib/snapshots';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const stats = getDashboardStats();
  const frentes = getAllFrentes();
  const alerts = getStructuralAlerts();
  const textos = getTextosSistemaMap();
  const snapshots = getAllDashboardSnapshots();

  return (
    <DashboardClient
      initialSnapshots={snapshots}
      liveStats={stats}
      liveFrentes={frentes}
      liveAlerts={alerts}
      textos={textos}
    />
  );
}
