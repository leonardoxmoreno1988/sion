// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";


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
        {/* El contenido de la aplicación */}
        {children}
        
        {/* Fathom Analytics - Inyectado de forma eficiente */}
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="UXLJGDOS"
          strategy="afterInteractive"
          // Esto asegura que Fathom ignore tus visitas locales si estás en localhost
          data-spa="auto" 
        />
      </body>
    </html>
  );
}