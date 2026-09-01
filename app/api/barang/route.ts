import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barang from '@/lib/models/Barang';

const INITIAL_BARANG_SEED = [
  { kode: 'STK-001', nama: 'Yellowfin Tuna (YFT)', kategori: 'Whole Round 2-4 kg up', cabang: 'Jakarta (Kamal)', satuan: 'kg', stokAwal: 12500, lastUpdated: '30/05/2026 14:30 oleh Tami (Sales)', status: 'aktif' as const },
  { kode: 'STK-002', nama: 'Skipjack Tuna', kategori: 'Whole Round 1 kg up', cabang: 'Bitung', satuan: 'kg', stokAwal: 18000, lastUpdated: '30/05/2026 09:40 oleh Rian (Cab. Bitung)', status: 'aktif' as const },
  { kode: 'STK-003', nama: 'Squid Loligo', kategori: 'Whole 50/100', cabang: 'Surabaya (Perak)', satuan: 'kg', stokAwal: 6750, lastUpdated: '29/05/2026 16:20 oleh Dini (Cab. Surabaya)', status: 'aktif' as const },
  { kode: 'STK-004', nama: 'Mackerel', kategori: 'Whole 300-500 g', cabang: 'Ambon', satuan: 'kg', stokAwal: 9200, lastUpdated: '30/05/2026 11:05 oleh Rizky (Cab. Ambon)', status: 'aktif' as const },
  { kode: 'STK-005', nama: 'Octopus', kategori: 'Flower Type 1-2 kg', cabang: 'Jakarta (Kamal)', satuan: 'kg', stokAwal: 2300, lastUpdated: '30/05/2026 08:50 oleh Tami (Sales)', status: 'aktif' as const },
  { kode: 'STK-006', nama: 'Vannamei Shrimp (PD)', kategori: 'Size 30/40', cabang: 'Makassar', satuan: 'kg', stokAwal: 7500, lastUpdated: '29/05/2026 14:10 oleh Andi (Cab. Makassar)', status: 'aktif' as const },
  { kode: 'STK-007', nama: 'Cumi-Cumi', kategori: 'Ring', cabang: 'Bitung', satuan: 'kg', stokAwal: 4100, lastUpdated: '29/05/2026 09:30 oleh Rian (Cab. Bitung)', status: 'aktif' as const },
  { kode: 'STK-008', nama: 'Milkfish (Bawal)', kategori: 'Whole 600-800 g', cabang: 'Pekalongan', satuan: 'kg', stokAwal: 5000, lastUpdated: '28/05/2026 17:45 oleh Siti (Cab. Pekalongan)', status: 'aktif' as const },
  { kode: 'STK-009', nama: 'Cakalang', kategori: '2 kg up, Grade A', cabang: 'Manado', satuan: 'kg', stokAwal: 15000, lastUpdated: '28/05/2026 15:20 oleh Tami (Sales)', status: 'aktif' as const },
  { kode: 'STK-010', nama: 'Chirimen', kategori: 'Kering 1-2 cm', cabang: 'Ternate', satuan: 'kg', stokAwal: 6500, lastUpdated: '27/05/2026 11:30 oleh Rian (Cab. Bitung)', status: 'aktif' as const },
  { kode: 'STK-011', nama: 'Tuna Albacore', kategori: '5 kg up, FOB', cabang: 'Bali', satuan: 'kg', stokAwal: 8600, lastUpdated: '27/05/2026 10:15 oleh Aisyah (Direksi)', status: 'aktif' as const },
  { kode: 'STK-012', nama: 'Udang Vaname', kategori: '40/50 HLSO', cabang: 'Banyuwangi', satuan: 'kg', stokAwal: 9000, lastUpdated: '26/05/2026 16:30 oleh Bambang (Cab. Banyuwangi)', status: 'aktif' as const },
  { kode: 'STK-013', nama: 'Kakap Merah', kategori: 'Fillet Skin-on', cabang: 'Kupang', satuan: 'kg', stokAwal: 4500, lastUpdated: '26/05/2026 14:00 oleh Mario (Cab. Kupang)', status: 'aktif' as const },
  { kode: 'STK-014', nama: 'Kerapu', kategori: 'Whole 1 kg up', cabang: 'Bau-Bau', satuan: 'kg', stokAwal: 3500, lastUpdated: '25/05/2026 11:20 oleh Rahmat (Cab. Bau-Bau)', status: 'aktif' as const },
  { kode: 'STK-015', nama: 'Tenggiri', kategori: 'Steak Frozen', cabang: 'Kendari', satuan: 'kg', stokAwal: 4200, lastUpdated: '25/05/2026 09:45 oleh La Ode (Cab. Kendari)', status: 'aktif' as const },
  { kode: 'STK-016', nama: 'Tongkol', kategori: 'Whole 500-1000g', cabang: 'Sorong', satuan: 'kg', stokAwal: 7800, lastUpdated: '24/05/2026 15:10 oleh Frans (Cab. Sorong)', status: 'aktif' as const },
  { kode: 'STK-017', nama: 'Layur', kategori: 'Whole 300-500g', cabang: 'Belawan', satuan: 'kg', stokAwal: 5000, lastUpdated: '24/05/2026 10:20 oleh Siregar (Cab. Belawan)', status: 'aktif' as const },
  { kode: 'STK-018', nama: 'Gurita Ball Type', kategori: '500g up', cabang: 'Makassar', satuan: 'kg', stokAwal: 3500, lastUpdated: '23/05/2026 15:30 oleh Andi (Cab. Makassar)', status: 'aktif' as const },
];

// GET all barang
export async function GET() {
  try {
    await connectToDatabase();
    let barangs = await Barang.find({}).sort({ createdAt: -1 });

    // Seed or clean if empty or contains non-fish items
    if (barangs.length === 0 || barangs.some(b => b.nama?.toLowerCase().includes('buku') || b.nama?.toLowerCase().includes('kertas'))) {
      await Barang.deleteMany({});
      for (const item of INITIAL_BARANG_SEED) {
        await Barang.create(item);
      }
      barangs = await Barang.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json(barangs, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data barang' }, { status: 500 });
  }
}

// POST new barang / Update Stok
export async function POST(req: Request) {
  try {
    const { kode, nama, cabang, kategori, satuan, deskripsi, stokAwal, barangMasuk, barangKeluar, user } = await req.json();

    if (!nama) {
      return NextResponse.json({ message: 'Nama komoditas wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const formattedDate = `${day}/${month}/${year} ${timeStr} oleh ${user || 'Aisyah (Direksi)'}`;

    // Check if existing item exists in the branch
    const existing = await Barang.findOne({ nama, cabang: cabang || 'Jakarta (Kamal)' });

    if (existing) {
      if (barangMasuk) {
        existing.barangMasuk = (existing.barangMasuk || 0) + Number(barangMasuk);
      }
      if (barangKeluar) {
        existing.barangKeluar = (existing.barangKeluar || 0) + Number(barangKeluar);
      }
      existing.lastUpdated = formattedDate;
      await existing.save();
      return NextResponse.json({ message: 'Stok berhasil diperbarui di database', data: existing }, { status: 200 });
    }

    const autoKode = kode || `STK-${String(Date.now()).slice(-4)}`;
    const newBarang = await Barang.create({
      kode: autoKode,
      nama,
      cabang: cabang || 'Jakarta (Kamal)',
      kategori: kategori || 'Grade A',
      satuan: satuan || 'kg',
      deskripsi: deskripsi || '',
      stokAwal: Number(stokAwal) || Number(barangMasuk) || 1000,
      barangMasuk: Number(barangMasuk) || 0,
      barangKeluar: Number(barangKeluar) || 0,
      lastUpdated: formattedDate,
      status: 'aktif',
    });

    return NextResponse.json({ message: 'Barang berhasil disimpan ke database', data: newBarang }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/updating barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menyimpan barang' }, { status: 500 });
  }
}
