import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barang from '@/lib/models/Barang';
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

// GET all barang
export async function GET() {
  try {
    await connectToDatabase();
    const barangs = await Barang.find({}).sort({ createdAt: -1 });
    return NextResponse.json(barangs, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data barang' }, { status: 500 });
  }
}

// POST new barang (Admin only)
export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales (Nailah) yang memiliki izin untuk menambah barang.' },
        { status: 403 }
      );
    }

    const { kode, nama, cabang, kategori, satuan, deskripsi, stokAwal } = await req.json();

    if (!kode || !nama || !kategori || !satuan) {
      return NextResponse.json({ message: 'Kode, Nama, Kategori, dan Satuan wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if code already exists
    const existingBarang = await Barang.findOne({ kode });
    if (existingBarang) {
      return NextResponse.json({ message: 'Kode barang sudah digunakan' }, { status: 400 });
    }

    const newBarang = await Barang.create({
      kode,
      nama,
      cabang: cabang || 'Jakarta',
      kategori,
      satuan,
      deskripsi: deskripsi || '',
      stokAwal: Number(stokAwal) || 0,
      status: 'aktif',
    });

    return NextResponse.json({ message: 'Barang berhasil ditambahkan', data: newBarang }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menyimpan barang' }, { status: 500 });
  }
}
