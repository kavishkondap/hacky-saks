'use client';

import { useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import SplatViewer from './SplatViewer';

type Tile = {
  id: string;
  title: string;
  thumb: string;      // thumbnail image in /public/thumbs
  splatSrc: string;   // .splat URL (local /splats or remote)
};

/** Hardcoded examples — replace paths with your actual files. */
const TILES: Tile[] = [
  {
    id: 'train',
    title: 'Train',
    thumb: '/thumbs/train.jpg',
    splatSrc: 'https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat',
  },
  {
    id: 'chair',
    title: 'Chair',
    thumb: '/thumbs/chair.jpg',
    splatSrc: '/splats/chair.splat',
  },
  {
    id: 'shoe',
    title: 'Shoe',
    thumb: '/thumbs/shoe.jpg',
    splatSrc: '/splats/shoe.splat',
  },
  // add more…
];

export default function TileColumns() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Tile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Evenly split tiles across 3 columns and duplicate for seamless loop
  const [colA, colB, colC] = useMemo(() => {
    const A: Tile[] = [], B: Tile[] = [], C: Tile[] = [];
    TILES.forEach((t, i) => (i % 3 === 0 ? A : i % 3 === 1 ? B : C).push(t));
    return [A.concat(A), B.concat(B), C.concat(C)];
  }, []);

  // Faster scroll speeds than before
  const speeds = { a: 10, b: 12, c: 9 }; // seconds per loop

  const onTileClick = (t: Tile) => { setActive(t); setOpen(true); };

  async function handleUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      alert(`Uploaded to ${data.path}`);
      // Optionally, you could push to the tiles list and refresh UI.
      // For simplicity, we just alert. Refresh page if you want to see it appear.
    } catch (err: any) {
      alert(err?.message ?? 'Upload error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <div className="tiles-wrap">
        <Column items={colA} speedSec={speeds.a} onClick={onTileClick} />
        <Column items={colB} speedSec={speeds.b} onClick={onTileClick} reverse />
        <Column items={colC} speedSec={speeds.c} onClick={onTileClick} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        {active && (
          <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: '1fr auto' }}>
            <SplatViewer src={active.splatSrc} pixelRatio={0.9} xrPixelRatio={0.5} />
            <div className="modal-footer">
              {/* Download note: some browsers ignore `download` for cross-origin URLs. */}
              <a className="btn" href={active.splatSrc} download>
                Download Splat
              </a>
              <label className="btn" style={{ cursor: 'pointer' }}>
                Upload New Splat
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".splat,.ply"
                  hidden
                  onChange={handleUploadChange}
                />
              </label>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Column({
  items,
  speedSec,
  reverse = false,
  onClick,
}: {
  items: Tile[];
  speedSec: number;
  reverse?: boolean;
  onClick: (t: Tile) => void;
}) {
  return (
    <div className="col-outer">
      <div
        className="col-inner"
        style={{
          animationDuration: `${speedSec}s`,
          animationDirection: reverse ? ('reverse' as const) : ('normal' as const),
        }}
      >
        {items.map((t, i) => (
          <button key={`${t.id}-${i}`} className="tile" onClick={() => onClick(t)} title={t.title}>
            <div className="tile-visual" style={{ backgroundImage: `url(${t.thumb})` }} />
            <div className="tile-label">
              <span>{t.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
