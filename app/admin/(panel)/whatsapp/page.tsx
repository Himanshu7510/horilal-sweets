import { getSetting } from '@/lib/settings';
import { PageHeader, Card } from '@/components/admin/Page';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { WHATSAPP_FIELDS } from '@/lib/adminFields';
import { publicWaConfig, waLink } from '@/lib/whatsapp';
import { saveSettingsAction } from '../../actions';

export const metadata = { title: 'WhatsApp' };

export default async function WhatsAppPage() {
  const [wa, site] = await Promise.all([getSetting('whatsapp'), getSetting('site')]);
  const initial = { ...wa, number: wa.number || site.whatsapp || '' };
  const cfg = publicWaConfig(initial, site);
  const test = cfg.number ? waLink(cfg.number, 'Test message from my store admin') : '';
  return (
    <>
      <PageHeader
        title="WhatsApp"
        sub={
          cfg.number
            ? cfg.ordering
              ? 'WhatsApp ordering is on.'
              : 'WhatsApp ordering is off. Customers can still chat with you if the chat button is on.'
            : 'Add your number to show WhatsApp buttons on your store.'
        }
      />
      <div className="rounded-xl bg-white px-5 pt-5 shadow-sm ring-1 ring-gray-200/70">
        <SettingsForm
          section="whatsapp"
          fields={WHATSAPP_FIELDS}
          initial={initial}
          save={saveSettingsAction}
          extra={
            test ? (
              <a href={test} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-gray-50">
                Test the link
              </a>
            ) : null
          }
        />
      </div>
      <Card title="How WhatsApp orders work" className="mt-6">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
          <li>The customer opens the order form (from the menu, a product page, the cart or the WhatsApp button) and picks sweets by category, with size and quantity.</li>
          <li>They enter their name, mobile number, address, pincode and, if you ask for it, the date they need the sweets.</li>
          <li>They review the order and tap <strong>Send order on WhatsApp</strong>. The order is saved under <strong>Orders</strong> (labelled “WhatsApp”), stock is reserved, and WhatsApp opens with every detail typed in.</li>
          <li>Reply to confirm and share your UPI or payment link. When the money arrives, open the order and click <strong>Mark paid</strong>.</li>
          <li>If the customer never pays, set the order to <strong>Cancelled</strong> to put the stock back.</li>
        </ol>
        {cfg.ordering && (
          <a href="/whatsapp-order" target="_blank" className="mt-4 inline-block text-sm font-semibold text-brand">Open the order form</a>
        )}
      </Card>
    </>
  );
}
