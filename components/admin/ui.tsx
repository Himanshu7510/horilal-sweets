'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type Result = { ok: boolean; message: string; id?: number; data?: any };

export function Notice({ result }: { result: Result | null }) {
  if (!result) return null;
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}
    >
      {result.message}
    </p>
  );
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed.');
  return data.url;
}

export function ImageInput({
  value,
  onChange,
  label,
  hint,
  square = true,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  square?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      {label && <span className="mb-1 block text-sm font-medium text-gray-800">{label}</span>}
      <div className="flex items-start gap-3">
        <div className={`${square ? 'h-24 w-24' : 'h-24 w-40'} shrink-0 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50`}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50" onClick={() => ref.current?.click()} disabled={busy}>
              {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </button>
            {value && (
              <button type="button" className="rounded-md px-3 py-1.5 text-sm text-red-700 hover:bg-red-50" onClick={() => onChange('')}>
                Remove
              </button>
            )}
          </div>
          <input
            className="field py-1.5 text-sm"
            placeholder="…or paste an image URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
          {err && <p className="text-xs text-red-700">{err}</p>}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setErr('');
          try {
            onChange(await uploadImage(file));
          } catch (x: any) {
            setErr(x.message);
          }
          setBusy(false);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function ImagesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [url, setUrl] = useState('');
  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src + i} className="w-28">
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[11px] text-white">Main</span>}
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30" aria-label="Move left">◀</button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="text-red-700">Remove</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="px-1 disabled:opacity-30" aria-label="Move right">▶</button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex h-28 w-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400"
        >
          <span className="text-2xl">+</span>
          {busy ? 'Uploading…' : 'Add photos'}
        </button>
      </div>
      <div className="mt-3 flex max-w-lg gap-2">
        <input className="field py-1.5 text-sm" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-3 text-sm"
          onClick={() => {
            if (url.trim()) onChange([...value, url.trim()]);
            setUrl('');
          }}
        >
          Add
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = [...(e.target.files || [])];
          if (!files.length) return;
          setBusy(true);
          setErr('');
          const added: string[] = [];
          for (const f of files) {
            try {
              added.push(await uploadImage(f));
            } catch (x: any) {
              setErr(x.message);
            }
          }
          onChange([...value, ...added]);
          setBusy(false);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// A button that runs a server action, shows the result and refreshes the page.
export function ActionButton({
  action,
  children,
  confirm: confirmText,
  className = 'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50',
  redirectTo,
  showResult = true,
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  confirm?: string;
  className?: string;
  redirectTo?: string;
  showResult?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Result | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const r = await action();
            setRes(r);
            if (r.ok && redirectTo) router.push(redirectTo);
            else router.refresh();
          });
        }}
      >
        {pending ? 'Working…' : children}
      </button>
      {showResult && res && !res.ok && <span className="text-xs text-red-700">{res.message}</span>}
      {showResult && res && res.ok && <span className="text-xs text-green-700">{res.message}</span>}
    </span>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--brand)]' : 'bg-gray-300'}`}
      >
        <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}
