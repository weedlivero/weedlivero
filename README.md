# Weedlivero

Web app privata mobile-first con accesso tramite codice, categorie Weed / Hash / Concentrate, pulsante Telegram globale e pannello admin predisposto per Supabase.

## Avvio locale

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Variabili ambiente

Copia `.env.example` in `.env.local` e compila:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TELEGRAM_USERNAME=weedlivero
NEXT_PUBLIC_ACCESS_CODE=WEED2026
```

Su Vercel inserisci le stesse variabili in Settings > Environment Variables.

## Supabase

In Supabase vai in SQL Editor, incolla `supabase/schema.sql` e premi Run.

## Deploy

Carica il contenuto della cartella su GitHub. Vercel importerà il repository e farà build con `npm run build`.
