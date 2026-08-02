import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const key = new TextEncoder().encode(JWT_SECRET);

async function getUserIdFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

export async function PUT(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Password saat ini dan password baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    await connectToDatabase();

    let userId = await getUserIdFromToken();
    let user = null;

    if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      user = await User.findOne({ role: 'admin' });
    }

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verifikasi password saat ini
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Password saat ini salah' }, { status: 400 });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Password berhasil diubah!' }, { status: 200 });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json({ message: 'Gagal mengubah password' }, { status: 500 });
  }
}
