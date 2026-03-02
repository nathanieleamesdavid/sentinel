import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sentinel | Medeed Biotech Intelligence',
  description:
    'Biotech intelligence dashboard. Crawls research sources, synthesizes signals with AI, and surfaces actionable insights across therapeutic domains.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background`}>
        {children}
      </body>
    </html>
  );
}
