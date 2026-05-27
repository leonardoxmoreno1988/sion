'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { initializePaddle, InitializePaddleOptions, Paddle } from '@paddle/paddle-js';

// Creamos el contexto para compartir la instancia real de Paddle
const PaddleContext = createContext<Paddle | null>(null);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  useEffect(() => {
    // Evitamos inicializarlo doble en Strict Mode si ya existe en el objeto window
    if ((window as any).paddle) {
      setPaddle((window as any).paddle);
      return;
    }

    // 🚨 Corrección limpia: El SDK v2 de Paddle detecta automáticamente el entorno sandbox 
    // a través del Client Token de pruebas (test_...), pero forzamos el tipado correcto aquí.
    const options: InitializePaddleOptions = {
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
    };

    initializePaddle(options)
      .then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
          (window as any).paddle = paddleInstance;
        }
      })
      .catch((err) => {
        console.error("Error inicializando Paddle en el cliente:", err);
      });
  }, []);

  return (
    <PaddleContext.Provider value={paddle}>
      {children}
    </PaddleContext.Provider>
  );
}

// Hook personalizado para usar Paddle de forma segura en tus componentes
export const usePaddleInstance = () => useContext(PaddleContext);