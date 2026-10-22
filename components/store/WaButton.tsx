'use client';

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

export function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <WaAnchor
      href={href}
      placement="floating"
      label="Chat on WhatsApp"
      className="fixed bottom-5 left-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5b]"
    >
      <WhatsAppIcon size={26} />
    </WaAnchor>
  );
}
