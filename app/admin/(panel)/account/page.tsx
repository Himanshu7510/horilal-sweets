import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/admin/Page';
import { AccountForm } from './AccountForm';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader title="Account" sub="Change the email and password you use to sign in to this admin panel." />
      <AccountForm email={admin.email} />
    </>
  );
}
