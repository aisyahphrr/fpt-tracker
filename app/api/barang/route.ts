import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barang from '@/lib/models/Barang';

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

// POST new barang
export async function POST(req: Request) {
  try {
    const { kode, nama, kategori, satuan, deskripsi } = await req.json();

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
      kategori,
      satuan,
      deskripsi: deskripsi || '',
      stok: 0, // Default 0
      status: 'aktif',
    });

    return NextResponse.json({ message: 'Barang berhasil ditambahkan', data: newBarang }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menyimpan barang' }, { status: 500 });
  }
}
