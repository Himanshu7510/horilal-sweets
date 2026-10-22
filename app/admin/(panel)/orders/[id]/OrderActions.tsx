'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Notice, Toggle, type Result } from '@/components/admin/ui';
import {
  updateOrderStatus,
  saveAdminNote,
  saveManualShipping,
  shiprocketAction,
  markOrderPaid,
  refundOrder,
} from '../../../actions';

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Result | null>(null);
  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      router.refresh();
    });
  return { pending, res, run };
}

const primary = 'rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50';
const light = 'rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50';

export function StatusForm({ id, current, statuses }: { id: number; current: string; statuses: { value: string; label: string }[] }) {
  const [status, setStatus] = useState(current === 'pending_payment' ? 'cancelled' : current);
  const [note, setNote] = useState('');
  const { pending, res, run } = useRun();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input className="field min-w-48 flex-1" placeholder="Note (optional, shown in history)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          className={primary}
          disabled={pending || status === current}
          onClick={() => run(async () => {
            const r = await updateOrderStatus(id, status, note);
            if (r.ok) setNote('');
            return r;
          })}
        >
          {pending ? 'Saving…' : 'Update status'}
        </button>
      </div>
      <Notice result={res} />
    </div>
  );
}

export function NoteForm({ id, note }: { id: number; note: string }) {
  const [v, setV] = useState(note || '');
  const { pending, res, run } = useRun();
  return (
    <div className="space-y-2">
      <textarea className="field text-sm" value={v} onChange={(e) => setV(e.target.value)} placeholder="Only visible to you" />
      <button className={light} disabled={pending} onClick={() => run(() => saveAdminNote(id, v))}>
        {pending ? 'Saving…' : 'Save note'}
      </button>
      <Notice result={res} />
    </div>
  );
}

export function ManualShipping({ id, shipping }: { id: number; shipping: any }) {
  const [v, setV] = useState({
    courier: shipping.courier || '',
    trackingNumber: shipping.trackingNumber || shipping.awb || '',
    trackingUrl: shipping.trackingUrl || '',
    markShipped: true,
  });
  const { pending, res, run } = useRun();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Courier name</span>
          <input className="field" placeholder="e.g. Delhivery, Blue Dart, own delivery" value={v.courier} onChange={(e) => setV({ ...v, courier: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Tracking / AWB number</span>
          <input className="field" value={v.trackingNumber} onChange={(e) => setV({ ...v, trackingNumber: e.target.value })} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Tracking link</span>
          <input className="field" placeholder="https://" value={v.trackingUrl} onChange={(e) => setV({ ...v, trackingUrl: e.target.value })} />
        </label>
      </div>
      <Toggle checked={v.markShipped} onChange={(x) => setV({ ...v, markShipped: x })} label="Also mark the order as shipped" />
      <button className={primary} disabled={pending} onClick={() => run(() => saveManualShipping(id, v))}>
        {pending ? 'Saving…' : 'Save shipping details'}
      </button>
      <Notice result={res} />
    </div>
  );
}

export function ShiprocketPanel({ id, shipping }: { id: number; shipping: any }) {
  const { pending, res, run } = useRun();
  const created = !!shipping.shipmentId;
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="text-sm">
        <span className="font-semibold">Shiprocket</span>
        {created ? (
          <span className="text-gray-600"> · Order {shipping.shiprocketOrderId}, shipment {shipping.shipmentId}{shipping.pickupRequested ? ' · pickup requested' : ''}</span>
        ) : (
          <span className="text-gray-600"> · Not sent to Shiprocket yet</span>
        )}
      </div>
      {shipping.awbError && <p className="text-xs text-amber-800">AWB: {shipping.awbError}</p>}
      {shipping.pickupError && <p className="text-xs text-amber-800">Pickup: {shipping.pickupError}</p>}
      <div className="flex flex-wrap gap-2">
        {!created && (
          <button className={primary} disabled={pending} onClick={() => run(() => shiprocketAction(id, 'create'))}>
            {pending ? 'Working…' : 'Create shipment on Shiprocket'}
          </button>
        )}
        {created && !shipping.awb && (
          <button className={primary} disabled={pending} onClick={() => run(() => shiprocketAction(id, 'awb'))}>Assign courier (AWB)</button>
        )}
        {created && shipping.awb && !shipping.pickupRequested && (
          <button className={primary} disabled={pending} onClick={() => run(() => shiprocketAction(id, 'pickup'))}>Request pickup</button>
        )}
        {shipping.awb && (
          <button className={light} disabled={pending} onClick={() => run(() => shiprocketAction(id, 'track'))}>Refresh tracking</button>
        )}
      </div>
      <Notice result={res} />
      {shipping.lastTracking?.activities?.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-gray-700">
          {shipping.lastTracking.activities.map((a: any, k: number) => (
            <li key={k}><span className="text-gray-500">{a.date}</span> · {a.status} {a.location && `· ${a.location}`}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PaymentActions({ id, total, canMarkPaid, canRefund }: { id: number; total: number; canMarkPaid: boolean; canRefund: boolean }) {
  const { pending, res, run } = useRun();
  const [ref, setRef] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <div className="space-y-3">
      {canMarkPaid && (
        <div className="flex gap-2">
          <input className="field py-1.5 text-sm" placeholder="Reference (UPI ID, cash…)" value={ref} onChange={(e) => setRef(e.target.value)} />
          <button className={light} disabled={pending} onClick={() => run(() => markOrderPaid(id, ref))}>Mark paid</button>
        </div>
      )}
      {canRefund && (
        <div className="flex gap-2">
          <input className="field py-1.5 text-sm" inputMode="numeric" placeholder={`Amount (blank = full ₹${total})`} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
          <button
            className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Refund ₹${amount || total} to the customer through Razorpay?`)) return;
              run(() => refundOrder(id, Number(amount) || 0));
            }}
          >
            Refund
          </button>
        </div>
      )}
      <Notice result={res} />
    </div>
  );
}
