import NewsletterForm from './NewsletterForm';
import { supabase } from '../lib/supabase';

const DEFAULTS = {
  contact_email: 'edsessentials0@gmail.com',
  contact_whatsapp: '+234 814 371 7684',
  social_instagram: 'https://instagram.com/deonly_eds.essentials',
  social_tiktok: 'https://tiktok.com/@deonly.edsessentials',
  social_x: 'https://x.com/edsessentials1',
};

const handle = (url) => {
  const seg = String(url || '').split('?')[0].split('/').filter(Boolean).pop() || '';
  return seg.startsWith('@') ? seg : '@' + seg;
};

async function getContact() {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', Object.keys(DEFAULTS));
    const out = { ...DEFAULTS };
    (data || []).forEach((r) => {
      if (typeof r.value === 'string' && r.value.trim()) out[r.key] = r.value.trim();
    });
    return out;
  } catch {
    return DEFAULTS;
  }
}

export default async function Footer() {
  const c = await getContact();
  const waDigits = c.contact_whatsapp.replace(/\D/g, '');
  return (
    <footer className="mt-24 bg-black text-cream">
      <div className="mx-auto max-w-7xl border-b border-white/10 px-5 py-12">
        <p className="font-display text-2xl">Join the list</p>
        <p className="mb-4 mt-2 text-sm text-ash">New drops and offers, straight to your inbox.</p>
        <NewsletterForm />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">ED&apos;S ESSENTIALS</p>
          <p className="mt-3 max-w-xs text-sm text-ash">Embrace Your Style, Frame Your Moments.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Contact</p>
          <ul className="space-y-2 text-ash">
            <li><a href={`mailto:${c.contact_email}`}>{c.contact_email}</a></li>
            <li><a href={`https://wa.me/${waDigits}`}>WhatsApp: {c.contact_whatsapp}</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Follow</p>
          <ul className="space-y-2 text-ash">
            <li><a href={c.social_instagram}>Instagram {handle(c.social_instagram)}</a></li>
            <li><a href={c.social_tiktok}>TikTok {handle(c.social_tiktok)}</a></li>
            <li><a href={c.social_x}>X {handle(c.social_x)}</a></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-ash">
        © {new Date().getFullYear()} ED&apos;S ESSENTIALS
      </p>
    </footer>
  );
  }
