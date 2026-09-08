import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Permintaan from '@/lib/models/Permintaan';
import Barang from '@/lib/models/Barang';
import BahanBaku from '@/lib/models/BahanBaku';
import StrukturBiaya from '@/lib/models/StrukturBiaya';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';

async function getUserInfo() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return { name: 'Aisyah (Cabang)', role: 'staff', email: 'aisyah@gmail.com' };
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      name: (payload?.name as string) || 'User',
      role: (payload?.role as string) || 'staff',
      email: ((payload?.email as string) || '').toLowerCase()
    };
  } catch (e) {
    return { name: 'Aisyah (Cabang)', role: 'staff', email: 'aisyah@gmail.com' };
  }
}

// Initial seed data if empty
const INITIAL_PERMINTAAN: Array<{
  noRequest: string;
  tanggal: string;
  buyer: string;
  negara: string;
  tujuan: string;
  jumlahItem: number;
  totalQty: number;
  status: string;
  statusStok: 'Stock' | 'Non-Stock';
  lastUpdated: string;
  items: Array<{
    name: string;
    spesifikasi: string;
    size: string;
    qty: number;
    harga: number;
  }>;
}> = [
  {
    noRequest: 'INQ-2026-001',
    tanggal: '04/09/2026',
    buyer: 'Ocean Trading Co.Ltd',
    negara: 'Korea Selatan',
    tujuan: 'Busan Port, Korea',
    jumlahItem: 1,
    totalQty: 25000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '04/09/2026 oleh Nailah (Admin Pusat)',
    items: [
      { name: 'Cuttlefish', spesifikasi: 'Whole Clean, FOB, Packing : 4.5kg / 5kg', size: '100 - 200 g', qty: 5000, harga: 125000 },
      { name: 'Cuttlefish', spesifikasi: 'Whole Clean, FOB, Packing : 4.5kg / 5kg', size: '200 - 300 g', qty: 8000, harga: 130000 },
      { name: 'Cuttlefish', spesifikasi: 'Whole Clean, FOB, Packing : 4.5kg / 5kg', size: '300 - 500 g', qty: 7000, harga: 135000 },
      { name: 'Cuttlefish', spesifikasi: 'Whole Clean, FOB, Packing : 4.5kg / 5kg', size: '500 g Up', qty: 5000, harga: 140000 }
    ]
  },
  {
    noRequest: 'INQ-2026-002',
    tanggal: '01/09/2026',
    buyer: 'MMP International Co.Ltd',
    negara: 'Thailand',
    tujuan: 'Bangkok Port, Thailand',
    jumlahItem: 1,
    totalQty: 25000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '01/09/2026 oleh Nailah (Admin Pusat)',
    items: [
      { name: 'Skipjack Tuna', spesifikasi: 'Grade A', size: '1 - 2 kg', qty: 10000, harga: 27540 },
      { name: 'Skipjack Tuna', spesifikasi: 'Grade A', size: '2 - 4 kg', qty: 10000, harga: 29160 },
      { name: 'Skipjack Tuna', spesifikasi: 'Grade A', size: '4 kg up', qty: 5000, harga: 30780 }
    ]
  },
  {
    noRequest: 'INQ-2026-003',
    tanggal: '28/08/2026',
    buyer: 'Siam Canadian',
    negara: 'China',
    tujuan: 'Guangzhou Port, China',
    jumlahItem: 1,
    totalQty: 10000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '28/08/2026 oleh Tami (Pusat)',
    items: [
      { name: 'Squid', spesifikasi: 'Tube & Tentacles, Semi-IQF', size: 'U5', qty: 4000, harga: 34020 },
      { name: 'Squid', spesifikasi: 'Tube & Tentacles, Semi-IQF', size: 'U7', qty: 6000, harga: 34020 }
    ]
  },
  {
    noRequest: 'INQ-2026-004',
    tanggal: '27/08/2026',
    buyer: 'Saigon Blue Ocean JSC',
    negara: 'Vietnam',
    tujuan: 'Da Nang, Vietnam',
    jumlahItem: 1,
    totalQty: 30000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '27/08/2026 oleh Nailah (Admin Pusat)',
    items: [
      { name: 'Yellowfin Tuna', spesifikasi: 'Saku AAA, CO Treated', size: '10 kg up', qty: 15000, harga: 45360 },
      { name: 'Yellowfin Tuna', spesifikasi: 'Saku AAA, CO Treated', size: '20 kg up', qty: 15000, harga: 50220 }
    ]
  },
  {
    noRequest: 'INQ-2026-005',
    tanggal: '25/08/2026',
    buyer: 'Hong Ly Seafood',
    negara: 'Vietnam',
    tujuan: 'Ho Chi Minh Port, Vietnam',
    jumlahItem: 1,
    totalQty: 20000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '25/08/2026 oleh Roberto (Pusat)',
    items: [
      { name: 'Squid', spesifikasi: 'Ring & Tentacles, IQF', size: 'Cleaned Size A', qty: 10000, harga: 32400 },
      { name: 'Squid', spesifikasi: 'Ring & Tentacles, IQF', size: 'Cleaned Size B', qty: 10000, harga: 40500 }
    ]
  },
  {
    noRequest: 'INQ-2026-006',
    tanggal: '20/08/2026',
    buyer: 'Alief IKE',
    negara: 'Yunani',
    tujuan: 'Athens Port, Greece',
    jumlahItem: 1,
    totalQty: 5000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '20/08/2026 oleh Nailah (Admin Pusat)',
    items: [
      { name: 'Octopus', spesifikasi: '1-2 kg/pc, Frozen Ball', size: '1 - 2 kg', qty: 5000, harga: 97200 }
    ]
  },
  {
    noRequest: 'INQ-2026-007',
    tanggal: '18/08/2026',
    buyer: 'Trang Thuy Seafood',
    negara: 'Vietnam',
    tujuan: 'Da Nang, Vietnam',
    jumlahItem: 1,
    totalQty: 15000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '18/08/2026 oleh Tami (Pusat)',
    items: [
      { name: 'Yellowfin Tuna', spesifikasi: 'Loin IVP, Grade A', size: '2 - 3 kg', qty: 8000, harga: 37260 },
      { name: 'Yellowfin Tuna', spesifikasi: 'Loin IVP, Grade A', size: '3 - 5 kg', qty: 7000, harga: 45360 }
    ]
  },
  {
    noRequest: 'INQ-2026-008',
    tanggal: '08/08/2026',
    buyer: 'Pacific Harvest Ltd.',
    negara: 'Korea Selatan',
    tujuan: 'Busan Port, South Korea',
    jumlahItem: 1,
    totalQty: 12000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '27/08/2026 oleh Tami (Pusat)',
    items: [
      { name: 'Mackerel', spesifikasi: '200-300 g/pc, IQF', size: '200-300 g', qty: 12000, harga: 194400000 }
    ]
  },
  {
    noRequest: 'INQ-2026-008',
    tanggal: '07/08/2026',
    buyer: 'Sakamoto Co. Ltd',
    negara: 'Jepang',
    tujuan: 'Osaka Port, Japan',
    jumlahItem: 1,
    totalQty: 5000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '26/08/2026 oleh Aisyah (Direksi)',
    items: [
      { name: 'Chirimen', spesifikasi: 'Kering, Grade A, 1-2 cm', size: '1-2 cm', qty: 5000, harga: 0 } // Not Available
    ]
  }
];

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
    const user = await getUserInfo();
    const body = await req.json();
    const { tanggal, buyer, negara, tujuan, items, catatan, fileQuotation } = body;

    if (!buyer || !items || items.length === 0) {
      return NextResponse.json({ message: 'Buyer dan minimal 1 barang wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    // Check availability in stock
    const barangs = await Barang.find({});
    let hasAvailableStock = true;

    for (const item of items) {
      const found = barangs.find(b => b.nama.toLowerCase().includes(item.name.toLowerCase()));
      const availableQty = found ? ((found.stokAwal || 0) + (found.barangMasuk || 0) - (found.barangKeluar || 0)) : 0;
      if (!found || availableQty < (item.qty || 0)) {
        hasAvailableStock = false;
      }
    }

    const today = new Date();
    const year = today.getFullYear();
    const count = await Permintaan.countDocuments();
    const noRequest = `INQ-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const sanitizedItems = items.map((item: any) => ({
      ...item,
      barangId: (item.barangId && item.barangId !== '') ? item.barangId : undefined,
      harga: Number(item.harga) || 0,
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      hargaMin: Number(item.hargaMin) || 0,
      hargaMax: Number(item.hargaMax) || 0,
      currency: item.currency || 'USD',
    }));

    const jumlahItem = sanitizedItems.length;
    const totalQty = sanitizedItems.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);

    const nowStr = `${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })} ${year}, ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')} oleh ${user.name}`;

    const newPermintaan = await Permintaan.create({
      noRequest,
      tanggal: tanggal || `${today.getDate()} Agustus ${year}`,
      buyer,
      negara: negara || '',
      tujuan: tujuan || '',
      jumlahItem,
      totalQty,
      items: sanitizedItems,
      fileQuotation: fileQuotation || '',
      catatan: catatan || '',
      status: 'pending',
      statusStok: hasAvailableStock ? 'Stock' : 'Non-Stock',
      lastUpdated: nowStr
    });

    // Otomatis buat referensi Bahan Baku dengan sumber kosong (0 Sumber / Belum Ada Sumber)
    for (const item of sanitizedItems) {
      await BahanBaku.create({
        noRequest,
        buyer,
        negara: negara || '',
        komoditas: item.name,
        qtyPermintaan: item.qty || 1,
        hargaBuyer: item.hargaBuyerPerKg || (Number(item.qty) > 0 && Number(item.harga) > 100000 ? Math.round(Number(item.harga) / Number(item.qty)) : Number(item.harga)) || 0,
        allowedSizes: item.sizes || [],
        targetBuyer: item.targetBuyer || (item.currency ? `${item.currency} ${item.harga || ''}` : ''),
        sumber: [], // Baru masuk dari Permintaan Buyer, belum ada sumber bahan baku
        lastUpdated: nowStr,
      });
    }

    return NextResponse.json({ message: 'Permintaan berhasil dibuat', data: newPermintaan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat permintaan' }, { status: 500 });
  }
}

