export function VegMark({ veg = true }: { veg?: boolean }) {
  return (
    <span
      title={veg ? 'Vegetarian' : 'Contains egg'}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center border-2 ${veg ? 'border-green-700' : 'border-red-700'}`}
    >
      <span className={`h-2 w-2 rounded-full ${veg ? 'bg-green-700' : 'bg-red-700'}`} />
      <span className="sr-only">{veg ? 'Vegetarian' : 'Contains egg'}</span>
    </span>
  );
}
