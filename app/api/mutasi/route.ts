import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Mutasi from '@/lib/models/Mutasi';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const mode = searchParams.get('mode'); // 'month' (default) or 'until'
    
    let query: any = {};
    if (bulan && tahun) {
      const yearNum = parseInt(tahun);
      const monthNum = parseInt(bulan);
      
      if (mode === 'until') {
        // Ambil seluruh mutasi HINGGA akhir bulan tersebut
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        query = {
          tanggal: { $lte: endDate }
        };
      } else {
        // Ambil mutasi KHUSUS di bulan tersebut
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        query = {
          tanggal: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }
    } else if (tahun) {
      const yearNum = parseInt(tahun);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
      query = {
        tanggal: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    const mutasiData = await Mutasi.find(query).sort({ tanggal: -1 }).populate('barangId', 'nama kode cabang');
    return NextResponse.json(mutasiData, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching mutasi:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
