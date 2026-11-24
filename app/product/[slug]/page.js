import { notFound } from 'next/navigation';
import { supabase, PRODUCT_FIELDS } from '../../../lib/supabase';
import ProductCard from '../../../components/ProductCard';
import SizeGuide from '../../../components/SizeGuide';
import ProductView from './ProductView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { data } = await supabase.from('products').select('name, description').eq('slug', params.slug).maybeSingle();
  return { title: data ? `${data.name} | ED'S ESSENTIALS` : 'Product', description: data?.description };
}

export default async function ProductPage({ params }) {
  const { data: product } = await supabase
    .from('products').select('*, product_images(url, alt, sort_order), product_variants(id, size, color, stock_quantity, reserved_quantity)')
    .eq('slug', params.slug).maybeSingle();
  if (!product) notFound();

  // Related items: same collection first, then fill up with other products
  const { data: others } = await supabase.from('products').select(PRODUCT_FIELDS).neq('id', product.id).limit(12);
  const related = (others || [])
    .sort((a, b) => (b.collection === product.collection) - (a.collection === product.collection))
    .slice(0, 4);

  return (
    <>
      <ProductView product={product} />
      <SizeGuide />
      <section className="mx-auto max-w-7xl px-5 pt-20">
        <h2 className="font-display text-3xl">You may also like</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {related.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}
