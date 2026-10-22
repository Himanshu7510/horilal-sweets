import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { waLink } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Contact us' };

async function send(formData: FormData) {
  'use server';
  const get = (k: string, n = 200) => String(formData.get(k) || '').trim().slice(0, n);
  if (get('company')) redirect('/contact?sent=1'); // spam trap
  const message = get('message', 3000);
  if (!get('name') || message.length < 5) redirect('/contact?error=1');
  await q(`INSERT INTO messages (name, email, phone, message) VALUES ($1,$2,$3,$4)`, [get('name', 80), get('email', 120), get('phone', 20), message]);
  redirect('/contact?sent=1');
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  const [footer, site, waSettings] = await Promise.all([getSetting('footer'), getSetting('site'), getSetting('whatsapp')]);
  const wa = waLink(waSettings.number || site.whatsapp, waSettings.chatMessage || '');
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 pt-12 sm:px-6 md:grid-cols-[1fr_1.2fr]">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl">Contact us</h1>
        <p className="mt-3 text-ink-soft">Questions about an order, bulk or corporate gifting? We usually reply within a day.</p>
        <dl className="mt-8 space-y-5 text-[16px]">
          {footer.phone && <div><dt className="font-semibold">Phone</dt><dd><a className="text-brand" href={`tel:${footer.phone}`}>{footer.phone}</a></dd></div>}
          {wa && <div><dt className="font-semibold">WhatsApp</dt><dd><a className="text-brand" href={wa} target="_blank" rel="noreferrer">Chat with us</a></dd></div>}
          {footer.email && <div><dt className="font-semibold">Email</dt><dd><a className="text-brand" href={`mailto:${footer.email}`}>{footer.email}</a></dd></div>}
          {footer.address && <div><dt className="font-semibold">Address</dt><dd className="whitespace-pre-line text-ink-soft">{footer.address}</dd></div>}
          {footer.hours && <div><dt className="font-semibold">Hours</dt><dd className="text-ink-soft">{footer.hours}</dd></div>}
        </dl>
      </div>
      <div className="rounded-[22px] bg-white p-6 shadow-[0_1px_0_var(--color-line),0_10px_30px_-18px_rgba(43,21,52,0.35)] sm:p-8">
        {sent ? (
          <div>
            <h2 className="text-xl font-bold">Message sent</h2>
            <p className="mt-2 text-ink-soft">Thanks for writing to us. We’ll get back to you soon.</p>
          </div>
        ) : (
          <form action={send} className="space-y-4">
            <label className="block"><span className="mb-1 block font-medium">Name</span><input name="name" required className="field" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block font-medium">Email</span><input type="email" name="email" className="field" /></label>
              <label className="block"><span className="mb-1 block font-medium">Phone</span><input name="phone" inputMode="tel" className="field" /></label>
            </div>
            <label className="block"><span className="mb-1 block font-medium">Message</span><textarea name="message" required className="field min-h-32" /></label>
            <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            {error && <p role="alert" className="text-[15px] font-medium text-brand">Please add your name and a message.</p>}
            <button className="btn btn-brand py-3">Send message</button>
          </form>
        )}
      </div>
    </div>
  );
}
