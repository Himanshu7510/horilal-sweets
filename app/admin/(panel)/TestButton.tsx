'use client';

import { useState, useTransition } from 'react';
import { Notice, type Result } from '@/components/admin/ui';

export function TestButton({ action, label }: { action: () => Promise<Result>; label: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Result | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending}
        className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-gray-50"
        onClick={() => start(async () => setRes(await action()))}
        title="Save your changes first, then test"
      >
        {pending ? 'Testing…' : label}
      </button>
      {res && <Notice result={res} />}
    </>
  );
}
