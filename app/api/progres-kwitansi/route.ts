import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ProgresKwitansi from '@/lib/models/ProgresKwitansi';
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

// GET all Progres Kwitansi
export async function GET() {
  try {
    await connectToDatabase();
    const list = await ProgresKwitansi.find({}).sort({ createdAt: -1 });
    return NextResponse.json(list, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching progres kwitansi:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data progres kwitansi' }, { status: 500 });
  }
}

// POST new Progres Kwitansi (Admin Only)
export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menambah data.' },
        { status: 403 }
      );
    }

    const { noQuo, buyer, status, keterangan } = await req.json();

    if (!noQuo || !buyer) {
      return NextResponse.json({ message: 'No. Quo dan Buyer wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    const newItem = await ProgresKwitansi.create({
      noQuo,
      buyer,
      status: status || 'Waiting',
      keterangan: keterangan || '',
    });

    return NextResponse.json({ message: 'Progres kwitansi berhasil ditambahkan', data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating progres kwitansi:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menyimpan progres kwitansi' }, { status: 500 });
  }
}
