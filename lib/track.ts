// Sends shop events to whichever tools are set up in Admin → Marketing & tracking:
// Meta Pixel (fbq), Google Analytics 4 / Google Ads (gtag) and Google Tag Manager (dataLayer).

export type TrackItem = { id: string; name: string; variant?: string; price: number; qty: number };
type EventName = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'whatsapp_click';

const META: Record<EventName, string> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  whatsapp_click: 'Contact',
};

export function track(event: EventName, data: { items?: TrackItem[]; value?: number; orderId?: string; placement?: string } = {}) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const cfg = w.__storeTracking || {};
  if (cfg.ecommerce === false && event !== 'whatsapp_click') return;
  const items = data.items || [];
  const value = data.value ?? items.reduce((s, i) => s + i.price * i.qty, 0);

  try {
    if (typeof w.fbq === 'function') {
      const payload: any = { currency: 'INR', value };
      if (items.length) {
        payload.content_ids = items.map((i) => i.id);
        payload.content_type = 'product';
        payload.contents = items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price }));
        payload.num_items = items.reduce((s, i) => s + i.qty, 0);
      }
      if (event === 'whatsapp_click') w.fbq('track', 'Contact', { content_name: data.placement || 'whatsapp' });
      else w.fbq('track', META[event], payload, data.orderId ? { eventID: `${event}-${data.orderId}` } : undefined);
    }
  } catch {}

  const gaItems = items.map((i) => ({ item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty }));

  try {
    if (typeof w.gtag === 'function') {
      if (event === 'whatsapp_click') {
        w.gtag('event', 'whatsapp_click', { placement: data.placement || '' });
      } else {
        w.gtag('event', event, { currency: 'INR', value, items: gaItems, ...(data.orderId ? { transaction_id: data.orderId } : {}) });
      }
      if (cfg.adsId && event === 'purchase' && cfg.adsPurchaseLabel) {
        w.gtag('event', 'conversion', { send_to: `${cfg.adsId}/${cfg.adsPurchaseLabel}`, value, currency: 'INR', transaction_id: data.orderId || '' });
      }
      if (cfg.adsId && event === 'add_to_cart' && cfg.adsCartLabel) {
        w.gtag('event', 'conversion', { send_to: `${cfg.adsId}/${cfg.adsCartLabel}`, value, currency: 'INR' });
      }
    }
  } catch {}

  try {
    if (cfg.gtm) {
      w.dataLayer = w.dataLayer || [];
      if (event === 'whatsapp_click') {
        w.dataLayer.push({ event: 'whatsapp_click', placement: data.placement || '' });
      } else {
        w.dataLayer.push({ ecommerce: null });
        w.dataLayer.push({
          event,
          ecommerce: { currency: 'INR', value, items: gaItems, ...(data.orderId ? { transaction_id: data.orderId } : {}) },
        });
      }
    }
  } catch {}
}
