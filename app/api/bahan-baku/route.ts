import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BahanBaku from '@/lib/models/BahanBaku';
import Permintaan from '@/lib/models/Permintaan';
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

export async function GET() {
  try {
    await connectToDatabase();

    // Auto-sync data dari Permintaan Buyer ke Bahan Baku jika belum ada
    const allPermintaan = await Permintaan.find({});
    for (const reqItem of allPermintaan) {
      if (reqItem.items && reqItem.items.length > 0) {
        for (const item of reqItem.items) {
          const exists = await BahanBaku.findOne({ noRequest: reqItem.noRequest, barang: item.name });
          if (!exists) {
            await BahanBaku.create({
              noRequest: reqItem.noRequest,
              barang: item.name,
              qty: item.qty || 1,
              sumber: item.spesifikasi || item.size ? [{ namaSumber: 'Utama', harga: 0, size: item.size || '', spesifikasi: item.spesifikasi || '' }] : [],
              filePerhitungan: '',
              linkFotoGdrive: '',
              linkVideoGdrive: '',
            });
          }
        }
      }
    }

    const list = await BahanBaku.find({}).sort({ createdAt: -1 });
    return NextResponse.json(list, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching bahan baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data bahan baku' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menambah data bahan baku.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { noRequest, barang, qty, sumber, filePerhitungan, linkFotoGdrive, linkVideoGdrive } = body;

    if (!noRequest || !barang) {
      return NextResponse.json({ message: 'No Request dan nama Barang wajib diisi' }, { status: 400 });
    }

    const newBahanBaku = await BahanBaku.create({
      noRequest,
      barang,
      qty: qty || 1,
      sumber: sumber || [],
      filePerhitungan: filePerhitungan || '',
      linkFotoGdrive: linkFotoGdrive || '',
      linkVideoGdrive: linkVideoGdrive || '',
    });

    return NextResponse.json({ message: 'Bahan Baku berhasil dibuat', data: newBahanBaku }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bahan baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat bahan baku' }, { status: 500 });
  }
}
