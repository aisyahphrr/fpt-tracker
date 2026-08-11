import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Permintaan from '@/lib/models/Permintaan';
import BahanBaku from '@/lib/models/BahanBaku';
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

// GET all permintaan
export async function GET() {
  try {
    await connectToDatabase();
    const permintaan = await Permintaan.find({}).sort({ createdAt: -1 });
    return NextResponse.json(permintaan, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data permintaan' }, { status: 500 });
  }
}

// POST new permintaan (Admin Only)
export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales (Nailah) yang memiliki izin untuk membuat permintaan buyer baru.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tanggal, buyer, negara, tujuan, items, catatan, fileQuotation } = body;

    if (!buyer || !items || items.length === 0) {
      return NextResponse.json({ message: 'Buyer dan minimal 1 barang wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    // Generate Nomor Request secara berurutan
    const today = new Date();
    const year = today.getFullYear();
    const count = await Permintaan.countDocuments();
    const noRequest = `INQ-${year}-${(count + 1).toString().padStart(3, '0')}`;

    // Hitung total item & qty, dan bersihkan barangId jika kosong
    const sanitizedItems = items.map((item: any) => ({
      ...item,
      barangId: (item.barangId && item.barangId !== '') ? item.barangId : undefined
    }));

    const jumlahItem = sanitizedItems.length;
    const totalQty = sanitizedItems.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);

    const newPermintaan = await Permintaan.create({
      noRequest,
      tanggal: tanggal || today.toISOString().split('T')[0],
      buyer,
      negara: negara || '',
      tujuan: tujuan || '',
      jumlahItem,
      totalQty,
      items: sanitizedItems,
      fileQuotation: fileQuotation || '',
      catatan: catatan || '',
      status: 'pending'
    });

    // Buat data Bahan Baku otomatis per item barang dalam permintaan
    for (const item of sanitizedItems) {
      await BahanBaku.create({
        noRequest,
        barang: item.name,
        qty: item.qty || 1,
        sumber: item.spesifikasi || item.size ? [{ namaSumber: 'Utama', harga: 0, size: item.size || '', spesifikasi: item.spesifikasi || '' }] : [],
        linkFotoGdrive: '',
        linkVideoGdrive: '',
      });
    }

    // Buat data Struktur Biaya otomatis untuk Permintaan ini
    await StrukturBiaya.create({
      noRequest,
      buyer,
      logistik: '',
      filePerhitungan: '',
      catatan: '',
    });

    return NextResponse.json({ message: 'Permintaan berhasil dibuat', data: newPermintaan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat permintaan' }, { status: 500 });
  }
}

