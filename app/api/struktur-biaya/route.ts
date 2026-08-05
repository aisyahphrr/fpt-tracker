import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import StrukturBiaya from '@/lib/models/StrukturBiaya';
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

    // Auto-sync data dari Permintaan Buyer ke Struktur Biaya jika belum ada
    const allPermintaan = await Permintaan.find({});
    for (const reqItem of allPermintaan) {
      const exists = await StrukturBiaya.findOne({ noRequest: reqItem.noRequest });
      if (!exists) {
        await StrukturBiaya.create({
          noRequest: reqItem.noRequest,
          buyer: reqItem.buyer,
          logistik: '',
          filePerhitungan: '',
          catatan: '',
        });
      }
    }

    const list = await StrukturBiaya.find({}).sort({ createdAt: -1 });
    return NextResponse.json(list, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching struktur biaya:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data struktur biaya' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menambah data struktur biaya.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { noRequest, buyer, logistik, filePerhitungan, catatan } = body;

    if (!noRequest || !buyer) {
      return NextResponse.json({ message: 'No Request dan Buyer wajib diisi' }, { status: 400 });
    }

    const newBiaya = await StrukturBiaya.create({
      noRequest,
      buyer,
      logistik: logistik || '',
      filePerhitungan: filePerhitungan || '',
      catatan: catatan || '',
    });

    return NextResponse.json({ message: 'Struktur biaya berhasil dibuat', data: newBiaya }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating struktur biaya:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat struktur biaya' }, { status: 500 });
  }
}
