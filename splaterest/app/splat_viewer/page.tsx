'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isAFrameLoaded, setIsAFrameLoaded] = useState(false);

  useEffect(() => {
    // Only load A-Frame if it hasn't been loaded yet
    if (typeof window !== 'undefined' && !window.AFRAME) {
      require('aframe');
      require('aframe-gaussian-splatting-component');

      // Configure A-Frame to preserve drawing buffer for screenshots
      (window as any).AFRAME.registerComponent('preserve-drawing-buffer', {
        init: function () {
          const sceneEl = this.el;
          sceneEl.addEventListener('renderstart', () => {
            const renderer = sceneEl.renderer;
            if (renderer && renderer.getContext) {
              const gl = renderer.getContext();
              if (gl) {
                // Enable preserveDrawingBuffer
                renderer.preserveDrawingBuffer = true;
              }
            }
          }, { once: true });
        }
      });

      // Give A-Frame time to fully initialize
      setTimeout(() => setIsAFrameLoaded(true), 100);
    } else if (window.AFRAME) {
      setIsAFrameLoaded(true);
    }
  }, []);

  const takeScreenshot = () => {
    const sceneEl = document.querySelector('a-scene') as any;
    if (!sceneEl) {
      console.error('A-Frame scene not found');
      return;
    }

    // Wait for next frame to ensure scene is fully rendered
    requestAnimationFrame(() => {
      const renderer = sceneEl.renderer;
      if (!renderer) {
        console.error('Renderer not found');
        return;
      }

      // Get the canvas and convert to data URL
      const canvas = renderer.domElement;

      try {
        const dataURL = canvas.toDataURL('image/png');

        // Download the image
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `splat-screenshot-${timestamp}.png`;
        link.href = dataURL;
        link.click();

        console.log(`Screenshot saved: splat-screenshot-${timestamp}.png`);
      } catch (err) {
        console.error('Error capturing screenshot:', err);
      }
    });
  };

  useEffect(() => {
    if (!isAFrameLoaded) return;

    // Start taking screenshots every 5 seconds
    const intervalId = setInterval(() => {
      takeScreenshot();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [isAFrameLoaded]);

  if (!isAFrameLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <main style={{ width: '100vw', height: '100vh' }}>
        <a-scene embedded screenshot="width: 1920; height: 1080" preserve-drawing-buffer>
          <a-entity gaussian_splatting="src: https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat;" rotation="0 0 0" position="0 1.5 -2"></a-entity>

          <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
          <a-box position="0 0.5 -3" rotation="0 45 0" color="#FFC65D"></a-box>
          <a-box position="1 0.5 -3" rotation="0 45 0" color="#7BC8A4"></a-box>

          <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>

          <a-light type="ambient" color="#ffffff" intensity="0.5"></a-light>
          <a-light type="directional" position="0 1 0" intensity="1"></a-light>

          <a-sky color="#ECECEC"></a-sky>
        </a-scene>
      </main>
    </div>
  );
}
