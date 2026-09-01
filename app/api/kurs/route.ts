import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Kurs from '@/lib/models/Kurs';

const DEFAULT_KURS = {
  USD: 16200,
  JPY: 109.85,
  selectedCurrency: 'IDR',
  lastUpdated: 'Aktif per 30 Mei 2026, 14:30',
  updatedBy: 'Aisyah (Direksi)',
};

// GET current active Kurs
export async function GET() {
  try {
    await connectToDatabase();
    let kurs = await Kurs.findOne({});
    if (!kurs) {
      kurs = await Kurs.create(DEFAULT_KURS);
    }
    return NextResponse.json(kurs, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/kurs:', error);
    return NextResponse.json(DEFAULT_KURS, { status: 200 });
  }
}

// POST/PUT update active Kurs
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { USD, JPY, selectedCurrency, user } = body;

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formattedDate = `Aktif per ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let kurs = await Kurs.findOne({});
    if (!kurs) {
      kurs = await Kurs.create({
        USD: Number(USD) || 16200,
        JPY: Number(JPY) || 109.85,
        selectedCurrency: selectedCurrency || 'IDR',
        lastUpdated: formattedDate,
        updatedBy: user || 'Aisyah (Direksi)',
      });
    } else {
      kurs.USD = Number(USD) !== undefined && Number(USD) > 0 ? Number(USD) : kurs.USD;
      kurs.JPY = Number(JPY) !== undefined && Number(JPY) > 0 ? Number(JPY) : kurs.JPY;
      if (selectedCurrency) kurs.selectedCurrency = selectedCurrency;
      kurs.lastUpdated = formattedDate;
      kurs.updatedBy = user || 'Aisyah (Direksi)';
      await kurs.save();
    }

    return NextResponse.json({ message: 'Kurs berhasil diperbarui', data: kurs }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating kurs:', error);
    return NextResponse.json({ message: 'Gagal memperbarui kurs' }, { status: 500 });
  }
}
