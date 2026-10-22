import { q } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { PageHeader } from '@/components/admin/Page';
import { ActionButton } from '@/components/admin/ui';
import { markMessage, deleteMessage } from '../../actions';

export const metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const messages = await q(`SELECT * FROM messages ORDER BY created_at DESC LIMIT 200`);
  return (
    <>
      <PageHeader title="Messages" sub="Sent through the contact form on your website." />
      <div className="space-y-3">
        {messages.map((m: any) => (
          <article key={m.id} className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${m.read ? 'ring-gray-200/70' : 'ring-[var(--brand)]/40'}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-semibold">{m.name}</span>
                {!m.read && <span className="ml-2 rounded-full bg-accent px-2 text-xs font-bold text-ink">New</span>}
                <div className="text-sm text-gray-600">
                  {m.email && <a href={`mailto:${m.email}`} className="text-brand">{m.email}</a>}
                  {m.email && m.phone && ' · '}
                  {m.phone && <a href={`tel:${m.phone}`} className="text-brand">{m.phone}</a>}
                </div>
              </div>
              <span className="text-xs text-gray-500">{fmtDate(m.created_at)}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-gray-800">{m.message}</p>
            <div className="mt-3 flex gap-2">
              <ActionButton action={markMessage.bind(null, m.id, !m.read)} showResult={false}>{m.read ? 'Mark unread' : 'Mark as read'}</ActionButton>
              <ActionButton action={deleteMessage.bind(null, m.id)} confirm="Delete this message?" showResult={false} className="rounded-md px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">Delete</ActionButton>
            </div>
          </article>
        ))}
        {!messages.length && <p className="rounded-xl bg-white p-10 text-center text-gray-600 shadow-sm">No messages yet.</p>}
      </div>
    </>
  );
}
