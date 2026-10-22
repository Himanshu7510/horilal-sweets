import { notFound } from 'next/navigation';
import { getProductById, listCategories } from '@/lib/catalog';
import { PageHeader, LinkButton } from '@/components/admin/Page';
import { ProductForm } from './ProductForm';

export const metadata = { title: 'Edit product' };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const created = !!(await searchParams).created;
  const categories = await listCategories(false);
  const isNew = id === 'new';
  const p = isNew ? null : await getProductById(Number(id));
  if (!isNew && !p) notFound();
  const initial = p || {
    id: 0,
    name: '',
    slug: '',
    category_id: categories[0]?.id || null,
    short_description: '',
    description: '',
    ingredients: '',
    shelf_life: '',
    images: [],
    variants: [{ label: '500 g', price: '', mrp: '', stock: 20, sku: '', weightGrams: 500 }],
    badge: '',
    is_veg: true,
    featured: false,
    active: true,
    sort: 0,
  };
  return (
    <>
      <PageHeader
        title={isNew ? 'Add product' : p!.name}
        actions={
          <>
            {!isNew && p!.active && <LinkButton light href={`/product/${p!.slug}`}>View on store</LinkButton>}
            <LinkButton light href="/admin/products">All products</LinkButton>
          </>
        }
      />
      <ProductForm created={created} initial={JSON.parse(JSON.stringify(initial))} categories={categories.map((c: any) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
