import { MessageCircle } from 'lucide-react';

export default function TelegramButton() {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || 'weedlivero';
  return (
    <a
      href={`https://t.me/${username.replace('@', '')}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand-green px-5 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-200 transition hover:scale-105"
      aria-label="Contattami su Telegram"
    >
      <MessageCircle size={20} />
      Telegram
    </a>
  );
}
