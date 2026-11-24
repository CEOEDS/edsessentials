import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { supabase, PRODUCT_FIELDS } from '../lib/supabase';

export const revalidate = 60;

async function fetchRow(flag) {
  const { data } = await supabase.from('products').select(PRODUCT_FIELDS).eq(flag, true).limit(4);
  return data || [];
}

function Row({ title, items, href }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-20">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-3xl">{title}</h2>
        <Link href={href} className="text-sm underline underline-offset-4">View all</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {items.map(p => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

export default async function Home() {
  const [best, trending] = await Promise.all([fetchRow('is_best_seller'), fetchRow('is_trending')]);
  return (
    <>
      <section className="relative flex min-h-[88vh] items-end bg-sand">
        <div className="mx-auto w-full max-w-7xl px-5 pb-16">
          <p className="hero-rise text-sm tracking-wide">ED&apos;S ESSENTIALS</p>
          <h1 className="hero-rise mt-3 max-w-3xl font-display text-5xl leading-[1.05] md:text-8xl">
            STYLE THAT SPEAKS FOR ITSELF.
          </h1>
          <p className="hero-rise mt-5 max-w-md">Elevate your everyday style with Ed&apos;s Essentials.</p>
          <div className="hero-rise mt-8 flex gap-3">
            <Link href="/shop" className="bg-black px-7 py-3 text-sm text-white">Shop Now</Link>
            <a href="#gallery" className="border border-black px-7 py-3 text-sm">Explore Gallery</a>
          </div>
        </div>
      </section>

      <Row title="Best Sellers" items={best} href="/shop?view=best" />
      <Row title="Trending" items={trending} href="/shop" />

      <section id="gallery" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-20">
        <h2 className="font-display text-3xl">Lookbook</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex aspect-[3/4] items-center justify-center bg-cream text-xs text-stone">
              Placeholder photo {n}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pt-24 text-center">
        <h2 className="font-display text-3xl">Our story</h2>
        <p className="mt-4 leading-relaxed text-stone">
          [Placeholder] ED&apos;S ESSENTIALS is a contemporary label built on quality basics and individual style.
          Replace this paragraph with your own brand story.
        </p>
      </section>
    </>
  );
}
