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
    tanggal: '13/08/2026',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    tujuan: 'Ho Chi Minh Port, Vietnam',
    jumlahItem: 1,
    totalQty: 25000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '30/08/2026 oleh Nailah (Pusat)',
    items: [
      { name: 'Cakalang', spesifikasi: '2 kg up, FOB, Grade A', size: '2 kg up', qty: 25000, harga: 405000000 }
    ]
  },
  {
    noRequest: 'INQ-2026-002',
    tanggal: '13/08/2026',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    tujuan: 'Ho Chi Minh Port, Vietnam',
    jumlahItem: 1,
    totalQty: 25000,
    status: 'pending',
    statusStok: 'Non-Stock',
    lastUpdated: '30/08/2026 oleh Roberto (Pusat)',
    items: [
      { name: 'Tuna', spesifikasi: '10 kg up, FOB, Mix grade', size: '10 kg up', qty: 25000, harga: 405000000 }
    ]
  },
  {
    noRequest: 'INQ-2026-003',
    tanggal: '12/08/2026',
    buyer: 'Siam Food Corp.',
    negara: 'Thailand',
    tujuan: 'Bangkok Port, Thailand',
    jumlahItem: 1,
    totalQty: 10000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '29/08/2026 oleh Tami (Pusat)',
    items: [
      { name: 'Udang Vanamei', spesifikasi: 'PD 31/40, IQF', size: '31/40', qty: 10000, harga: 162000000 }
    ]
  },
  {
    noRequest: 'INQ-2026-004',
    tanggal: '11/08/2026',
    buyer: 'Alief IKE',
    negara: 'Jepang',
    tujuan: 'Tokyo Port, Japan',
    jumlahItem: 1,
    totalQty: 3000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '29/08/2026 oleh Nailah (Pusat)',
    items: [
      { name: 'Octopus', spesifikasi: '1-2 kg/pc, Frozen', size: '1-2 kg/pc', qty: 3000, harga: 109620000 }
    ]
  },
  {
    noRequest: 'INQ-2026-005',
    tanggal: '10/08/2026',
    buyer: 'Trang Thuy Seafood',
    negara: 'Vietnam',
    tujuan: 'Da Nang Port, Vietnam',
    jumlahItem: 1,
    totalQty: 15000,
    status: 'pending',
    statusStok: 'Stock',
    lastUpdated: '28/08/2026 oleh Roberto (Pusat)',
    items: [
      { name: 'Tuna (YFT)', spesifikasi: '5 kg up, FOB, Grade A', size: '5 kg up', qty: 15000, harga: 243000000 }
    ]
  },
  {
    noRequest: 'INQ-2026-006',
    tanggal: '09/08/2026',
    buyer: 'PT Indomar Seafood',
    negara: 'Indonesia',
    tujuan: 'Tanjung Priok, Indonesia',
    jumlahItem: 1,
    totalQty: 8000,
    status: 'pending',
    statusStok: 'Non-Stock',
    lastUpdated: '28/08/2026 oleh Nailah (Pusat)',
    items: [
      { name: 'Cumi-Cumi', spesifikasi: 'U3, IQF, Cleaned', size: 'U3', qty: 8000, harga: 128000000 }
    ]
  },
  {
    noRequest: 'INQ-2026-007',
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
    let permintaan = await Permintaan.find({}).sort({ createdAt: -1 });

    // Seed or update if old incomplete records exist
    if (permintaan.length === 0 || permintaan.some(p => !p.items || p.items.length === 0 || p.items[0]?.harga === 0 && p.buyer === 'Ba Hai JSC')) {
      await Permintaan.deleteMany({});
      for (const item of INITIAL_PERMINTAAN) {
        await Permintaan.create(item);
      }
      permintaan = await Permintaan.find({}).sort({ createdAt: -1 });
    }

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
      harga: Number(item.harga) || 0
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

    // Otomatis buat referensi Bahan Baku
    for (const item of sanitizedItems) {
      await BahanBaku.create({
        noRequest,
        buyer,
        negara: negara || '',
        komoditas: item.name,
        qtyPermintaan: item.qty || 1,
        hargaBuyer: item.harga || 0,
        sumber: item.spesifikasi || item.size ? [{ cabang: 'Pusat', supplier: 'Utama', qty: item.qty || 1, harga: item.harga || 0, size: item.size || '', spesifikasi: item.spesifikasi || '' }] : [],
        lastUpdated: nowStr,
      });
    }

    return NextResponse.json({ message: 'Permintaan berhasil dibuat', data: newPermintaan }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat membuat permintaan' }, { status: 500 });
  }
}

