'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { uploadMedia } from '../../../lib/media';

const SLOTS = [
  ['hero_image_url', 'Homepage hero image', 'image'],
  ['campaign_video_url', 'Homepage campaign video', 'video'],
  ['product_video_url', 'Homepage product video', 'video'],
  ['shop_video_url', 'Shop page promo video', 'video'],
];

export default function Media() {
  const [vals, setVals] = useState({});
  const [story, setStory] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await supabase.from('store_settings').select('key, value').in('key', [...SLOTS.map(s => s[0]), 'brand_story']);
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    setVals(map);
    setStory(map.brand_story || '');
  }
  useEffect(() => { load(); }, []);

  async function upload(key, e) {
    const file = e.target.files[0];
    if (!file) return;
    setMsg('Uploading, please wait...');
    try {
      const url = await uploadMedia(file, 'site');
      const { error } = await supabase.from('store_settings').upsert({ key, value: url });
      setMsg(error ? error.message : 'Saved. The website updates within a minute.');
      load();
    } catch (err) { setMsg(err.message); }
    e.target.value = '';
  }

  async function remove(key) {
    await supabase.from('store_settings').delete().eq('key', key);
    load();
  }

  async function saveStory(e) {
    e.preventDefault();
    const { error } = await supabase.from('store_settings').upsert({ key: 'brand_story', value: story });
    setMsg(error ? error.message : 'Brand story saved.');
  }

  return (
    <div className="max-w-2xl pb-16">
      <h1 className="font-display text-4xl">Media and content</h1>
      <p className="mt-2 text-sm text-stone">Pictures are shrunk automatically. Videos must be MP4 and under 50 MB.</p>
      {msg && <p role="status" className="mt-4 text-sm">{msg}</p>}

      {SLOTS.map(([key, label, type]) => (
        <section key={key} className="mt-8 border-t border-black/10 pt-6">
          <h2 className="font-display text-2xl">{label}</h2>
          {vals[key] && (type === 'image'
            ? <img src={vals[key]} alt="" className="mt-3 max-h-60" />
            : <video src={vals[key]} controls playsInline preload="metadata" className="mt-3 max-h-60 bg-black" />)}
          <div className="mt-3 flex items-center gap-4">
            <input type="file" accept={type === 'image' ? 'image/*' : 'video/mp4'} onChange={e => upload(key, e)} aria-label={label} className="text-sm" />
            {vals[key] && <button onClick={() => remove(key)} className="text-sm underline underline-offset-4">Remove</button>}
          </div>
        </section>
      ))}

      <form onSubmit={saveStory} className="mt-8 border-t border-black/10 pt-6">
        <h2 className="font-display text-2xl">Brand story</h2>
        <textarea value={story} onChange={e => setStory(e.target.value)} rows={6} aria-label="Brand story" className="mt-3 w-full border border-black/20 px-3 py-2 text-sm" />
        <button className="mt-3 bg-black px-6 py-3 text-sm text-white">Save story</button>
      </form>
    </div>
  );
    }
