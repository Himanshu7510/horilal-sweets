import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPage } from '@/lib/catalog';
import { renderMarkdown } from '@/lib/markdown';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await getPage((await params).slug);
  return page ? { title: page.title } : {};
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">{page.title}</h1>
      <div className="prose-store mt-6 text-[17px] leading-relaxed text-ink-soft" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
    </article>
  );
}
