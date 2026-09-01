import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { portal } = await req.json(); // 'pusat' | 'cabang'
    const validPortal = portal === 'cabang' ? 'cabang' : 'pusat';

    const cookieStore = await cookies();
    const response = NextResponse.json({ message: `Portal berhasil diubah ke ${validPortal}`, portal: validPortal }, { status: 200 });

    response.cookies.set({
      name: 'portal_mode',
      value: validPortal,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error('Error switching portal:', error);
    return NextResponse.json({ message: 'Gagal mengubah portal' }, { status: 500 });
  }
}
