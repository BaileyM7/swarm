import type { Metadata } from 'next';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-mono/400.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'SWARM | Tactical Intelligence',
  description:
    'Agent-based wargame simulator — model how countries respond to geopolitical scenarios in real time.',
  robots: { index: false, follow: false }, // internal tool — keep out of search engines
};

/**
 * Root layout.
 * – Dark class on <html> hard-coded (app is always dark).
 * – CSS variables expose Geist fonts to Tailwind via font-sans / font-mono.
 * – FilmGrain overlay rendered here so it covers every page.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        {/* Preconnect to Mapbox tiles */}
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
      </head>
      <body
        className="bg-background text-on-surface overflow-hidden"
        style={
          {
            '--font-geist-sans': '"Geist Sans", system-ui, sans-serif',
            '--font-geist-mono': '"Geist Mono", ui-monospace, monospace',
          } as React.CSSProperties
        }
      >
        {/* Film-grain texture overlay — fixed, pointer-events-none, 3% opacity */}
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[200] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            opacity: 0.03,
            animation: 'film-grain-shift 8s steps(1) infinite',
          }}
        />
        {children}
      </body>
    </html>
  );
}
