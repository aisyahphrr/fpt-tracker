import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BahanBaku from '@/lib/models/BahanBaku';
import Permintaan from '@/lib/models/Permintaan';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';

const INITIAL_BAHAN_BAKU = [
  {
    noRequest: 'INQ-2026-001',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    komoditas: 'Cakalang',
    qtyPermintaan: 25000,
    hargaBuyer: 70000,
    lastUpdated: '30/08/2026 14:30 WIB by Nailah (Admin)',
    sumber: [
      { cabang: 'Bitung', supplier: 'CV Samudra Mandiri', qty: 3000, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 60000, hargaProses: 7500, harga: 67500, lastUpdated: '30/08/2026 09:10 WIB by Tami (Sales)' },
      { cabang: 'Manado', supplier: 'PT Laut Nusantara', qty: 2000, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 62000, hargaProses: 8000, harga: 70000, lastUpdated: '30/08/2026 09:00 WIB by Tami (Sales)' },
      { cabang: 'Ternate', supplier: 'PT Samudra Pasifik', qty: 1500, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '29/08/2026 16:40 WIB by Nailah (Admin)' },
      { cabang: 'Ambon', supplier: 'PT Maluku Sejahtera', qty: 1500, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '29/08/2026 16:35 WIB by Nailah (Admin)' },
      { cabang: 'Makassar', supplier: 'CV Bahari Makassar', qty: 1800, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 62000, hargaProses: 7500, harga: 69500, lastUpdated: '29/08/2026 14:20 WIB by Rian (Cab. Bitung)' },
      { cabang: 'Kendari', supplier: 'PT Lautan Sultra', qty: 1200, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 60000, hargaProses: 7000, harga: 67000, lastUpdated: '29/08/2026 11:00 WIB by Rian (Cab. Bitung)' },
      { cabang: 'Bau-Bau', supplier: 'CV Samudra Buton', qty: 1500, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '29/08/2026 10:30 WIB by Rian (Cab. Bitung)' }
    ]
  },
  {
    noRequest: 'INQ-2026-002',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    komoditas: 'Tuna',
    qtyPermintaan: 25000,
    hargaBuyer: 70000,
    lastUpdated: '30/08/2026 09:15 WIB by Tami (Sales)',
    sumber: [
      { cabang: 'Bitung', supplier: 'PT Indo Tuna Mandiri', qty: 4000, spesifikasi: '10 kg up, Mix grade', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '30/08/2026 08:30 WIB' },
      { cabang: 'Ambon', supplier: 'CV Maluku Bahari', qty: 3500, spesifikasi: '10 kg up, Mix grade', hargaBahanBaku: 65500, hargaProses: 8000, harga: 73500, lastUpdated: '29/08/2026 15:00 WIB' },
      { cabang: 'Sorong', supplier: 'PT Papua Seafood', qty: 3500, spesifikasi: '10 kg up, Mix grade', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '29/08/2026 14:15 WIB' },
      { cabang: 'Bali', supplier: 'CV Dewata Ocean', qty: 3500, spesifikasi: '10 kg up, Mix grade', hargaBahanBaku: 65000, hargaProses: 8000, harga: 73000, lastUpdated: '29/08/2026 11:30 WIB' },
      { cabang: 'Surabaya', supplier: 'PT Samudra Jaya', qty: 3500, spesifikasi: '10 kg up, Mix grade', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '29/08/2026 10:00 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-003',
    buyer: 'Siam Food Corp.',
    negara: 'Thailand',
    komoditas: 'Udang Vanamei',
    qtyPermintaan: 10000,
    hargaBuyer: 60000,
    lastUpdated: '29/08/2026 16:30 WIB by Nailah (Admin)',
    sumber: [
      { cabang: 'Banyuwangi', supplier: 'PT Vaname Prima', qty: 4000, spesifikasi: 'PD 31/40, IQF', hargaBahanBaku: 50000, hargaProses: 8000, harga: 58000, lastUpdated: '29/08/2026 14:00 WIB' },
      { cabang: 'Lampung', supplier: 'CV Shrimp Indo', qty: 2500, spesifikasi: 'PD 31/40, IQF', hargaBahanBaku: 51000, hargaProses: 8000, harga: 59000, lastUpdated: '29/08/2026 11:00 WIB' },
      { cabang: 'Situbondo', supplier: 'PT Tambak Nusantara', qty: 1000, spesifikasi: 'PD 31/40, IQF', hargaBahanBaku: 52000, hargaProses: 8000, harga: 60000, lastUpdated: '29/08/2026 09:30 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-004',
    buyer: 'Alief IKE',
    negara: 'Jepang',
    komoditas: 'Octopus',
    qtyPermintaan: 3000,
    hargaBuyer: 50000,
    lastUpdated: '29/08/2026 11:20 WIB by Nailah (Admin)',
    sumber: [
      { cabang: 'Makassar', supplier: 'PT Gurita Bahari', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 40000, hargaProses: 8000, harga: 48000, lastUpdated: '29/08/2026 10:00 WIB' },
      { cabang: 'Kendari', supplier: 'CV Sultra Marine', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 39000, hargaProses: 8000, harga: 47000, lastUpdated: '29/08/2026 09:30 WIB' },
      { cabang: 'Kupang', supplier: 'PT NTT Seafood', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 41000, hargaProses: 8000, harga: 49000, lastUpdated: '28/08/2026 16:00 WIB' },
      { cabang: 'Bali', supplier: 'CV Octopus Dewata', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 40500, hargaProses: 8000, harga: 48500, lastUpdated: '28/08/2026 14:00 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-005',
    buyer: 'Trang Thuy Seafood',
    negara: 'Vietnam',
    komoditas: 'Tuna (YFT)',
    qtyPermintaan: 15000,
    hargaBuyer: 65000,
    lastUpdated: '28/08/2026 15:00 WIB by Roberto (Pusat)',
    sumber: [
      { cabang: 'Jakarta', supplier: 'PT Ocean Prima', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 14:00 WIB' },
      { cabang: 'Bali', supplier: 'CV Bali Marine', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 13:00 WIB' },
      { cabang: 'Surabaya', supplier: 'PT Jawa Bahari', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 11:00 WIB' },
      { cabang: 'Makassar', supplier: 'CV Anging Mammiri', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 09:00 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-006',
    buyer: 'PT Indomar Seafood',
    negara: 'Indonesia',
    komoditas: 'Cumi-Cumi',
    qtyPermintaan: 8000,
    hargaBuyer: 45000,
    lastUpdated: '28/08/2026 09:00 WIB by Nailah (Pusat)',
    sumber: []
  },
  {
    noRequest: 'INQ-2026-007',
    buyer: 'Pacific Harvest Ltd.',
    negara: 'Korea Selatan',
    komoditas: 'Mackerel',
    qtyPermintaan: 12000,
    hargaBuyer: 55000,
    lastUpdated: '27/08/2026 14:00 WIB by Tami (Pusat)',
    sumber: [
      { cabang: 'Banyuwangi', supplier: 'PT Selat Bali', qty: 4000, spesifikasi: '200-300 g/pc, IQF', hargaBahanBaku: 44000, hargaProses: 8000, harga: 52000, lastUpdated: '27/08/2026 11:00 WIB' },
      { cabang: 'Tegal', supplier: 'CV Laut Jawa', qty: 4000, spesifikasi: '200-300 g/pc, IQF', hargaBahanBaku: 44000, hargaProses: 8000, harga: 52000, lastUpdated: '27/08/2026 10:00 WIB' },
      { cabang: 'Pekalongan', supplier: 'PT Mina Bahari', qty: 4000, spesifikasi: '200-300 g/pc, IQF', hargaBahanBaku: 44000, hargaProses: 8000, harga: 52000, lastUpdated: '27/08/2026 09:00 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-008',
    buyer: 'Sakamoto Co. Ltd',
    negara: 'Jepang',
    komoditas: 'Chirimen',
    qtyPermintaan: 5000,
    hargaBuyer: 48000,
    lastUpdated: '26/08/2026 11:00 WIB by Aisyah (Direksi)',
    sumber: [
      { cabang: 'Ambon', supplier: 'PT Maluku Sejahtera', qty: 2500, spesifikasi: 'Kering, Grade A, 1-2 cm', hargaBahanBaku: 38000, hargaProses: 7000, harga: 45000, lastUpdated: '26/08/2026 10:00 WIB' },
      { cabang: 'Tupang', supplier: 'CV Nusa Laut', qty: 2500, spesifikasi: 'Kering, Grade A, 1-2 cm', hargaBahanBaku: 38000, hargaProses: 7000, harga: 45000, lastUpdated: '26/08/2026 09:00 WIB' }
    ]
  }
];

// GET all bahan-baku
export async function GET() {
  try {
    await connectToDatabase();
    let bahanBaku = await BahanBaku.find({}).sort({ createdAt: -1 });

    // Seed or update if old incomplete records exist
    if (bahanBaku.length === 0 || bahanBaku.some(b => !b.buyer || !b.komoditas || (b.sumber?.length > 0 && !b.sumber[0].hargaProses))) {
      await BahanBaku.deleteMany({});
      for (const item of INITIAL_BAHAN_BAKU) {
        await BahanBaku.create(item);
      }
      bahanBaku = await BahanBaku.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(bahanBaku, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching bahan-baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data bahan baku' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { noRequest, buyer, negara, komoditas, qtyPermintaan, hargaBuyer, sumber } = body;

    if (!buyer || !komoditas) {
      return NextResponse.json({ message: 'Buyer dan komoditas wajib diisi' }, { status: 400 });
    }

    const today = new Date();
    const nowStr = `${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })} ${today.getFullYear()}, ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const newBahanBaku = await BahanBaku.create({
      noRequest: noRequest || `INQ-${today.getFullYear()}-001`,
      buyer,
      negara: negara || '',
      komoditas,
      qtyPermintaan: Number(qtyPermintaan) || 1,
      hargaBuyer: Number(hargaBuyer) || 0,
      sumber: sumber || [],
      lastUpdated: nowStr,
    });

    return NextResponse.json({ message: 'Bahan Baku berhasil disimpan', data: newBahanBaku }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bahan baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat bahan baku' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, sumber, newSumber, filePerhitungan } = body;

    if (!id) {
      return NextResponse.json({ message: 'ID bahan baku wajib diisi' }, { status: 400 });
    }

    const today = new Date();
    const nowStr = `${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })} ${today.getFullYear()}, ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    let updated;
    if (newSumber) {
      // Append single new source
      updated = await BahanBaku.findByIdAndUpdate(
        id,
        {
          $push: { sumber: newSumber },
          $set: { lastUpdated: nowStr },
        },
        { new: true }
      );
    } else {
      // Update full sumber list
      updated = await BahanBaku.findByIdAndUpdate(
        id,
        {
          $set: {
            sumber,
            filePerhitungan,
            lastUpdated: nowStr,
          },
        },
        { new: true }
      );
    }

    return NextResponse.json({ message: 'Sumber bahan baku berhasil diperbarui', data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating bahan baku:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui data' }, { status: 500 });
  }
}

