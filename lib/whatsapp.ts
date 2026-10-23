// Helpers for WhatsApp click-to-chat ordering (works on phones and WhatsApp Web).

export function waNumber(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits; // assume an Indian mobile number
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1);
  return digits;
}

export function waLink(number: string, text: string): string {
  const n = waNumber(number);
  if (!n) return '';
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return String(template || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export const rupees = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export function itemLines(items: { name: string; variant: string; qty: number; price: number }[]): string {
  return items.map((i) => `• ${i.name} (${i.variant}) × ${i.qty} = ${rupees(i.price * i.qty)}`).join('\n');
}

// Public WhatsApp config that is safe to send to the browser.
export type WaConfig = {
  number: string;
  ordering: boolean;
  headerLink: boolean;
  product: boolean;
  cart: boolean;
  checkout: boolean;
  checkoutLabel: string;
  checkoutNote: string;
};

export function publicWaConfig(wa: any, site: any): WaConfig {
  const number = waNumber(wa.number || site.whatsapp || '');
  const ordering = !!wa.orderingEnabled && !!number;
  return {
    number,
    ordering,
    headerLink: ordering && wa.headerLink !== false,
    product: ordering && !!wa.productButton,
    cart: ordering && !!wa.cartButton,
    checkout: ordering && !!wa.checkoutOption,
    checkoutLabel: wa.checkoutLabel || 'Order on WhatsApp',
    checkoutNote: wa.checkoutNote || '',
  };
}
