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
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-700">
          <li>When a customer chooses WhatsApp at checkout, the order is saved under <strong>Orders</strong> with a “WhatsApp” label and the stock is reserved.</li>
          <li>The customer is then shown a button that opens WhatsApp with their order number, items, total and address already typed.</li>
          <li>Reply to confirm, share your UPI or payment link, then open the order and click <strong>Mark paid</strong> when the money arrives.</li>
          <li>If the customer never pays, change the order status to <strong>Cancelled</strong> to put the stock back.</li>
        </ul>
      </Card>
    </>
  );
}
