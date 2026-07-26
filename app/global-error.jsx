'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Errore globale Weedlivero:', error);
  }, [error]);

  const errorMessage =
    error?.message || 'Errore sconosciuto durante il caricamento';

  const errorDigest = error?.digest || 'non disponibile';

  return (
    <html lang="it">
      <body>
        <main
          style={{
            minHeight: '100vh',
            padding: '24px',
            background: '#f3f4f6',
            color: '#111827',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '720px',
              margin: '40px auto',
              padding: '24px',
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
              }}
            >
              Errore Weedlivero
            </h1>

            <p
              style={{
                marginTop: '12px',
                lineHeight: 1.6,
                color: '#4b5563',
              }}
            >
              Il browser ha rilevato un problema durante il caricamento
              dell’applicazione.
            </p>

            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#991b1b',
                overflowWrap: 'anywhere',
              }}
            >
              <strong>Messaggio:</strong>

              <pre
                style={{
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}
              >
                {errorMessage}
              </pre>
            </div>

            <p
              style={{
                marginTop: '16px',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Digest: {errorDigest}
            </p>

            <button
              type="button"
              onClick={reset}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                border: 0,
                borderRadius: '12px',
                background: '#16a34a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              Riprova
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}