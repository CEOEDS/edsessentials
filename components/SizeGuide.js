const ROWS = [
  ['S', '96', '68'],
  ['M', '102', '70'],
  ['L', '108', '72'],
  ['XL', '114', '74'],
];

export default function SizeGuide() {
  return (
    <details className="mx-auto mt-12 max-w-7xl px-5">
      <summary className="cursor-pointer text-sm underline underline-offset-4">Size guide</summary>
      <p className="mt-3 text-xs text-stone">[Placeholder measurements] Replace these with your real garment measurements, in cm.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full max-w-md text-left text-sm">
          <thead>
            <tr className="border-b border-black/20"><th className="py-2 pr-6">Size</th><th className="py-2 pr-6">Chest</th><th className="py-2">Length</th></tr>
          </thead>
          <tbody>
            {ROWS.map(([size, chest, length]) => (
              <tr key={size} className="border-b border-black/10"><td className="py-2 pr-6">{size}</td><td className="py-2 pr-6">{chest}</td><td className="py-2">{length}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
