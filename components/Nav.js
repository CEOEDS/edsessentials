import Link from 'next/link';
import CartLink from './CartLink';

const links = [
  ['Shop All', '/shop'], ['New Arrivals', '/shop?view=new'], ['Best Sellers', '/shop?view=best'],
  ['Men', '/shop?collection=men'], ['Women', '/shop?collection=women'],
  ['Unisex', '/shop?collection=unisex'], ['Accessories', '/shop?collection=accessories'],
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-xl tracking-wide">ED&apos;S ESSENTIALS</Link>
        <div className="flex items-center gap-4">
          <form action="/shop" className="hidden md:block">
            <input name="q" placeholder="Search" aria-label="Search products"
              className="w-48 border-b border-black/30 bg-transparent py-1 text-sm outline-none focus:border-black" />
          </form>
          <Link href="/wishlist" className="text-sm hover:underline underline-offset-4">Wishlist</Link>
          <Link href="/account" className="text-sm hover:underline underline-offset-4">Account</Link>
          <CartLink />
        </div>
      </div>
      <nav aria-label="Shop categories" className="mx-auto max-w-7xl overflow-x-auto px-5 pb-3">
        <ul className="flex gap-6 whitespace-nowrap text-sm">
          {links.map(([label, href]) => (
            <li key={label}><Link href={href} className="hover:underline underline-offset-4">{label}</Link></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
