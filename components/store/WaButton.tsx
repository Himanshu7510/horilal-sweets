'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';
import { WhatsAppIcon } from './WhatsAppIcon';

// A link that opens WhatsApp and reports the click to analytics.
export function WaAnchor({
  href,
  placement,
  className,
  children,
  label,
}: {
  href: string;
  placement: string;
  className?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className} onClick={() => track('whatsapp_click', { placement })}>
      {children}
    </a>
  );
}

const fab = 'flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5b]';

// Floating button, bottom right. With WhatsApp ordering on, it opens a small menu:
// order sweets (the guided order form) or just chat.
export function FloatingWhatsApp({ chatHref, orderHref }: { chatHref: string; orderHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  // Hidden on the order form itself, where it would cover the action bar.
  if (path?.startsWith('/whatsapp-order')) return null;

  const wrap = 'fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3';

  if (!orderHref) {
    return (
      <div className={wrap}>
        <WaAnchor href={chatHref} placement="floating" label="Chat on WhatsApp" className={fab}>
          <WhatsAppIcon size={28} />
        </WaAnchor>
      </div>
    );
  }

  return (
    <div ref={ref} className={wrap}>
      {open && (
        <div role="menu" className="w-64 overflow-hidden rounded-2xl bg-white text-ink shadow-2xl ring-1 ring-black/5">
          <div className="bg-[#25D366] px-4 py-3 text-white">
            <div className="font-semibold">Order on WhatsApp</div>
            <div className="text-sm text-white/90">We usually reply within minutes.</div>
          </div>
          <Link role="menuitem" href={orderHref} className="block px-4 py-3 hover:bg-[#E7F8EE]">
            <span className="block font-semibold">Order sweets</span>
            <span className="text-sm text-ink-soft">Pick sweets, add your address, send.</span>
          </Link>
          {chatHref && (
            <a
              role="menuitem"
              href={chatHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('whatsapp_click', { placement: 'floating' })}
              className="block border-t border-line px-4 py-3 hover:bg-[#E7F8EE]"
            >
              <span className="block font-semibold">Chat with us</span>
              <span className="text-sm text-ink-soft">Ask about sweets, bulk or gifting.</span>
            </a>
          )}
        </div>
      )}
      <button type="button" aria-expanded={open} aria-label="WhatsApp options" onClick={() => setOpen((o) => !o)} className={fab}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <WhatsAppIcon size={28} />
        )}
      </button>
    </div>
  );
}
