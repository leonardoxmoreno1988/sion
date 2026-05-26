'use client';

import { useEffect, createContext, useContext } from 'react';
import { initializePaddle, InitializePaddleOptions, Paddle } from '@paddle/paddle-js';

const PaddleContext = createContext<Paddle | null>(null);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const options: InitializePaddleOptions = {
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
    };

    initializePaddle(options).then((paddleInstance) => {
      if (paddleInstance) {
        // Guardamos la instancia globalmente en el objeto window si es necesario
        (window as any).paddle = paddleInstance;
      }
    });
  }, []);

  return <PaddleContext.Provider value={null}>{children}</PaddleContext.Provider>;
}

export const usePaddleInstance = () => useContext(PaddleContext);