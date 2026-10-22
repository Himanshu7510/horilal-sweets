'use client';

import { useActionState } from 'react';
import { loginAction } from '../actions';

export function LoginForm({ setup }: { setup: boolean }) {
  const [state, action, pending] = useActionState(loginAction, null as any);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input name="email" type="email" required autoComplete="username" className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Password</span>
        <input name="password" type="password" required autoComplete={setup ? 'new-password' : 'current-password'} minLength={setup ? 8 : undefined} className="field" />
      </label>
      {setup && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Confirm password</span>
          <input name="confirm" type="password" required autoComplete="new-password" className="field" />
        </label>
      )}
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn btn-brand w-full rounded-lg py-2.5">
        {pending ? 'Please wait…' : setup ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}
