'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { initializePaddle, InitializePaddleOptions, Paddle } from '@paddle/paddle-js';

// Creamos el contexto para compartir la instancia real de Paddle
const PaddleContext = createContext<Paddle | null>(null);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  useEffect(() => {
    // Si ya existe en el objeto window, evitamos inicializarlo doble en Strict Mode
    if ((window as any).paddle) {
      setPaddle((window as any).paddle);
      return;
    }

    const options: InitializePaddleOptions = {
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
    };

    initializePaddle(options)
      .then((paddleInstance) => {
        if (paddleInstance) {
          // 🚀 Guardamos en el estado de React para que el Context lo distribuya
          setPaddle(paddleInstance);
          (window as any).paddle = paddleInstance;
        }
      })
      .catch((err) => {
        console.error("Error inicializando Paddle en el cliente:", err);
      });
  }, []);

  return (
    // 🚀 Pasamos la instancia real por el valor del proveedor en lugar de 'null'
    <PaddleContext.Provider value={paddle}>
      {children}
    </PaddleContext.Provider>
  );
}

// Hook personalizado para usar Paddle de forma segura en tus componentes
export const usePaddleInstance = () => useContext(PaddleContext);