import type { Metadata } from 'next';
import './globals.css';
import { getSiteBundle, getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { site, seo } = await getSiteBundle();
    const tracking = await getSetting('tracking');
    const token = (v: string) => (/^[A-Za-z0-9_-]{10,100}$/.test(v || '') ? v : undefined);
    const google = token(tracking.searchConsoleToken);
    const fb = token(tracking.metaDomainVerification);
    return {
      verification: {
        ...(google ? { google } : {}),
        ...(fb ? { other: { 'facebook-domain-verification': fb } } : {}),
      },
      title: { default: seo.title || site.brandName, template: `%s | ${site.brandName}` },
      description: seo.description,
      keywords: seo.keywords,
      icons: site.favicon ? [{ url: site.favicon }] : [{ url: '/favicon.svg' }],
      openGraph: {
        title: seo.title || site.brandName,
        description: seo.description,
        images: seo.ogImage ? [seo.ogImage] : [],
        siteName: site.brandName,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Store' };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let vars = '';
  try {
    const { site } = await getSiteBundle();
    const safe = (c: string, d: string) => (/^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : d);
    vars = `:root{--brand:${safe(site.primaryColor, '#A3174F')};--accent:${safe(site.accentColor, '#E39B26')};--ink:${safe(site.inkColor, '#2B1534')};--paper:${safe(site.paperColor, '#FCF7F8')}}`;
  } catch {}
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700&family=Rozha+One&display=swap"
        />
        {vars && <style dangerouslySetInnerHTML={{ __html: vars }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
