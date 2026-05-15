'use client';

import { load, trackPageview } from 'fathom-client';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TrackPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // REEMPLAZA 'YOUR_SITE_ID' con el ID que te da el dashboard de Fathom
    load('YOUR_SITE_ID', {
      includedDomains: ['tusitio.com'], // Opcional: solo rastrear en tu dominio real
    });
  }, []);

  useEffect(() => {
    trackPageview();
  }, [pathname, searchParams]);

  return null;
}

export default function Fathom() {
  return (
    <Suspense fallback={null}>
      <TrackPageViews />
    </Suspense>
  );
}