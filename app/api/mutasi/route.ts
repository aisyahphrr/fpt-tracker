import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Mutasi from '@/lib/models/Mutasi';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // Kita bisa menambahkan parameter pencarian berdasarkan bulan dan tahun di masa depan jika diperlukan
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    
    let query = {};
    if (bulan && tahun) {
      const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1);
      const endDate = new Date(parseInt(tahun), parseInt(bulan), 0, 23, 59, 59);
      query = {
        tanggal: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    const mutasiData = await Mutasi.find(query).sort({ tanggal: -1 }).populate('barangId', 'nama kode');
    return NextResponse.json(mutasiData, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching mutasi:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
