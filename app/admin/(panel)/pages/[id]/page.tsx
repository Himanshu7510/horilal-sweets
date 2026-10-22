import { notFound } from 'next/navigation';
import { q1 } from '@/lib/db';
import { PageHeader, LinkButton } from '@/components/admin/Page';
import { PageForm } from './PageForm';

export const metadata = { title: 'Edit page' };

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const created = !!(await searchParams).created;
  const isNew = id === 'new';
  const page = isNew ? null : await q1(`SELECT * FROM pages WHERE id = $1`, [Number(id)]);
  if (!isNew && !page) notFound();
  const initial = page || { id: 0, slug: '', title: '', content: '', active: true, in_footer: true, in_header: false, sort: 10 };
  return (
    <>
      <PageHeader
        title={isNew ? 'Add page' : page!.title}
        actions={
          <>
            {!isNew && page!.active && <LinkButton light href={`/p/${page!.slug}`}>View on store</LinkButton>}
            <LinkButton light href="/admin/pages">All pages</LinkButton>
          </>
        }
      />
      <PageForm created={created} initial={JSON.parse(JSON.stringify(initial))} />
    </>
  );
}
