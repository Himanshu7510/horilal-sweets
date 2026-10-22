'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImageInput, Notice, Toggle, type Result } from './ui';

export type Field =
  | { type: 'heading'; label: string; hint?: string }
  | {
      name: string;
      label: string;
      type: 'text' | 'textarea' | 'number' | 'color' | 'toggle' | 'image' | 'select' | 'secret' | 'list' | 'url';
      hint?: string;
      placeholder?: string;
      options?: { value: string; label: string }[];
      fields?: { name: string; label: string; type?: 'text' | 'textarea' }[];
      wide?: boolean;
      rows?: number;
      itemLabel?: string;
    };

export function SettingsForm({
  section,
  fields,
  initial,
  secrets = {},
  save,
  extra,
}: {
  section: string;
  fields: Field[];
  initial: Record<string, any>;
  secrets?: Record<string, boolean>;
  save: (key: string, values: Record<string, any>) => Promise<Result>;
  extra?: React.ReactNode;
}) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, any>>(initial);
  const [res, setRes] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, val: any) => setV((x) => ({ ...x, [k]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setRes(null);
        start(async () => {
          const values: Record<string, any> = {};
          for (const f of fields) {
            if (f.type === 'heading') continue;
            let val = v[f.name];
            if (f.type === 'number') val = val === '' || val == null ? 0 : Number(val);
            values[f.name] = val;
          }
          const r = await save(section, values);
          setRes(r);
          if (r.ok) {
            // Clear typed secrets so they're never shown again.
            setV((x) => {
              const n = { ...x };
              for (const f of fields) if (f.type === 'secret') n[f.name] = '';
              return n;
            });
            router.refresh();
          }
        });
      }}
      className="space-y-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((f, i) => {
          if (f.type === 'heading')
            return (
              <div key={i} className="border-t border-gray-200 pt-5 first:border-0 first:pt-0 md:col-span-2">
                <h3 className="font-semibold text-gray-900">{f.label}</h3>
                {f.hint && <p className="mt-0.5 text-sm text-gray-500">{f.hint}</p>}
              </div>
            );
          const wide = f.wide || ['textarea', 'list', 'image'].includes(f.type);
          const cls = wide ? 'md:col-span-2' : '';
          if (f.type === 'toggle')
            return (
              <div key={f.name} className={cls}>
                <Toggle checked={!!v[f.name]} onChange={(x) => set(f.name, x)} label={f.label} hint={f.hint} />
              </div>
            );
          if (f.type === 'image')
            return (
              <div key={f.name} className={cls}>
                <ImageInput value={v[f.name] || ''} onChange={(x) => set(f.name, x)} label={f.label} hint={f.hint} square={false} />
              </div>
            );
          if (f.type === 'list') {
            const items: any[] = Array.isArray(v[f.name]) ? v[f.name] : [];
            const upd = (idx: number, k: string, val: string) => set(f.name, items.map((it, j) => (j === idx ? { ...it, [k]: val } : it)));
            return (
              <div key={f.name} className={cls}>
                <span className="mb-1 block text-sm font-medium text-gray-800">{f.label}</span>
                {f.hint && <p className="mb-2 text-xs text-gray-500">{f.hint}</p>}
                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(f.fields || []).map((sf) => (
                          <label key={sf.name} className={sf.type === 'textarea' ? 'block sm:col-span-2' : 'block'}>
                            <span className="mb-0.5 block text-xs font-medium text-gray-600">{sf.label}</span>
                            {sf.type === 'textarea' ? (
                              <textarea className="field min-h-16 text-sm" value={it[sf.name] || ''} onChange={(e) => upd(idx, sf.name, e.target.value)} />
                            ) : (
                              <input className="field text-sm" value={it[sf.name] || ''} onChange={(e) => upd(idx, sf.name, e.target.value)} />
                            )}
                          </label>
                        ))}
                      </div>
                      <button type="button" className="mt-2 text-xs font-medium text-red-700" onClick={() => set(f.name, items.filter((_, j) => j !== idx))}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                  onClick={() => set(f.name, [...items, {}])}
                >
                  Add {f.itemLabel || 'item'}
                </button>
              </div>
            );
          }
          return (
            <label key={f.name} className={`block ${cls}`}>
              <span className="mb-1 block text-sm font-medium text-gray-800">{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea className="field" rows={f.rows || 4} value={v[f.name] ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
              ) : f.type === 'select' ? (
                <select className="field" value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                  {(f.options || []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === 'color' ? (
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-14 cursor-pointer rounded-md border border-gray-300" value={v[f.name] || '#000000'} onChange={(e) => set(f.name, e.target.value)} />
                  <input className="field" value={v[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                </div>
              ) : f.type === 'secret' ? (
                <input
                  type="password"
                  autoComplete="new-password"
                  className="field"
                  value={v[f.name] ?? ''}
                  placeholder={secrets[f.name] ? 'Saved — leave blank to keep it' : f.placeholder || 'Not set'}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  step="any"
                  className="field"
                  value={v[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {f.hint && <span className="mt-1 block text-xs text-gray-500">{f.hint}</span>}
              {f.type === 'secret' && secrets[f.name] && <span className="mt-1 block text-xs text-green-700">A value is saved. Type “-” to clear it.</span>}
            </label>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t border-gray-200 bg-white/95 px-5 py-3 backdrop-blur">
        <button type="submit" disabled={pending} className="btn btn-brand rounded-lg">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {extra}
        <div className="min-w-0 flex-1"><Notice result={res} /></div>
      </div>
    </form>
  );
}
