'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagesInput, Notice, Toggle, type Result } from '@/components/admin/ui';
import { saveProduct, deleteProduct } from '../../../actions';
import { slugify } from '@/lib/format';

export function ProductForm({ created, initial, categories }: { created?: boolean; initial: any; categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [p, setP] = useState<any>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [res, setRes] = useState<Result | null>(created ? { ok: true, message: 'Created. You can keep editing below.' } : null);
  const [pending, start] = useTransition();
  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));
  const setVar = (i: number, k: string, v: any) => set('variants', p.variants.map((x: any, j: number) => (j === i ? { ...x, [k]: v } : x)));

  const card = 'rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70';
  const label = 'mb-1 block text-sm font-medium text-gray-800';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveProduct(p);
          setRes(r);
          if (r.ok && !p.id && r.id) router.replace(`/admin/products/${r.id}?created=1`);
          else router.refresh();
        });
      }}
      className="grid gap-6 lg:grid-cols-[1.6fr_1fr]"
    >
      <div className="space-y-6">
        <section className={card}>
          <div className="space-y-4">
            <label className="block">
              <span className={label}>Name</span>
              <input
                className="field"
                required
                value={p.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (!slugTouched) set('slug', slugify(e.target.value));
                }}
              />
            </label>
            <label className="block">
              <span className={label}>Short description <span className="font-normal text-gray-500">(shown under the name)</span></span>
              <input className="field" value={p.short_description} onChange={(e) => set('short_description', e.target.value)} />
            </label>
            <label className="block">
              <span className={label}>Full description</span>
              <textarea className="field" rows={6} value={p.description} onChange={(e) => set('description', e.target.value)} />
              <span className="mt-1 block text-xs text-gray-500">Leave a blank line between paragraphs.</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Ingredients</span>
                <textarea className="field min-h-20" value={p.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
              </label>
              <label className="block">
                <span className={label}>Shelf life & storage</span>
                <textarea className="field min-h-20" value={p.shelf_life} onChange={(e) => set('shelf_life', e.target.value)} />
              </label>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-1 font-semibold">Photos</h2>
          <p className="mb-4 text-sm text-gray-500">The first photo is the main one. Square photos (at least 1000 × 1000 px) look best.</p>
          <ImagesInput value={p.images || []} onChange={(v) => set('images', v)} />
        </section>

        <section className={card}>
          <h2 className="mb-1 font-semibold">Sizes, prices & stock</h2>
          <p className="mb-4 text-sm text-gray-500">Add one row per pack size, e.g. 250 g, 500 g, 1 kg. MRP is the crossed-out price; leave it blank if there’s no discount.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-gray-600">
                <tr>
                  <th className="pb-2 pr-2 font-medium">Size label</th>
                  <th className="pb-2 pr-2 font-medium">Price (₹)</th>
                  <th className="pb-2 pr-2 font-medium">MRP (₹)</th>
                  <th className="pb-2 pr-2 font-medium">Stock</th>
                  <th className="pb-2 pr-2 font-medium">Weight (g)</th>
                  <th className="pb-2 pr-2 font-medium">SKU</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {p.variants.map((v: any, i: number) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2"><input className="field py-1.5" value={v.label} placeholder="500 g" onChange={(e) => setVar(i, 'label', e.target.value)} /></td>
                    <td className="pb-2 pr-2"><input className="field py-1.5" inputMode="numeric" value={v.price} onChange={(e) => setVar(i, 'price', e.target.value.replace(/\D/g, ''))} /></td>
                    <td className="pb-2 pr-2"><input className="field py-1.5" inputMode="numeric" value={v.mrp} onChange={(e) => setVar(i, 'mrp', e.target.value.replace(/\D/g, ''))} /></td>
                    <td className="pb-2 pr-2"><input className="field py-1.5" inputMode="numeric" value={v.stock} onChange={(e) => setVar(i, 'stock', e.target.value.replace(/\D/g, ''))} /></td>
                    <td className="pb-2 pr-2"><input className="field py-1.5" inputMode="numeric" value={v.weightGrams} onChange={(e) => setVar(i, 'weightGrams', e.target.value.replace(/\D/g, ''))} /></td>
                    <td className="pb-2 pr-2"><input className="field py-1.5" value={v.sku} onChange={(e) => setVar(i, 'sku', e.target.value)} /></td>
                    <td className="pb-2">
                      <button type="button" className="px-2 text-red-700 disabled:opacity-30" disabled={p.variants.length === 1} onClick={() => set('variants', p.variants.filter((_: any, j: number) => j !== i))} aria-label="Remove size">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            onClick={() => set('variants', [...p.variants, { label: '', price: '', mrp: '', stock: 20, sku: '', weightGrams: 500 }])}
          >
            Add size
          </button>
          <p className="mt-3 text-xs text-gray-500">Weight is the packed weight, used to calculate shipping with your courier.</p>
        </section>
      </div>

      <div className="space-y-6">
        <section className={`${card} space-y-4`}>
          <Toggle checked={p.active} onChange={(v) => set('active', v)} label="Show on website" hint="Hidden products can’t be ordered." />
          <Toggle checked={p.featured} onChange={(v) => set('featured', v)} label="Show on homepage" hint="Appears in the bestsellers section." />
          <Toggle checked={p.is_veg} onChange={(v) => set('is_veg', v)} label="Vegetarian" hint="Shows the green veg mark." />
        </section>

        <section className={`${card} space-y-4`}>
          <label className="block">
            <span className={label}>Category</span>
            <select className="field" value={p.category_id || ''} onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>Badge</span>
            <input className="field" placeholder="e.g. Bestseller, New, Sugar-free" value={p.badge} onChange={(e) => set('badge', e.target.value)} />
          </label>
          <label className="block">
            <span className={label}>Sort order</span>
            <input className="field" inputMode="numeric" value={p.sort} onChange={(e) => set('sort', e.target.value.replace(/[^\d-]/g, ''))} />
            <span className="mt-1 block text-xs text-gray-500">Lower numbers appear first.</span>
          </label>
          <label className="block">
            <span className={label}>URL slug</span>
            <input
              className="field"
              value={p.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', slugify(e.target.value));
              }}
            />
            <span className="mt-1 block truncate text-xs text-gray-500">/product/{p.slug || '…'}</span>
          </label>
        </section>

        <div className="sticky bottom-4 space-y-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200">
          <button type="submit" disabled={pending} className="btn btn-brand w-full rounded-lg">
            {pending ? 'Saving…' : p.id ? 'Save changes' : 'Create product'}
          </button>
          <Notice result={res} />
          {!!p.id && (
            <button
              type="button"
              className="w-full text-sm font-semibold text-red-700"
              onClick={() => {
                if (!window.confirm(`Delete “${p.name}”? This can’t be undone. Past orders keep their details.`)) return;
                start(async () => {
                  await deleteProduct(p.id);
                  router.push('/admin/products');
                });
              }}
            >
              Delete product
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
