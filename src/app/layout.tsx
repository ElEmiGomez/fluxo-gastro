import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { SecurityProtection } from "@/components/common/SecurityProtection";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://gastropwa.com'),
  alternates: {
    canonical: '/',
  },
  title: "Fluxo — Sistema Gastronómico Inteligente",
  description: "Plataforma web interactiva para comensales, comandero de mozos y monitor de cocina KDS en tiempo real.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fluxo",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "Fluxo — Carta Digital & Servicio en Mesa",
    description: "Consulta la carta con fotos, alérgenos y precios en tiempo real. Pide desde tu mesa sin esperas.",
    siteName: "Fluxo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluxo — Sistema Gastronómico",
    description: "Carta digital interactiva con fotos y pedidos en tiempo real.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-900 selection:text-white">
        <SecurityProtection />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
