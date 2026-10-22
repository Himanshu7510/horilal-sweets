'use client';

import { useState } from 'react';

export function PincodeCheck() {
  const [pin, setPin] = useState('');
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`/api/pincode?pin=${encodeURIComponent(pin)}`);
      setRes(await r.json());
      try {
        localStorage.setItem('store_pincode', pin);
      } catch {}
    } catch {
      setRes({ ok: false, message: 'Couldn’t check right now. Try again.' });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={check} className="rounded-2xl border border-line bg-white p-4">
      <label htmlFor="pin" className="block font-semibold">Check delivery to your pincode</label>
      <div className="mt-2 flex gap-2">
        <input
          id="pin"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="6-digit pincode"
          className="field max-w-44"
        />
        <button className="btn btn-ghost py-2 text-brand" disabled={pin.length !== 6 || busy}>
          {busy ? 'Checking…' : 'Check'}
        </button>
      </div>
      {res && <p className={`mt-2 text-[15px] ${res.ok ? 'text-[#3e6b1f]' : 'text-brand'}`}>{res.message}</p>}
    </form>
  );
}
