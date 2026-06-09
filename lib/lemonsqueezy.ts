import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

// Inicializamos el SDK usando la API Key de tu archivo .env
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
  onError: (error) => {
    console.error('Error en Lemon Squeezy SDK:', error);
  },
});

export { lemonSqueezySetup };