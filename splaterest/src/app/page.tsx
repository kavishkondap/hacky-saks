import TileColumns from '@/components/TileColumns';

export default function Home() {
  return (
    <main className="page-center">
      <div className="gallery-wrap">
        <h1 className="site-title">Gaussian Tours</h1>
        <TileColumns />
      </div>
    </main>
  );
}