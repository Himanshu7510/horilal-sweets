import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-20 text-center">
      <h1 className="font-display text-5xl">Page not found</h1>
      <p className="mt-3 text-ink-soft">This page doesn’t exist or the link has expired.</p>
      <Link href="/" className="btn btn-brand mt-8">Go to the homepage</Link>
    </div>
  );
}
