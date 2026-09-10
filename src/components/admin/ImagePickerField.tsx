'use client';

import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FileImage, FileVideo, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { getPlayerImages, uploadPlayerImage } from '@/lib/api';
import type { PlayerMedia } from '@/lib/api';

const MAX_SIZE = 25 * 1024 * 1024;
const MIME: Record<string, string[]> = {
  png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'], webp: ['image/webp'],
  gif: ['image/gif'], mp4: ['video/mp4'], webm: ['video/webm'],
};
const EXTENSIONS = Object.keys(MIME);

type StagedFile = { id: string; file: File; preview: string; error: string | null; invalid: boolean; uploaded?: string };

interface Props { value: string; onChange: (src: string) => void; playerName?: string; }

const isVideo = (src: string) => /\.(mp4|webm)(?:[?#].*)?$/i.test(src);
const sizeText = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;

function validate(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!MIME[ext] || !MIME[ext].includes(file.type)) return 'Unsupported file type or MIME type.';
  if (file.size <= 0 || file.size > MAX_SIZE) return 'File exceeds the 25 MB limit.';
  return null;
}

export default function ImagePickerField({ value, onChange, playerName }: Props) {
  const [media, setMedia] = useState<PlayerMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshMedia = () => {
    setLoading(true);
    setError(null);
    return getPlayerImages()
      .then(setMedia)
      .catch(() => setError('Unable to load existing media.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void refreshMedia();
  }, []);
  useEffect(() => () => staged.forEach((item) => URL.revokeObjectURL(item.preview)), [staged]);

  const stageFiles = (files: FileList | File[]) => {
    const next = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      error: validate(file),
      invalid: Boolean(validate(file)),
    }));
    setError(null);
    setStaged((current) => [...current, ...next]);
  };
  const remove = (id: string) => setStaged((current) => {
    const item = current.find((entry) => entry.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    return current.filter((entry) => entry.id !== id);
  });
  const valid = staged.filter((item) => !item.error && !item.invalid && !item.uploaded);
  const upload = async () => {
    if (!valid.length) return;
    setConfirmOpen(false); setUploading(true); setProgress({ done: 0, total: valid.length });
    const successful: string[] = [];
    for (const item of valid) {
      try {
        const url = await uploadPlayerImage(item.file, playerName);
        successful.push(url);
        setStaged((current) => current.map((entry) => entry.id === item.id ? { ...entry, uploaded: url } : entry));
        setMedia((current) => [...current, { name: item.file.name, url, content_type: item.file.type }]);
      } catch (e) {
        setStaged((current) => current.map((entry) => entry.id === item.id ? { ...entry, error: e instanceof Error ? e.message : 'Upload failed' } : entry));
      } finally { setProgress((current) => ({ ...current, done: current.done + 1 })); }
    }
    if (successful.length && !value) onChange(successful[0]);
    setUploading(false);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); if (!uploading) stageFiles(event.dataTransfer.files); };

  return <div className="space-y-3">
    <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl glass border-white/10">
      {value ? isVideo(value) ? <video src={value} autoPlay loop muted playsInline className="h-full w-full object-cover" /> : <img src={value} alt={playerName || 'Player media'} className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-white/25" />}
      {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><Loader2 className="h-6 w-6 animate-spin text-white/80" /></div>}
    </div>
    <button type="button" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/65 transition hover:text-white"><Upload className="h-3.5 w-3.5" /> Upload media <ChevronDown className={`h-3.5 w-3.5 transition-transform ${panelOpen ? 'rotate-180' : ''}`} /></button>
    <AnimatePresence>{panelOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <input ref={inputRef} type="file" multiple accept={EXTENSIONS.map((ext) => `.${ext}`).join(',')} className="hidden" onChange={(event) => { if (event.target.files) stageFiles(event.target.files); event.target.value = ''; }} />
      <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} className={`rounded-lg border border-dashed p-5 text-center transition-all ${dragging ? 'border-white/50 bg-white/10 shadow-[0_0_24px_rgba(255,255,255,0.1)]' : 'border-white/15 bg-black/20 hover:border-white/30'}`}>
        <Upload className="mx-auto mb-2 h-6 w-6 text-white/45" /><p className="text-xs font-semibold text-white/75">{dragging ? 'Drop images or videos here' : 'Drop images or videos here'}</p><p className="mt-1 text-[11px] text-white/35">PNG, JPG, JPEG, WEBP, GIF, MP4, WEBM · 25 MB per file</p><button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/75 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10">Select files</button>
      </div>
      {staged.length > 0 && <div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Staged files</p>{staged.map((item) => <div key={item.id} className={`flex items-center gap-2 rounded-lg border p-2 ${item.error ? 'border-red-400/30 bg-red-400/[0.04]' : 'border-white/10 bg-black/20'}`}><div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white/5">{item.file.type.startsWith('video/') ? <video src={item.preview} muted playsInline className="h-full w-full object-cover" /> : <img src={item.preview} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs text-white/80">{item.file.name}</p><p className="text-[10px] uppercase text-white/35">{item.file.type.split('/')[1]} · {sizeText(item.file.size)}</p><p className={`text-[10px] ${item.error ? 'text-red-400' : item.uploaded ? 'text-emerald-300' : 'text-white/45'}`}>{item.error || (item.uploaded ? 'Uploaded' : 'Ready — not uploaded')}</p></div>{item.file.type.startsWith('video/') ? <FileVideo className="h-4 w-4 text-white/35" /> : <FileImage className="h-4 w-4 text-white/35" />}<button type="button" onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`} className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
      {staged.length > 0 && <div className="flex items-center justify-between gap-2"><div className="flex gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase text-white/60 hover:bg-white/10">Add more</button>{staged.some((item) => item.error) && <button type="button" onClick={() => setStaged((current) => current.map((item) => item.uploaded ? item : { ...item, error: null }))} className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase text-white/60 hover:bg-white/10">Retry failed</button>}</div><button type="button" disabled={!valid.length || uploading} onClick={() => setConfirmOpen(true)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold uppercase text-black disabled:opacity-40">Upload {valid.length}</button></div>}
      <div>
         <button type="button" onClick={() => { const next = !selectorOpen; setSelectorOpen(next); if (next) void refreshMedia(); }} aria-expanded={selectorOpen} aria-controls="existing-media-library" disabled={uploading} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase text-white/60 transition hover:bg-white/10">{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className={`h-3.5 w-3.5 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />} Select existing media</button>
         <AnimatePresence initial={false}>
           {selectorOpen && <motion.div id="existing-media-library" initial={{ opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -6 }} className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] p-2 shadow-2xl">
             <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search media..." className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/30" />
             <div className="max-h-72 overflow-y-auto pr-1">
               {loading ? <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-square animate-pulse rounded-lg bg-white/[0.06]" />)}</div> : media.filter((item) => item.name.toLowerCase().includes(mediaSearch.toLowerCase())).length === 0 ? <div className="px-2 py-5 text-center text-xs text-white/40">{media.length ? 'No matching media.' : 'No media uploaded yet.'}</div> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{media.filter((item) => item.name.toLowerCase().includes(mediaSearch.toLowerCase())).map((item) => <motion.button key={item.url} type="button" initial={{ opacity: 0, y: 8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: .98 }} onClick={() => { onChange(item.url); setSelectorOpen(false); }} className={`group overflow-hidden rounded-lg border text-left ${value === item.url ? 'border-white/60 ring-1 ring-white/25' : 'border-white/10 hover:border-white/35'}`}><span className="relative block aspect-square overflow-hidden bg-black/30">{isVideo(item.name) ? <><video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" /><FileVideo className="absolute bottom-1 right-1 h-3.5 w-3.5 text-white/80" /></> : <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />}</span><span className="block truncate p-1 text-[10px] text-white/60">{item.name}</span></motion.button>)}</div>}
             </div>
           </motion.div>}
         </AnimatePresence>
       </div>
      {uploading && <p className="text-xs text-white/55">Uploading media... {progress.done} / {progress.total}</p>}{error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div></motion.div>}</AnimatePresence>
    <AnimatePresence>{confirmOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upload-confirm-title"><motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="glass w-full max-w-sm rounded-2xl border border-white/10 p-6"><h3 id="upload-confirm-title" className="font-bebas text-3xl text-white/90">Upload {valid.length} media files?</h3><div className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-white/55">{valid.map((item) => <p key={item.id} className="truncate">• {item.file.name} — {sizeText(item.file.size)}</p>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-white/10 px-4 py-2 text-xs uppercase text-white/60 hover:bg-white/10">Cancel</button><button type="button" onClick={() => void upload()} className="rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase text-black">Confirm upload</button></div></motion.div></motion.div>}</AnimatePresence>
    {!panelOpen && error && <p role="alert" className="text-xs text-red-400">{error}</p>}
  </div>;
}
