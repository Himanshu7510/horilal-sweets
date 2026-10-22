'use client';

import { useState, useTransition } from 'react';
import { Notice, type Result } from '@/components/admin/ui';
import { changeCredentials } from '../../actions';

export function AccountForm({ email }: { email: string }) {
  const [v, setV] = useState({ email, current: '', password: '', confirm: '' });
  const [res, setRes] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changeCredentials(v);
          setRes(r);
          if (r.ok) setV({ ...v, current: '', password: '', confirm: '' });
        });
      }}
      className="max-w-md space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70"
    >
      <label className="block"><span className="mb-1 block text-sm font-medium">Email</span><input type="email" required className="field" value={v.email} onChange={set('email')} autoComplete="username" /></label>
      <label className="block"><span className="mb-1 block text-sm font-medium">New password <span className="font-normal text-gray-500">(leave blank to keep)</span></span><input type="password" className="field" value={v.password} onChange={set('password')} autoComplete="new-password" /></label>
      <label className="block"><span className="mb-1 block text-sm font-medium">Confirm new password</span><input type="password" className="field" value={v.confirm} onChange={set('confirm')} autoComplete="new-password" /></label>
      <label className="block border-t border-gray-100 pt-4"><span className="mb-1 block text-sm font-medium">Current password</span><input type="password" required className="field" value={v.current} onChange={set('current')} autoComplete="current-password" /></label>
      <button disabled={pending} className="btn btn-brand rounded-lg">{pending ? 'Saving…' : 'Update login details'}</button>
      <Notice result={res} />
    </form>
  );
}
