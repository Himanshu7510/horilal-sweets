import Link from 'next/link';
import { statusLabel } from '@/lib/defaults';

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-gray-600">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, actions, className = '' }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-gray-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const COLORS: Record<string, string> = {
  pending_payment: 'bg-gray-100 text-gray-700',
  placed: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  packed: 'bg-indigo-100 text-indigo-900',
  shipped: 'bg-violet-100 text-violet-900',
  out_for_delivery: 'bg-violet-100 text-violet-900',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-900',
  partially_refunded: 'bg-orange-100 text-orange-900',
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[value] || 'bg-gray-100 text-gray-700'}`}>
      {label || statusLabel(value).replace('_', ' ')}
    </span>
  );
}

export const btn = 'inline-flex items-center rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90';
export const btnLight = 'inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50';

export function LinkButton({ href, children, light }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <Link href={href} className={light ? btnLight : btn}>{children}</Link>;
}
