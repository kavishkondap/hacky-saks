import './globals.css';

export const metadata = {
  title: 'Gaussian Tours',
  description: 'A gallery of 3D Gaussian splats',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
        </header>
        {children}
      </body>
    </html>
  );
}
