import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { UserProvider } from "@/components/UserContext";
import { getTextosSistemaMap } from "@/lib/db";

export const metadata: Metadata = {
  title: "ENFOQUE — Sistema interactivo de gestión",
  description: "Mapa operativo de responsabilidad, decisión, dependencia y movimiento organizacional.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const textos = getTextosSistemaMap();

  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <UserProvider>
          <Navbar initialTextosMap={textos} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-3">
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Provokers" className="h-4 w-auto object-contain opacity-70" />
                <span className="font-bold text-[#191919] tracking-wider">{textos['nav.app_name'] || 'ENFOQUE'}</span>
                <span>{textos['footer.tagline'] || '— Sistema Operativo de Gestión'}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">v1.0</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>{textos['footer.status'] || 'Conectado a Google Workspace • 3 Capas: Original / Propuesto / Validado'}</span>
              </div>
            </div>
          </footer>
        </UserProvider>
      </body>
    </html>
  );
}
