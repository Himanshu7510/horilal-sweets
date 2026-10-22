'use client';

import { useState, useTransition } from 'react';
import { updateStock } from '../../actions';

export function StockInput({ id, index, stock }: { id: number; index: number; stock: number }) {
  const [v, setV] = useState(String(stock));
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const save = () => {
    if (Number(v) === stock || v === '') return;
    start(async () => {
      await updateStock(id, index, Number(v));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };
  return (
    <span className="flex items-center gap-1.5">
      <input
        aria-label="Stock"
        inputMode="numeric"
        className={`w-16 rounded-md border px-2 py-1 text-sm ${Number(v) <= 0 ? 'border-red-300 bg-red-50' : Number(v) <= 5 ? 'border-amber-300 bg-amber-50' : 'border-gray-300'}`}
        value={v}
        onChange={(e) => setV(e.target.value.replace(/\D/g, ''))}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      <span className="w-10 text-xs text-gray-500">{pending ? '…' : saved ? 'Saved' : 'in stock'}</span>
    </span>
  );
}
