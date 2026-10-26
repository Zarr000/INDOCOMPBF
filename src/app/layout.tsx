import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Bebas_Neue, Rajdhani, Outfit } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'INDOCOMP — Blox Fruits Indonesia Competitive Rankings',
  description: 'The official competitive ranking board for Indonesian Blox Fruits players.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`scroll-smooth ${bebasNeue.variable} ${rajdhani.variable} ${outfit.variable}`}
    >
      <body className="bg-[#030303] text-white relative antialiased">
        <div className="fixed inset-0 -z-50 pointer-events-none">
          <div className="absolute inset-0 bg-[#030303]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
          <div
            className="absolute inset-0 opacity-[0.022]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
          <div className="absolute top-0 left-0 h-[min(60vw,700px)] w-[min(60vw,700px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[min(60vw,700px)] w-[min(60vw,700px)] translate-x-1/2 translate-y-1/2 rounded-full bg-white/[0.025] blur-[100px]" />
        </div>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        {children}

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
