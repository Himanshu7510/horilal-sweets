import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { dbKind, q1 } from '@/lib/db';
import { logoutAction } from '../actions';
import { AdminNav } from './AdminNav';

export const metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [site, kind, counts] = await Promise.all([
    getSetting('site'),
    dbKind(),
    q1(
      `SELECT (SELECT count(*)::int FROM orders WHERE status IN ('placed','confirmed')) AS new_orders,
              (SELECT count(*)::int FROM messages WHERE NOT read) AS unread`
    ),
  ]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 lg:flex" style={{ fontSize: 15 }}>
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-screen lg:self-start lg:w-60 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="font-display text-2xl text-white">{site.brandName}</Link>
          <div className="text-xs text-white/50 lg:mt-1">Admin panel</div>
        </div>
        <AdminNav newOrders={counts?.new_orders || 0} unread={counts?.unread || 0} />
        <div className="hidden border-t border-white/10 px-5 py-4 text-xs text-white/60 lg:block">
          <div className="truncate">{admin.email}</div>
          <div className="mt-2 flex gap-3">
            <Link href="/" target="_blank" className="hover:text-white">View store</Link>
            <form action={logoutAction}><button className="hover:text-white">Sign out</button></form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {kind === 'pglite' && (
          <div className="bg-amber-100 px-5 py-2.5 text-sm text-amber-900">
            <strong>Database not connected.</strong> Changes and orders are stored temporarily and may be lost when the server restarts.
            Connect a Postgres database (Vercel → Storage → Neon) to keep them permanently.
          </div>
        )}
        <div className="flex items-center justify-end gap-4 px-5 pt-3 text-sm lg:hidden">
          <Link href="/" target="_blank" className="text-gray-600">View store</Link>
          <form action={logoutAction}><button className="text-gray-600">Sign out</button></form>
        </div>
        <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
      </div>
    </div>
  );
}
