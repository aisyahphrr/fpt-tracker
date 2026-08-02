import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Permintaan from '@/lib/models/Permintaan';

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

// POST new permintaan
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tanggal, buyer, negara, tujuan, items, catatan } = body;

    if (!buyer || !items || items.length === 0) {
      return NextResponse.json({ message: 'Buyer dan minimal 1 barang wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    // Generate Nomor Request secara berurutan
    const today = new Date();
    const year = today.getFullYear();
    const count = await Permintaan.countDocuments();
    const noRequest = `REQ-${year}-${(count + 1).toString().padStart(3, '0')}`;

    // Hitung total item & qty
    const jumlahItem = items.length;
    const totalQty = items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);

    const newPermintaan = await Permintaan.create({
      noRequest,
      tanggal: tanggal || today.toISOString().split('T')[0],
      buyer,
      negara: negara || '',
      tujuan: tujuan || '',
      jumlahItem,
      totalQty,
      items,
      catatan: catatan || '',
      status: 'pending' // Default status
    });

    return NextResponse.json({ message: 'Permintaan berhasil dibuat', data: newPermintaan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat permintaan' }, { status: 500 });
  }
}
