import './globals.css';
import TelegramButton from '@/components/TelegramButton';

export const metadata = {
  title: 'Weedlivero',
  description: 'Catalogo privato Weedlivero'
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        {children}
        <TelegramButton />
      </body>
    </html>
  );
}
