import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const path = req.nextUrl.pathname;

  // Rute yang bisa diakses tanpa login
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register'];
  const isPublicPath = publicPaths.some((p) => path.startsWith(p));

  if (!token && !isPublicPath) {
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }
    // Redirect ke login jika mencoba akses rute terproteksi tanpa token
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token) {
    try {
      // Verifikasi token
      const { payload } = await jwtVerify(token, key);
      
      // Jika sudah login dan mencoba ke halaman login/register, arahkan ke dashboard
      if (isPublicPath && !path.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Opsional: kita bisa menambahkan header agar role & user_id bisa dibaca di rute API/Server Components
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-role', payload.role as string);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-name', payload.name as string);
      requestHeaders.set('x-user-email', payload.email as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Token tidak valid atau kedaluwarsa
      console.error('Invalid token in middleware:', error);
      if (path.startsWith('/api/')) {
        return NextResponse.next();
      }
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

// Konfigurasi middleware hanya berjalan di rute tertentu (mengecualikan file static)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (like images in public dir)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
