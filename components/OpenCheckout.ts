/**
 * 💳 Disparador Universal del Checkout de Paddle v2
 */
export function openPatmosCheckout(userEmail?: string | null) {
  if (typeof window !== 'undefined' && (window as any).paddle) {
    const PATMOS_PRICE_ID = "pri_01ksjj24ksyxjm70nsqqapaht6"; 

    (window as any).paddle.Checkout.open({
      items: [
        {
          priceId: PATMOS_PRICE_ID,
          quantity: 1
        }
      ],
      customer: userEmail ? { email: userEmail } : undefined,
      settings: {
        displayMode: "overlay",
        theme: "light",
        locale: "en"
      }
    });
  }
}