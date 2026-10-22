import { listCategories } from '@/lib/catalog';
import { PageHeader } from '@/components/admin/Page';
import { CategoryEditor } from './CategoryEditor';

export const metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const categories = await listCategories(false);
  return (
    <>
      <PageHeader title="Categories" sub="Group your sweets so customers can browse by kind. Categories appear in the menu, on the homepage and in the footer." />
      <div className="space-y-4">
        {categories.map((c: any) => (
          <CategoryEditor key={c.id} initial={JSON.parse(JSON.stringify(c))} />
        ))}
        <CategoryEditor initial={{ id: 0, name: '', slug: '', description: '', image: '', sort: categories.length + 1, active: true }} />
      </div>
    </>
  );
}
