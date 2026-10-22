import { headers } from 'next/headers';
import { getSetting } from '@/lib/settings';
import { PageHeader, Card } from '@/components/admin/Page';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { TRACKING_FIELDS } from '@/lib/adminFields';
import { trackingIds } from '@/components/store/TrackingScripts';
import { saveSettingsAction } from '../../actions';

export const metadata = { title: 'Marketing & tracking' };

export default async function MarketingPage() {
  const t = await getSetting('tracking');
  const id = trackingIds(t);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const status = [
    { name: 'Meta Pixel', on: !!id.pixel },
    { name: 'Google Analytics 4', on: !!id.ga4 },
    { name: 'Google Tag Manager', on: !!id.gtm },
    { name: 'Google Ads', on: !!id.ads, extra: id.ads && !id.adsPurchaseLabel ? 'add a purchase label to track sales' : '' },
    { name: 'Search Console', on: !!t.searchConsoleToken },
  ];
  return (
    <>
      <PageHeader title="Marketing & tracking" sub="Connect your ads and analytics accounts. Tags are added to every page of your store as soon as you save." />
      <div className="mb-6 flex flex-wrap gap-2">
        {status.map((s) => (
          <span key={s.name} className={`rounded-full px-3 py-1 text-sm font-medium ${s.on ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
            {s.on ? '● ' : '○ '}
            {s.name}
            {s.extra ? ` — ${s.extra}` : ''}
          </span>
        ))}
      </div>
      <div className="rounded-xl bg-white px-5 pt-5 shadow-sm ring-1 ring-gray-200/70">
        <SettingsForm section="tracking" fields={TRACKING_FIELDS} initial={t} save={saveSettingsAction} />
      </div>
      <Card title="Useful links for Google Search Console and Merchant Center" className="mt-6">
        <dl className="space-y-2 text-sm">
          <div><dt className="font-semibold">Sitemap</dt><dd><code className="rounded bg-gray-100 px-1.5 py-0.5">{origin}/sitemap.xml</code> — submit this in Search Console → Sitemaps.</dd></div>
          <div><dt className="font-semibold">Robots file</dt><dd><code className="rounded bg-gray-100 px-1.5 py-0.5">{origin}/robots.txt</code></dd></div>
        </dl>
        <p className="mt-3 text-sm text-gray-600">
          To check that tags are working, use the Meta Pixel Helper and Google Tag Assistant browser extensions, or the “Test events” tab in Meta Events Manager.
        </p>
      </Card>
    </>
  );
}
