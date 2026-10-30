import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { SecurityProtection } from "@/components/common/SecurityProtection";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://gastropwa.com'),
  alternates: {
    canonical: '/',
  },
  title: "Fluxo — Software para Restaurantes sin TPV | Carta Digital QR y Comandas Móviles",
  description: "Carta digital QR interactiva y sistema de comandas móvil para bares y restaurantes sin TPV: funciona en el móvil del camarero, con pantalla de cocina KDS y piloto gratuito de 14 días.",
  keywords: [
    "software para restaurantes sin TPV",
    "carta digital QR interactiva",
    "sistema de comandas móvil para bares y restaurantes",
    "pantalla de cocina KDS",
    "carta digital para restaurantes",
    "comandero de mesa",
    "software hostelería España",
  ],
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
    title: "Fluxo — Carta Digital QR & Sistema de Comandas para Restaurantes",
    description: "Software para restaurantes sin TPV: carta digital QR interactiva, comandas móviles para bares y restaurantes y pantalla de cocina KDS. Piloto gratuito de 14 días.",
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
