'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { Notice, Toggle, type Result } from '@/components/admin/ui';
import { savePage, deletePage } from '../../../actions';
import { slugify } from '@/lib/format';

export function PageForm({ created, initial }: { created?: boolean; initial: any }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [res, setRes] = useState<Result | null>(created ? { ok: true, message: 'Created. You can keep editing below.' } : null);
  const [pending, start] = useTransition();
  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await savePage(p);
          setRes(r);
          if (r.ok && !p.id && r.id) router.replace(`/admin/pages/${r.id}?created=1`);
          else router.refresh();
        });
      }}
      className="grid gap-6 lg:grid-cols-[1.7fr_1fr]"
    >
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Title</span>
          <input className="field" required value={p.title} onChange={(e) => { set('title', e.target.value); if (!initial.id) set('slug', slugify(e.target.value)); }} />
        </label>
        <div className="mt-4 mb-1 flex items-center justify-between">
          <span className="text-sm font-medium">Content</span>
          <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-semibold">
            <button type="button" onClick={() => setPreview(false)} className={`rounded-md px-3 py-1 ${!preview ? 'bg-white shadow-sm' : 'text-gray-600'}`}>Write</button>
            <button type="button" onClick={() => setPreview(true)} className={`rounded-md px-3 py-1 ${preview ? 'bg-white shadow-sm' : 'text-gray-600'}`}>Preview</button>
          </div>
        </div>
        {preview ? (
          <div className="prose-store min-h-80 rounded-lg border border-gray-200 p-4" dangerouslySetInnerHTML={{ __html: marked.parse(p.content || '', { async: false, breaks: true }) as string }} />
        ) : (
          <textarea className="field min-h-80 font-mono text-sm" value={p.content} onChange={(e) => set('content', e.target.value)} />
        )}
        <p className="mt-2 text-xs text-gray-500">
          Formatting: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>[link text](https://…)</code>. Leave a blank line between paragraphs.
        </p>
      </section>

      <div className="space-y-6">
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70">
          <Toggle checked={p.active} onChange={(v) => set('active', v)} label="Published" />
          <Toggle checked={p.in_header} onChange={(v) => set('in_header', v)} label="Show in top menu" />
          <Toggle checked={p.in_footer} onChange={(v) => set('in_footer', v)} label="Show in footer" />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">URL slug</span>
            <input className="field" value={p.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
            <span className="mt-1 block text-xs text-gray-500">/p/{p.slug || '…'}</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Sort order</span>
            <input className="field" inputMode="numeric" value={p.sort} onChange={(e) => set('sort', e.target.value.replace(/[^\d-]/g, ''))} />
          </label>
        </section>
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70">
          <button disabled={pending} className="btn btn-brand w-full rounded-lg">{pending ? 'Saving…' : p.id ? 'Save page' : 'Create page'}</button>
          <Notice result={res} />
          {!!p.id && (
            <button
              type="button"
              className="w-full text-sm font-semibold text-red-700"
              onClick={() => {
                if (!window.confirm(`Delete the “${p.title}” page?`)) return;
                start(async () => {
                  await deletePage(p.id);
                  router.push('/admin/pages');
                });
              }}
            >
              Delete page
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
