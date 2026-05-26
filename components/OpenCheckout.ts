/**
 * 💳 Disparador Universal del Checkout de Paddle v2
 * Abre el modal de pago integrado de forma pixel-perfect sobre Patmos
 */
export function openPatmosCheckout(userEmail?: string | null) {
  if (typeof window !== 'undefined' && (window as any).paddle) {
    
    // 🚀 Definido correctamente con tu ID de Sandbox real
    const PATMOS_PRICE_ID = "pri_01ksjj24ksyxjm70nsqqapaht6"; 

    (window as any).paddle.Checkout.open({
      items: [
        {
          priceId: PATMOS_PRICE_ID, // 🚀 Lee directamente la variable limpia de arriba
          quantity: 1
        }
      ],
      customer: userEmail ? {
        email: userEmail
      } : undefined,
      settings: {
        displayMode: "overlay", // Abre un modal flotante elegante y moderno
        theme: "light",         // Mantiene el look limpio corporativo
        locale: "en"            // Mantiene el lenguaje internacional de cobro
      }
    });
  } else {
    console.error("Paddle v2 instance is not initialized yet.");
  }
}