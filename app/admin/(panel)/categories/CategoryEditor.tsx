'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImageInput, Notice, Toggle, type Result } from '@/components/admin/ui';
import { saveCategory, deleteCategory } from '../../actions';
import { slugify } from '@/lib/format';

export function CategoryEditor({ initial }: { initial: any }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [open, setOpen] = useState(false);
  const [c, setC] = useState(initial);
  const [res, setRes] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, v: any) => setC((x: any) => ({ ...x, [k]: v }));

  if (isNew && !open)
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-xl border-2 border-dashed border-gray-300 p-4 text-sm font-semibold text-gray-700 hover:border-gray-400">
        + Add a category
      </button>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveCategory(c);
          setRes(r);
          if (r.ok && isNew) {
            setC(initial);
            setOpen(false);
          }
          router.refresh();
        });
      }}
      className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70"
    >
      <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Name</span>
            <input className="field" required value={c.name} onChange={(e) => { set('name', e.target.value); if (isNew) set('slug', slugify(e.target.value)); }} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Description</span>
            <input className="field" value={c.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">URL slug</span>
              <input className="field" value={c.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Sort order</span>
              <input className="field" inputMode="numeric" value={c.sort} onChange={(e) => set('sort', e.target.value.replace(/[^\d-]/g, ''))} />
            </label>
          </div>
          <Toggle checked={c.active} onChange={(v) => set('active', v)} label="Show on website" />
        </div>
        <div>
          <ImageInput value={c.image} onChange={(v) => set('image', v)} label="Image" hint="Shown as a round thumbnail on the homepage." />
          {!isNew && <p className="mt-3 text-sm text-gray-600">{c.product_count} active product{c.product_count === 1 ? '' : 's'}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <button disabled={pending} className="btn btn-brand rounded-lg py-2">{pending ? 'Saving…' : isNew ? 'Add category' : 'Save'}</button>
        {isNew ? (
          <button type="button" className="text-sm text-gray-600" onClick={() => setOpen(false)}>Cancel</button>
        ) : (
          <button
            type="button"
            className="text-sm font-semibold text-red-700"
            onClick={() => {
              if (!window.confirm(`Delete the “${c.name}” category? Its products will stay but become uncategorised.`)) return;
              start(async () => {
                await deleteCategory(c.id);
                router.refresh();
              });
            }}
          >
            Delete
          </button>
        )}
        <Notice result={res} />
      </div>
    </form>
  );
}
