import TileColumns from '@/components/TileColumns';

export const metadata = {
  title: 'Gallery',
  description: 'Three rolling columns of splat tiles',
};

export default function GalleryPage() {
  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ margin: '0 0 12px' }}>Gallery</h1>
      <p style={{ margin: '0 0 16px', color: '#666' }}>
        Click a tile to open the 3D Gaussian splat.
      </p>
      <TileColumns />
    </div>
  );
}