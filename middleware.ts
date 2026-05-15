import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    
    // Forma robusta de obtener la IP en Vercel Edge para evitar el Type Error
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Demasiadas peticiones. El obrero debe ser paciente.',
          message: 'Has excedido el límite de 5 consultas por minuto.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};