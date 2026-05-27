'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { initializePaddle, InitializePaddleOptions, Paddle } from '@paddle/paddle-js';

const PaddleContext = createContext<Paddle | null>(null);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  useEffect(() => {
    if ((window as any).paddle) {
      setPaddle((window as any).paddle);
      return;
    }

    // 🚨 SOLUCIÓN AL ERROR DE CORS: Forzamos la propiedad estricta en la inicialización global
    const options: InitializePaddleOptions = {
      environment: "sandbox", 
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
        console.error("Error inicializando Paddle en Sandbox:", err);
      });
  }, []);

  return (
    <PaddleContext.Provider value={paddle}>
      {children}
    </PaddleContext.Provider>
  );
}

export const usePaddleInstance = () => useContext(PaddleContext);