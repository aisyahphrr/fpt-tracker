import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BahanBaku from '@/lib/models/BahanBaku';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';

async function isAdminUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return false;
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload?.email === 'nailah@gmail.com' || payload?.role === 'admin';
  } catch (e) {
    return false;
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk mengubah data bahan baku.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const updated = await BahanBaku.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ message: 'Data bahan baku tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bahan baku berhasil diperbarui', data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating bahan baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui bahan baku' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menghapus data bahan baku.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    const deleted = await BahanBaku.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Data bahan baku tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bahan baku berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting bahan baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus bahan baku' }, { status: 500 });
  }
}
