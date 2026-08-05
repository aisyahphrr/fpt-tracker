import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import StrukturBiaya from '@/lib/models/StrukturBiaya';
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
    const email = ((payload?.email as string) || '').toLowerCase();
    const name = ((payload?.name as string) || '').toLowerCase();
    return email.includes('nailah') || name.includes('nailah') || payload?.role === 'admin';
  } catch (e) {
    return false;
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk mengubah data struktur biaya.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const updated = await StrukturBiaya.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ message: 'Data struktur biaya tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Struktur biaya berhasil diperbarui', data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating struktur biaya:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui struktur biaya' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menghapus data struktur biaya.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    const deleted = await StrukturBiaya.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Data struktur biaya tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Struktur biaya berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting struktur biaya:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus struktur biaya' }, { status: 500 });
  }
}
