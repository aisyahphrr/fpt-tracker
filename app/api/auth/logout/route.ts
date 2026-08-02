import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout berhasil' }, { status: 200 });
  // Hapus cookie auth_token dengan mengatur tanggal kedaluwarsa ke masa lalu
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
