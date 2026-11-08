'use client';

import { useEffect, useRef } from 'react';

export default function TelegramLoginWidget({ onVerified, onError, autoLogin = false }) {
  const containerRef = useRef(null);
  const verifiedRef = useRef(onVerified);
  const errorRef = useRef(onError);

  useEffect(() => {
    verifiedRef.current = onVerified;
    errorRef.current = onError;
  }, [onVerified, onError]);

  useEffect(() => {
    let cancelled = false;
    let script = null;
    let callbackName = null;

    async function initializeTelegram() {
      try {
        const response = await fetch('/api/telegram-login-config', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Configurazione Telegram non disponibile.');
        }

        const result = await response.json();
        const botUsername = result.botUsername;

        if (cancelled || !containerRef.current) return;

        if (!/^[A-Za-z0-9_]{5,32}$/.test(botUsername || '')) {
          throw new Error('Nome del bot Telegram non valido.');
        }

        callbackName = `weedliveroTelegramAuth_${crypto.randomUUID().replaceAll('-', '')}`;

        window[callbackName] = async (user) => {
          try {
            const endpoint = autoLogin
              ? '/api/customer/telegram/auth'
              : '/api/customer/telegram/verify';

            const verificationResponse = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user),
              cache: 'no-store',
            });

            const verificationResult = await verificationResponse.json();

            if (!verificationResponse.ok || !verificationResult.verificationToken) {
              throw new Error(
                verificationResult.error || 'Verifica Telegram non riuscita.'
              );
            }

            if (autoLogin) {
              const loginResponse = await fetch('/api/customer/telegram/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  verificationToken: verificationResult.verificationToken,
                }),
                cache: 'no-store',
              });

              const loginResult = await loginResponse.json();

              if (!loginResponse.ok || !loginResult.success) {
                throw new Error(
                  loginResult.error || 'Accesso Telegram non riuscito.'
                );
              }

              window.location.assign('/');
              return;
            }

            if (!cancelled) {
              verifiedRef.current?.(verificationResult);
            }
          } catch (error) {
            if (!cancelled) {
              errorRef.current?.(
                error.message || 'Errore Telegram Login.'
              );
            }
          }
        };

        script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.setAttribute('data-telegram-login', botUsername);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '10');
        script.setAttribute('data-onauth', `${callbackName}(user)`);

        if (!cancelled && containerRef.current) {
          containerRef.current.appendChild(script);
        }
      } catch (error) {
        if (!cancelled) {
          errorRef.current?.(
            error.message || 'Impossibile inizializzare Telegram Login.'
          );
        }
      }
    }

    initializeTelegram();

    return () => {
      cancelled = true;
      if (callbackName) delete window[callbackName];
      if (script) script.remove();
    };
  }, [autoLogin]);

  return (
    <div
      className="flex min-h-12 justify-center py-2"
      ref={containerRef}
    />
  );
}
