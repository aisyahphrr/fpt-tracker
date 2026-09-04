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
      { cabang: 'Jakarta', supplier: 'PT Laut Nusantara', qty: 2000, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 62000, hargaProses: 8000, harga: 70000, lastUpdated: '30/08/2026 09:00 WIB by Tami (Sales)' },
      { cabang: 'Bacan', supplier: 'PT Samudra Pasifik', qty: 1500, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '29/08/2026 16:40 WIB by Nailah (Admin)' },
      { cabang: 'Ambon', supplier: 'PT Maluku Sejahtera', qty: 1500, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '29/08/2026 16:35 WIB by Nailah (Admin)' },
      { cabang: 'Makassar', supplier: 'CV Bahari Makassar', qty: 1800, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 62000, hargaProses: 7500, harga: 69500, lastUpdated: '29/08/2026 14:20 WIB by Rian (Cab. Bitung)' },
      { cabang: 'Pekalongan', supplier: 'PT Lautan Sultra', qty: 1200, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 60000, hargaProses: 7000, harga: 67000, lastUpdated: '29/08/2026 11:00 WIB by Rian (Cab. Bitung)' },
      { cabang: 'Pemangkat', supplier: 'CV Samudra Buton', qty: 1500, spesifikasi: 'Size: 2-4 pcs/kg, Grade A', hargaBahanBaku: 64000, hargaProses: 8000, harga: 72000, lastUpdated: '29/08/2026 10:30 WIB by Rian (Cab. Bitung)' }
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
      { cabang: 'Benoa', supplier: 'CV Dewata Ocean', qty: 3500, spesifikasi: '10 kg up, Mix grade', hargaBahanBaku: 65000, hargaProses: 8000, harga: 73000, lastUpdated: '29/08/2026 11:30 WIB' },
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
      { cabang: 'Brondong', supplier: 'PT Vaname Prima', qty: 4000, spesifikasi: 'PD 31/40, IQF', hargaBahanBaku: 50000, hargaProses: 8000, harga: 58000, lastUpdated: '29/08/2026 14:00 WIB' },
      { cabang: 'Lampulo', supplier: 'CV Shrimp Indo', qty: 2500, spesifikasi: 'PD 31/40, IQF', hargaBahanBaku: 51000, hargaProses: 8000, harga: 59000, lastUpdated: '29/08/2026 11:00 WIB' },
      { cabang: 'Prigi', supplier: 'PT Tambak Nusantara', qty: 1000, spesifikasi: 'PD 31/40, IQF', hargaBahanBaku: 52000, hargaProses: 8000, harga: 60000, lastUpdated: '29/08/2026 09:30 WIB' }
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
      { cabang: 'Pekalongan', supplier: 'CV Sultra Marine', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 39000, hargaProses: 8000, harga: 47000, lastUpdated: '29/08/2026 09:30 WIB' },
      { cabang: 'Semeleu', supplier: 'PT NTT Seafood', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 41000, hargaProses: 8000, harga: 49000, lastUpdated: '28/08/2026 16:00 WIB' },
      { cabang: 'Benoa', supplier: 'CV Octopus Dewata', qty: 1000, spesifikasi: '1-2 kg/pc, Frozen', hargaBahanBaku: 40500, hargaProses: 8000, harga: 48500, lastUpdated: '28/08/2026 14:00 WIB' }
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
      { cabang: 'Benoa', supplier: 'CV Bali Marine', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 13:00 WIB' },
      { cabang: 'Surabaya', supplier: 'PT Jawa Bahari', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 11:00 WIB' },
      { cabang: 'Makassar', supplier: 'CV Anging Mammiri', qty: 4000, spesifikasi: '5 kg up, FOB', hargaBahanBaku: 60000, hargaProses: 8000, harga: 68000, lastUpdated: '28/08/2026 09:00 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-006',
    buyer: 'PT Indomar',
    negara: 'Indonesia',
    komoditas: 'Cumi',
    qtyPermintaan: 20000,
    hargaBuyer: 65000,
    lastUpdated: '28/08/2026 10:00 WIB by Utami (Pusat)',
    sumber: []
  },
  {
    noRequest: 'INQ-2026-007',
    buyer: 'Pacific Harvest Ltd',
    negara: 'Korea Selatan',
    komoditas: 'Mackerel',
    qtyPermintaan: 12000,
    hargaBuyer: 55000,
    lastUpdated: '27/08/2026 16:00 WIB by Ahlan (Pusat)',
    sumber: [
      { cabang: 'Belawan', supplier: 'PT Sumatera Fish', qty: 4000, spesifikasi: 'Whole 300-500g', hargaBahanBaku: 45000, hargaProses: 7000, harga: 52000, lastUpdated: '27/08/2026 14:00 WIB' },
      { cabang: 'Jakarta', supplier: 'CV Lautan Makmur', qty: 4000, spesifikasi: 'Whole 300-500g', hargaBahanBaku: 46000, hargaProses: 7000, harga: 53000, lastUpdated: '27/08/2026 12:00 WIB' },
      { cabang: 'Pekalongan', supplier: 'PT Pantura Marine', qty: 4000, spesifikasi: 'Whole 300-500g', hargaBahanBaku: 45500, hargaProses: 7000, harga: 52500, lastUpdated: '27/08/2026 10:00 WIB' }
    ]
  },
  {
    noRequest: 'INQ-2026-008',
    buyer: 'Sakamoto Co. Ltd',
    negara: 'Jepang',
    komoditas: 'Chirimen',
    qtyPermintaan: 5000,
    hargaBuyer: 85000,
    lastUpdated: '27/08/2026 11:00 WIB by Nailah (Admin)',
    sumber: [
      { cabang: 'Bacan', supplier: 'PT Bacan Mandiri', qty: 2500, spesifikasi: 'Kering 1-2 cm', hargaBahanBaku: 72000, hargaProses: 8000, harga: 80000, lastUpdated: '27/08/2026 10:00 WIB' },
      { cabang: 'Bitung', supplier: 'CV Celebes Fish', qty: 2500, spesifikasi: 'Kering 1-2 cm', hargaBahanBaku: 73000, hargaProses: 8000, harga: 81000, lastUpdated: '27/08/2026 09:00 WIB' }
    ]
  }
];

// GET all bahan-baku
export async function GET() {
  try {
    await connectToDatabase();
    let bahanBaku = await BahanBaku.find({}).sort({ createdAt: -1 });

    // Auto-sync any Permintaan Buyer records that are not yet in BahanBaku
    try {
      const allPermintaan = await Permintaan.find({});
      let hasAdded = false;

      for (const p of allPermintaan) {
        for (const item of p.items || []) {
          const komoditasName = item.name;
          const exists = bahanBaku.some(
            (bb) =>
              bb.noRequest === p.noRequest ||
              (bb.buyer.toLowerCase().trim() === p.buyer.toLowerCase().trim() &&
                bb.komoditas.toLowerCase().trim() === komoditasName.toLowerCase().trim())
          );

          if (!exists) {
            await BahanBaku.create({
              noRequest: p.noRequest,
              buyer: p.buyer,
              negara: p.negara || 'Indonesia',
              komoditas: komoditasName,
              qtyPermintaan: item.qty || p.totalQty || 1,
              hargaBuyer: item.harga || 0,
              sumber: [], // Belum ada sumber (0 Sumber)
              lastUpdated: p.lastUpdated || `${p.tanggal} oleh Sistem`,
            });
            hasAdded = true;
          }
        }
      }

      if (hasAdded) {
        bahanBaku = await BahanBaku.find({}).sort({ createdAt: -1 });
      }
    } catch (syncErr) {
      console.error('Error auto-syncing Permintaan to BahanBaku:', syncErr);
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
      const cleanSumber = { ...newSumber };
      if (!cleanSumber._id) {
        cleanSumber._id = `src-${Date.now()}`;
      }

      updated = await BahanBaku.findByIdAndUpdate(
        id,
        {
          $push: { sumber: cleanSumber },
          $set: { lastUpdated: nowStr },
        },
        { new: true, runValidators: false }
      );
    } else {
      // Update full sumber list
      const cleanSumberList = Array.isArray(sumber) ? sumber : [];
      updated = await BahanBaku.findByIdAndUpdate(
        id,
        {
          $set: {
            sumber: cleanSumberList,
            ...(filePerhitungan !== undefined ? { filePerhitungan } : {}),
            lastUpdated: nowStr,
          },
        },
        { new: true, runValidators: false }
      );
    }

    if (!updated) {
      // Fallback by noRequest or buyer
      const bb = await BahanBaku.findOne({ $or: [{ noRequest: id }, { buyer: id }] });
      if (bb) {
        if (newSumber) {
          bb.sumber.push(newSumber);
          bb.lastUpdated = nowStr;
        } else if (sumber) {
          bb.sumber = sumber;
          bb.lastUpdated = nowStr;
        }
        await bb.save();
        return NextResponse.json({ message: 'Sumber bahan baku berhasil diperbarui', data: bb }, { status: 200 });
      }
      return NextResponse.json({ message: 'Data bahan baku tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sumber bahan baku berhasil diperbarui', data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating bahan baku:', error);
    return NextResponse.json({ message: error.message || 'Terjadi kesalahan saat memperbarui data' }, { status: 500 });
  }
}

