import Link from 'next/link';
import { q } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { PageHeader, LinkButton } from '@/components/admin/Page';

export const metadata = { title: 'Pages' };

export default async function PagesList() {
  const pages = await q(`SELECT * FROM pages ORDER BY sort, id`);
  return (
    <>
      <PageHeader title="Pages" sub="About us, policies and any other information pages." actions={<LinkButton href="/admin/pages/new">Add page</LinkButton>} />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr><th className="px-4 py-2.5">Page</th><th className="px-3 py-2.5">Shown in</th><th className="px-3 py-2.5">Last edited</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages.map((p: any) => (
              <tr key={p.id} className={p.active ? '' : 'text-gray-500'}>
                <td className="px-4 py-3">
                  <Link href={`/admin/pages/${p.id}`} className="font-semibold text-gray-900 hover:text-brand">{p.title}</Link>
                  <div className="text-xs text-gray-500">/p/{p.slug}{!p.active && ' · hidden'}</div>
                </td>
                <td className="px-3 py-3 text-gray-700">{[p.in_header && 'Menu', p.in_footer && 'Footer'].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-3 py-3 text-gray-600">{fmtDate(p.updated_at)}</td>
                <td className="px-4 py-3 text-right"><Link href={`/admin/pages/${p.id}`} className="font-semibold text-brand">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
