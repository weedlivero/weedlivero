import './globals.css';
import TelegramButton from '@/components/TelegramButton';

export const metadata = {
  title: 'Weedlivero',
  description: 'Catalogo privato Weedlivero',
  applicationName: 'Weedlivero',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Weedlivero',
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#059669',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body
        className="
          min-h-screen
          overflow-x-hidden
          bg-gradient-to-br
          from-white
          via-emerald-50
          to-green-100
          text-gray-900
          antialiased
        "
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-green-300/15 blur-3xl" />

          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-200/20 blur-3xl" />
        </div>

        {children}

        <TelegramButton />
      </body>
    </html>
  );
}