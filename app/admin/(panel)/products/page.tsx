import Link from 'next/link';
import { listProducts, listCategories } from '@/lib/catalog';
import { inr } from '@/lib/format';
import { PageHeader, LinkButton, btnLight } from '@/components/admin/Page';
import { ActionButton } from '@/components/admin/ui';
import { toggleProduct } from '../../actions';
import { StockInput } from './StockInput';

export const metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([
    listProducts({ activeOnly: false, category: sp.category || undefined, q: sp.q || undefined }),
    listCategories(false),
  ]);
  return (
    <>
      <PageHeader title="Products" sub={`${products.length} product${products.length === 1 ? '' : 's'}`} actions={<LinkButton href="/admin/products/new">Add product</LinkButton>} />

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/products">
        <select name="category" defaultValue={sp.category || ''} className="field w-auto py-1.5">
          <option value="">All categories</option>
          {categories.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <input name="q" defaultValue={sp.q || ''} placeholder="Search products" className="field w-56 py-1.5" />
        <button className={btnLight}>Filter</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-2.5">Product</th>
              <th className="px-3 py-2.5">Sizes · price · stock</th>
              <th className="px-3 py-2.5">Shown on site</th>
              <th className="px-3 py-2.5">Bestseller</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 align-top">
            {products.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'bg-gray-50 text-gray-500'}>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <Link href={`/admin/products/${p.id}`} className="font-semibold text-gray-900 hover:text-brand">{p.name}</Link>
                      <div className="text-xs text-gray-500">{p.category_name || 'No category'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-1">
                    {(p.variants || []).map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-20 truncate">{v.label}</span>
                        <span className="w-16">{inr(v.price)}</span>
                        <StockInput id={p.id} index={i} stock={Number(v.stock)} />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <ActionButton action={toggleProduct.bind(null, p.id, 'active')} showResult={false} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                    {p.active ? 'Visible' : 'Hidden'}
                  </ActionButton>
                </td>
                <td className="px-3 py-3">
                  <ActionButton action={toggleProduct.bind(null, p.id, 'featured')} showResult={false} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.featured ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600'}`}>
                    {p.featured ? 'On homepage' : 'No'}
                  </ActionButton>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="font-semibold text-brand">Edit</Link>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-600">No products found. <Link href="/admin/products/new" className="font-semibold text-brand">Add your first product</Link>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
