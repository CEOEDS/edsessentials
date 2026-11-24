export default function Footer() {
  return (
    <footer className="mt-24 bg-black text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">ED&apos;S ESSENTIALS</p>
          <p className="mt-3 max-w-xs text-sm text-ash">Embrace Your Style, Frame Your Moments.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Contact</p>
          <ul className="space-y-2 text-ash">
            <li><a href="mailto:edsessentials0@gmail.com">edsessentials0@gmail.com</a></li>
            <li><a href="https://wa.me/2348143717684">WhatsApp: +234 814 371 7684</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Follow</p>
          <ul className="space-y-2 text-ash">
            <li><a href="https://instagram.com/deonly_eds.essentials">Instagram @deonly_eds.essentials</a></li>
            <li><a href="https://tiktok.com/@deonly.edsessentials">TikTok @deonly.edsessentials</a></li>
            <li><a href="https://x.com/edsessentials1">X @edsessentials1</a></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-ash">
        © {new Date().getFullYear()} ED&apos;S ESSENTIALS
      </p>
    </footer>
  );
}
