import './globals.css';

export const metadata = {
  title: 'Weedlivero',
  description: 'Catalogo privato Weedlivero',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}