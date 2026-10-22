import Link from 'next/link';
import { getSetting } from '@/lib/settings';
import { PageHeader } from '@/components/admin/Page';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { BRAND_FIELDS, HOME_FIELDS, FOOTER_FIELDS, SEO_FIELDS } from '@/lib/adminFields';
import { saveSettingsAction } from '../../actions';

export const metadata = { title: 'Brand & content' };

const TABS = [
  { key: 'brand', label: 'Brand & colours', section: 'site', fields: BRAND_FIELDS },
  { key: 'home', label: 'Homepage', section: 'home', fields: HOME_FIELDS },
  { key: 'footer', label: 'Contact & footer', section: 'footer', fields: FOOTER_FIELDS },
  { key: 'seo', label: 'SEO & sharing', section: 'seo', fields: SEO_FIELDS },
];

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const t = TABS.find((x) => x.key === tab) || TABS[0];
  const initial = await getSetting(t.section);
  return (
    <>
      <PageHeader title="Brand & content" sub="Everything here updates your live website as soon as you save." />
      <div className="mb-5 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((x) => (
          <Link
            key={x.key}
            href={`/admin/content?tab=${x.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${x.key === t.key ? 'border-[var(--brand)] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {x.label}
          </Link>
        ))}
      </div>
      <div className="rounded-xl bg-white px-5 pt-5 shadow-sm ring-1 ring-gray-200/70">
        <SettingsForm key={t.key} section={t.section} fields={t.fields} initial={initial} save={saveSettingsAction} />
      </div>
    </>
  );
}
