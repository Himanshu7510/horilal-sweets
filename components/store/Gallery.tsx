'use client';

import { useState } from 'react';

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [];
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-[28px] bg-brand-soft">
        {list[i] && <img src={list[i]} alt={name} className="h-full w-full object-cover" />}
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {list.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show image ${idx + 1}`}
              className={`h-18 w-18 overflow-hidden rounded-xl border-2 ${idx === i ? 'border-brand' : 'border-transparent'}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
