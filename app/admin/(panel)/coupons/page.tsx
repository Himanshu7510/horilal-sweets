import { q } from '@/lib/db';
import { PageHeader } from '@/components/admin/Page';
import { CouponEditor } from './CouponEditor';

export const metadata = { title: 'Coupons' };

export default async function CouponsPage() {
  const coupons = await q(`SELECT * FROM coupons ORDER BY active DESC, id DESC`);
  const toDay = (d: any) => (d ? new Date(new Date(d).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) : '');
  return (
    <>
      <PageHeader title="Coupons" sub="Discount codes customers can enter at checkout." />
      <div className="space-y-4">
        <CouponEditor initial={{ id: 0, code: '', type: 'percent', value: '', min_order: 0, max_discount: 0, usage_limit: 0, expires_at: '', active: true, description: '' }} />
        {coupons.map((c: any) => (
          <CouponEditor key={c.id} initial={{ ...JSON.parse(JSON.stringify(c)), expires_at: toDay(c.expires_at) }} />
        ))}
      </div>
    </>
  );
}
