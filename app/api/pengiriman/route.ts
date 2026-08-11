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

// GET all Pengiriman
export async function GET() {
  try {
    await connectToDatabase();
    const list = await Pengiriman.find({}).sort({ createdAt: -1 });
    return NextResponse.json(list, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching pengiriman:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data pengiriman' }, { status: 500 });
  }
}

// POST new Pengiriman (Admin Only)
export async function POST(req: Request) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales yang memiliki izin untuk menambah data.' },
        { status: 403 }
      );
    }

    const { buyer, noPo, dokumen, status, keterangan } = await req.json();

    if (!buyer || !noPo) {
      return NextResponse.json({ message: 'Buyer dan No. PO wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    const newItem = await Pengiriman.create({
      buyer,
      noPo,
      dokumen: dokumen || {
        invoice: '',
        awb: '',
        suratJalan: '',
        tellySheet: '',
        fotoProduct: '',
        tandaTerima: '',
      },
      status: status || 'Pemuatan Ikan',
      keterangan: keterangan || '',
    });

    return NextResponse.json({ message: 'Pengiriman berhasil ditambahkan', data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pengiriman:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menyimpan data pengiriman' }, { status: 500 });
  }
}
