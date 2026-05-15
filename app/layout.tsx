// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // Importación obligatoria para scripts externos
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patmos",
  description: "Bible research by prompts",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        
        {/* Fathom - Beautiful, simple website analytics */}
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="UXLJGDOS"
          strategy="afterInteractive" // Se carga automáticamente después de que la página sea interactiva
        />
      </body>
    </html>
  );
}


