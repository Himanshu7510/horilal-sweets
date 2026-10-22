import { headers } from 'next/headers';
import { getSetting, secretStatus } from '@/lib/settings';
import { PageHeader, Card } from '@/components/admin/Page';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { PAYMENT_FIELDS } from '@/lib/adminFields';
import { saveSettingsAction, testPaymentAction } from '../../actions';
import { TestButton } from '../TestButton';

export const metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const [initial, secrets] = await Promise.all([getSetting('payment'), secretStatus('payment')]);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const mode = initial.razorpayKeyId?.startsWith('rzp_live') ? 'Live' : initial.razorpayKeyId?.startsWith('rzp_test') ? 'Test' : '';
  return (
    <>
      <PageHeader
        title="Payments"
        sub={mode ? <>Razorpay is using <strong>{mode.toLowerCase()} mode</strong> keys{mode === 'Test' ? ' — no real money is charged.' : '.'}</> : 'Connect Razorpay to accept UPI, cards and net banking.'}
      />
      <div className="rounded-xl bg-white px-5 pt-5 shadow-sm ring-1 ring-gray-200/70">
        <SettingsForm section="payment" fields={PAYMENT_FIELDS} initial={initial} secrets={secrets} save={saveSettingsAction} extra={<TestButton action={testPaymentAction} label="Test Razorpay connection" />} />
      </div>
      <Card title="Setting up the Razorpay webhook" className="mt-6">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
          <li>In Razorpay, open <strong>Account & Settings → Webhooks → Add new webhook</strong>.</li>
          <li>Webhook URL: <code className="rounded bg-gray-100 px-1.5 py-0.5">{origin}/api/payment/webhook</code></li>
          <li>Create a secret (any strong password), and paste the same secret in the <strong>Webhook secret</strong> field above.</li>
          <li>Tick the events <strong>payment.captured</strong>, <strong>payment.failed</strong> and <strong>order.paid</strong>, then save.</li>
        </ol>
      </Card>
    </>
  );
}
