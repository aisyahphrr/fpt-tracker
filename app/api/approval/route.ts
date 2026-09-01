import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BahanBaku from '@/lib/models/BahanBaku';
import Permintaan from '@/lib/models/Permintaan';

const INITIAL_APPROVAL_DATA = [
  {
    id: 'appr-1',
    buyer: 'Ba Hai JSC',
    negara: 'Vietnam',
    komoditas: 'Cakalang',
    qtyPermintaan: 25000,
    incoterm: 'FOB',
    hargaBuyerUSD: 2.10,
    kursIDR: 16200,
    tanggalRequest: '26 Mei 2026 14:30',
    targetPengiriman: 'Juni 2026',
    status: 'Menunggu', // 'Menunggu' | 'Disetujui' | 'Ditolak'
    sumberList: [
      {
        id: 's1',
        nama: 'PT Laut Nusantara',
        asal: 'Manado',
        qty: 8000,
        harga: 65000,
        selected: true,
        status: 'Disetujui',
        notes: 'Kualitas baik, stok cukup dan harga masih dibawah rata-rata sumber lain.',
        lastUpdated: 'oleh Nailah (Admin) — 26 Mei 2026, 15:10'
      },
      {
        id: 's2',
        nama: 'CV Samudra Mandiri',
        asal: 'Bitung',
        qty: 7000,
        harga: 64000,
        selected: true,
        status: 'Disetujui',
        notes: 'Supplier langganan, kualitas stabil dan harga kompetitif.',
        lastUpdated: 'oleh Nailah (Admin) — 26 Mei 2026, 15:12'
      },
      {
        id: 's3',
        nama: 'PT Maluku Sejahtera',
        asal: 'Ambon',
        qty: 4500,
        harga: 66000,
        selected: false,
        status: 'Ditolak',
        notes: 'Harga lebih tinggi dari rata-rata sumber dan stok terbatas.',
        lastUpdated: 'oleh Nailah (Admin) — 26 Mei 2026, 15:14'
      }
    ]
  },
  {
    id: 'appr-2',
    buyer: 'Siam Food Corp.',
    negara: 'Thailand',
    komoditas: 'Skipjack',
    qtyPermintaan: 10000,
    incoterm: 'FOB',
    hargaBuyerUSD: 3.80,
    kursIDR: 16200,
    tanggalRequest: '25 Mei 2026 10:15',
    targetPengiriman: 'Juni 2026',
    status: 'Disetujui',
    sumberList: [
      {
        id: 's4',
        nama: 'PT Vaname Prima',
        asal: 'Banyuwangi',
        qty: 6000,
        harga: 58000,
        selected: true,
        status: 'Disetujui',
        notes: 'Disetujui sesuai spesifikasi buyer.',
        lastUpdated: 'oleh Nailah (Admin) — 25 Mei 2026, 11:00'
      },
      {
        id: 's5',
        nama: 'CV Shrimp Indo',
        asal: 'Lampung',
        qty: 4000,
        harga: 59000,
        selected: true,
        status: 'Disetujui',
        notes: 'Disetujui untuk memenuhi kuota sisa.',
        lastUpdated: 'oleh Nailah (Admin) — 25 Mei 2026, 11:05'
      }
    ]
  },
  {
    id: 'appr-3',
    buyer: 'Trang Thuy Seafood',
    negara: 'Vietnam',
    komoditas: 'Tuna (YFT)',
    qtyPermintaan: 15000,
    incoterm: 'CFR',
    hargaBuyerUSD: 4.20,
    kursIDR: 16200,
    tanggalRequest: '24 Mei 2026 09:30',
    targetPengiriman: 'Juli 2026',
    status: 'Disetujui',
    sumberList: [
      {
        id: 's6',
        nama: 'PT Ocean Prima',
        asal: 'Jakarta',
        qty: 8000,
        harga: 68000,
        selected: true,
        status: 'Disetujui',
        notes: 'Disetujui, mutu grade AAA.',
        lastUpdated: 'oleh Roberto (Pusat) — 24 Mei 2026, 10:00'
      },
      {
        id: 's7',
        nama: 'CV Bali Marine',
        asal: 'Bali',
        qty: 7000,
        harga: 68000,
        selected: true,
        status: 'Disetujui',
        notes: 'Disetujui, siap ekspor.',
        lastUpdated: 'oleh Roberto (Pusat) — 24 Mei 2026, 10:05'
      }
    ]
  },
  {
    id: 'appr-4',
    buyer: 'Saigon Blue Ocean JSC',
    negara: 'Vietnam',
    komoditas: 'Mahi-Mahi',
    qtyPermintaan: 5000,
    incoterm: 'FOB',
    hargaBuyerUSD: 3.50,
    kursIDR: 16200,
    tanggalRequest: '24 Mei 2026 11:20',
    targetPengiriman: 'Juli 2026',
    status: 'Menunggu',
    sumberList: [
      {
        id: 's8',
        nama: 'CV Samudra Buton',
        asal: 'Bau-Bau',
        qty: 3000,
        harga: 55000,
        selected: true,
        status: 'Disetujui',
        notes: 'Menunggu review akhir kapasitas cold storage.',
        lastUpdated: 'oleh Nailah (Admin) — 24 Mei 2026, 12:00'
      },
      {
        id: 's9',
        nama: 'PT Maluku Perikanan',
        asal: 'Ambon',
        qty: 2000,
        harga: 57000,
        selected: false,
        status: 'Menunggu',
        notes: 'Dalam proses pengecekan kualitas fisik.',
        lastUpdated: 'oleh Nailah (Admin) — 24 Mei 2026, 12:05'
      }
    ]
  },
  {
    id: 'appr-5',
    buyer: 'Alief IKE',
    negara: 'Greece',
    komoditas: 'Octopus',
    qtyPermintaan: 3000,
    incoterm: 'FOB',
    hargaBuyerUSD: 3.10,
    kursIDR: 16200,
    tanggalRequest: '23 Mei 2026 16:45',
    targetPengiriman: 'Juni 2026',
    status: 'Ditolak',
    sumberList: [
      {
        id: 's10',
        nama: 'PT Gurita Bahari',
        asal: 'Makassar',
        qty: 1500,
        harga: 52000,
        selected: false,
        status: 'Ditolak',
        notes: 'Harga penawaran melebihi budget buyer dan size tidak sesuai.',
        lastUpdated: 'oleh Nailah (Admin) — 23 Mei 2026, 17:00'
      },
      {
        id: 's11',
        nama: 'CV Sultra Marine',
        asal: 'Kendari',
        qty: 1500,
        harga: 54000,
        selected: false,
        status: 'Ditolak',
        notes: 'Harga terlalu tinggi.',
        lastUpdated: 'oleh Nailah (Admin) — 23 Mei 2026, 17:02'
      }
    ]
  },
  {
    id: 'appr-6',
    buyer: 'Pacific Harvest Ltd.',
    negara: 'Korea Selatan',
    komoditas: 'Mackerel',
    qtyPermintaan: 12000,
    incoterm: 'FOB',
    hargaBuyerUSD: 3.40,
    kursIDR: 16200,
    tanggalRequest: '22 Mei 2026 14:00',
    targetPengiriman: 'Juni 2026',
    status: 'Disetujui',
    sumberList: [
      {
        id: 's12',
        nama: 'PT Selat Bali',
        asal: 'Banyuwangi',
        qty: 6000,
        harga: 52000,
        selected: true,
        status: 'Disetujui',
        notes: 'Kualitas IQF standar ekspor.',
        lastUpdated: 'oleh Tami (Pusat) — 22 Mei 2026, 15:00'
      },
      {
        id: 's13',
        nama: 'CV Laut Jawa',
        asal: 'Tegal',
        qty: 6000,
        harga: 52000,
        selected: true,
        status: 'Disetujui',
        notes: 'Kapasitas siap kirim.',
        lastUpdated: 'oleh Tami (Pusat) — 22 Mei 2026, 15:05'
      }
    ]
  }
];

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json(INITIAL_APPROVAL_DATA, { status: 200 });
  } catch (error: any) {
    console.error('Error in approval GET:', error);
    return NextResponse.json(INITIAL_APPROVAL_DATA, { status: 200 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, status, sumberList } = body;

    const idx = INITIAL_APPROVAL_DATA.findIndex((d) => d.id === id);
    if (idx >= 0) {
      if (status) INITIAL_APPROVAL_DATA[idx].status = status;
      if (sumberList) INITIAL_APPROVAL_DATA[idx].sumberList = sumberList;
    }

    return NextResponse.json({ message: 'Approval berhasil diperbarui', data: INITIAL_APPROVAL_DATA[idx] }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating approval:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan' }, { status: 500 });
  }
}
