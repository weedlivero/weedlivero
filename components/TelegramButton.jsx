import { MessageCircle } from 'lucide-react';

export default function TelegramButton() {
  const telegram =
    process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || 'weedlivero';

  const signal =
    process.env.NEXT_PUBLIC_SIGNAL_URL || '';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">

      {signal && (
        <a
          href={signal}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-xl transition hover:scale-105"
          aria-label="Contattami su Signal"
        >
          <MessageCircle size={20} />
          Signal
        </a>
      )}

      <a
        href={`https://t.me/${telegram.replace('@', '')}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-4 text-sm font-bold text-white shadow-xl transition hover:scale-105"
        aria-label="Contattami su Telegram"
      >
        <MessageCircle size={20} />
        Telegram
      </a>

    </div>
  );
}