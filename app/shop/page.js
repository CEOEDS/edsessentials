import ProductCard from '../../components/ProductCard';
import { supabase, PRODUCT_FIELDS } from '../../lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: "Shop | ED'S ESSENTIALS" };

const TITLES = { men: "Men's Collection", women: "Women's Collection", unisex: 'Unisex Collection', accessories: 'Accessories' };

export default async function Shop({ searchParams }) {
  const { collection, view, q, sort, available } = searchParams;
  let query = supabase.from('products').select(PRODUCT_FIELDS);
  if (TITLES[collection]) query = query.eq('collection', collection);
  if (view === 'new') query = query.eq('is_new_arrival', true);
  if (view === 'best') query = query.eq('is_best_seller', true);
  if (q) query = query.ilike('name', `%${q.replace(/[%,]/g, '')}%`);
  query = sort === 'price_asc' ? query.order('price_ngn') : sort === 'price_desc' ? query.order('price_ngn', { ascending: false }) : query.order('created_at', { ascending: false });

  const { data } = await query;
  let products = data || [];
  if (available === '1') products = products.filter(p => p.product_variants.some(v => v.stock_quantity - v.reserved_quantity > 0));

  const title = TITLES[collection] || (view === 'new' ? 'New Arrivals' : view === 'best' ? 'Best Sellers' : q ? `Results for "${q}"` : 'Shop All');

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12">
      <h1 className="font-display text-4xl">{title}</h1>
      <form className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        {collection && <input type="hidden" name="collection" value={collection} />}
        {view && <input type="hidden" name="view" value={view} />}
        <input name="q" defaultValue={q} placeholder="Search" aria-label="Search" className="border-b border-black/30 py-1 outline-none" />
        <select name="sort" defaultValue={sort || ''} aria-label="Sort" className="border border-black/20 bg-white px-2 py-1">
          <option value="">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" name="available" value="1" defaultChecked={available === '1'} /> In stock only</label>
        <button className="bg-black px-4 py-1.5 text-white">Apply</button>
      </form>

      {products.length === 0 ? (
        <p className="py-24 text-stone">No products match. Try clearing a filter.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
