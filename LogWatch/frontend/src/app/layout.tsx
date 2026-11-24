import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";

import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { MonitoringProvider } from "@/context/monitoring-provider";
import "./globals.css";

// Família projetada para legibilidade rápida; a variante mono é usada só nos dados de log (IPs e horários).
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  // O Next não tem métricas desta fonte para gerar a reserva automática; usamos a do sistema.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin"],
  adjustFontFallback: false,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: { default: "LogWatch", template: "%s · LogWatch" },
  description: "Monitoramento de logs de autenticação e detecção de força bruta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${atkinson.variable} ${atkinsonMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <MonitoringProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <div className="flex flex-1 flex-col md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
              <AppNav />
              <main className="w-full max-w-6xl px-4 py-8 md:px-10">{children}</main>
            </div>
          </div>
        </MonitoringProvider>
      </body>
    </html>
  );
}
