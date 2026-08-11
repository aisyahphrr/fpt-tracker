import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Pengiriman from '@/lib/models/Pengiriman';
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

// PUT update Pengiriman (Admin Only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk mengubah data.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();
    const updatedItem = await Pengiriman.findByIdAndUpdate(id, body, { new: true });

    if (!updatedItem) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pengiriman berhasil diperbarui', data: updatedItem }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating pengiriman:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui data' }, { status: 500 });
  }
}

// DELETE Pengiriman (Admin Only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menghapus data.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();
    const deletedItem = await Pengiriman.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pengiriman berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting pengiriman:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus data' }, { status: 500 });
  }
}
