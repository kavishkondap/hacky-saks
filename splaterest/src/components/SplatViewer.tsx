'use client';

import { useEffect, useRef } from 'react';

export default function SplatViewer({
  src,
  pixelRatio = 1.0,
  xrPixelRatio = 0.5,
}: {
  src: string;
  pixelRatio?: number;
  xrPixelRatio?: number;
}) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loadedRef.current) return;

    const w = window as any;
    if (!w.AFRAME) require('aframe');
    if (!w.AFRAME?.components?.['gaussian_splatting'] && !w.AFRAME?.components?.['gaussian-splat']) {
      require('aframe-gaussian-splatting-component');
    }
    loadedRef.current = true;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <a-scene renderer="antialias: true" embedded vr-mode-ui="enabled: false" xr-mode-ui="enabled: true"
               style={{ width: '100%', height: '100%' }}>
        <a-entity position="0 1.6 0">
          <a-camera wasd-controls-enabled="false" look-controls="enabled: true" />
        </a-entity>

        {/* Component name differs across builds; set both */}
        <a-entity
          position="0 1.5 -2"
          rotation="0 0 0"
          // @ts-expect-error A-Frame dynamic attribute
          gaussian_splatting={`src: url(${src}); pixelRatio: ${pixelRatio}; xrPixelRatio: ${xrPixelRatio}`}
          // @ts-expect-error A-Frame dynamic attribute
          gaussian-splat={`src: url(${src}); pixelRatio: ${pixelRatio}; xrPixelRatio: ${xrPixelRatio}`}
        />
        <a-entity light="type: ambient; color: #BBB" />
        <a-sky color="#000" />
      </a-scene>
    </div>
  );
}
