import { getSetting, secretStatus } from '@/lib/settings';
import { PageHeader } from '@/components/admin/Page';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { DELIVERY_FIELDS } from '@/lib/adminFields';
import { saveSettingsAction, testDeliveryAction } from '../../actions';
import { TestButton } from '../TestButton';

export const metadata = { title: 'Delivery' };

export default async function DeliveryPage() {
  const [initial, secrets] = await Promise.all([getSetting('delivery'), secretStatus('delivery')]);
  return (
    <>
      <PageHeader
        title="Delivery"
        sub={initial.provider === 'shiprocket' ? 'Orders are shipped through Shiprocket. Book couriers from each order’s page.' : 'You enter courier and tracking details on each order’s page.'}
      />
      <div className="rounded-xl bg-white px-5 pt-5 shadow-sm ring-1 ring-gray-200/70">
        <SettingsForm section="delivery" fields={DELIVERY_FIELDS} initial={initial} secrets={secrets} save={saveSettingsAction} extra={<TestButton action={testDeliveryAction} label="Test Shiprocket login" />} />
      </div>
    </>
  );
}
