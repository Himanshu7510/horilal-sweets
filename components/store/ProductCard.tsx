import Link from 'next/link';
import { inr } from '@/lib/format';
import { fromPrice, totalStock, type Product } from '@/lib/catalog';
import { VegMark } from './VegMark';
export { VegMark };

export function ProductCard({ p, showVeg = true }: { p: Product; showVeg?: boolean }) {
  const price = fromPrice(p);
  const v0 = p.variants?.find((v) => Number(v.price) === price) || p.variants?.[0];
  const mrp = Number(v0?.mrp || 0);
  const out = totalStock(p) <= 0;
  return (
    <Link href={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-[22px] bg-brand-soft">
        {p.images?.[0] ? (
          <img
            src={p.images[0]}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        {p.badge && !out && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-[13px] font-semibold text-brand shadow-sm">
            {p.badge}
          </span>
        )}
        {out && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-0.5 text-[13px] font-semibold text-white">Sold out</span>
        )}
      </div>
      <div className="mt-3 flex items-start gap-2">
        {showVeg && <span className="mt-1.5"><VegMark veg={p.is_veg} /></span>}
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug group-hover:text-brand">{p.name}</h3>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-semibold">{p.variants?.length > 1 ? 'From ' : ''}{inr(price)}</span>
            {mrp > price && <span className="text-sm text-ink-soft line-through">{inr(mrp)}</span>}
            {v0?.label && <span className="text-sm text-ink-soft">/ {v0.label}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
