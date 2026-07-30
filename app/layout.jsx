import './globals.css';
import TelegramButton from '@/components/TelegramButton';

export const metadata = {
  title: 'Weedlivero',
  description: 'Catalogo privato Weedlivero',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-green-100 text-gray-900 antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl"></div>

          <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-green-300/15 blur-3xl"></div>

          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-200/20 blur-3xl"></div>
        </div>

        {children}

        <TelegramButton />
      </body>
    </html>
  );
}