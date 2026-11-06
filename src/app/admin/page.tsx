import { getAllTextosSistema } from '@/lib/db';
import {
  getAllFrentes,
  getAllPersonas,
  getAllDecisiones,
  getAllInterfaces,
  getAllResponsabilidades,
  getAllPrincipios,
  getAllResultados
} from '@/lib/queries';
import { getTemasImpacto } from '@/lib/impacto';
import AdminTabsClient from '@/components/AdminTabsClient';
import AdminLoginForm from '@/components/AdminLoginForm';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return <AdminLoginForm />;
  }

  const textos = getAllTextosSistema();
  const frentes = getAllFrentes();
  const personas = getAllPersonas();
  const decisiones = getAllDecisiones();
  const interfaces = getAllInterfaces();
  const responsabilidades = getAllResponsabilidades() as any;
  const principios = getAllPrincipios();
  const resultados = getAllResultados();
  const temasImpacto = getTemasImpacto();

  return (
    <div className="py-2">
      <AdminTabsClient
        initialTextos={textos}
        initialFrentes={frentes}
        initialPersonas={personas}
        initialDecisiones={decisiones}
        initialInterfaces={interfaces}
        initialResponsabilidades={responsabilidades}
        initialPrincipios={principios}
        initialResultados={resultados}
        initialTemasImpacto={temasImpacto}
      />
    </div>
  );
}
