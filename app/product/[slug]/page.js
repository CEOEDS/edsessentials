import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
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
  return <ProductView product={product} />;
}
