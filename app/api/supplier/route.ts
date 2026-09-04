import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Supplier from '@/lib/models/Supplier';

const INITIAL_SUPPLIERS = [
  {
    nama: 'PT Laut Nusantara',
    lokasi: 'Bitung, Sulawesi Utara',
    komoditas: 'Yellowfin Tuna',
    spesifikasi: '2-4 kg up',
    picKontak: 'Bpk. Andi\n0812-3456-7890',
    lastUpdated: '30/08/2026 14:30 oleh Rian (Cab. Bitung)',
  },
  {
    nama: 'PT Laut Nusantara',
    lokasi: 'Bitung, Sulawesi Utara',
    komoditas: 'Cakalang',
    spesifikasi: '1 kg up',
    picKontak: 'Bpk. Andi\n0812-3456-7890',
    lastUpdated: '30/08/2026 14:32 oleh Rian (Cab. Bitung)',
  },
  {
    nama: 'PT Laut Nusantara',
    lokasi: 'Bitung, Sulawesi Utara',
    komoditas: 'Mackerel',
    spesifikasi: '300-500 g',
    picKontak: 'Bpk. Andi\n0812-3456-7890',
    lastUpdated: '30/08/2026 14:35 oleh Rian (Cab. Bitung)',
  },
  {
    nama: 'CV Samudra Jaya',
    lokasi: 'Tegal, Jawa Tengah',
    komoditas: 'Cakalang',
    spesifikasi: '1-5 kg up',
    picKontak: 'Ibu Siti\n0813-2233-4455',
    lastUpdated: '29/08/2026 16:20 oleh Tami (Pusat)',
  },
  {
    nama: 'PT Bahari Makmur',
    lokasi: 'Ambon, Maluku',
    komoditas: 'Tuna',
    spesifikasi: '2-6 kg up',
    picKontak: 'Bpk. Joko\n0821-9988-7766',
    lastUpdated: '29/08/2026 09:40 oleh Andi (Cab. Ambon)',
  },
  {
    nama: 'UD Mitra Laut',
    lokasi: 'Sorong, Papua Barat',
    komoditas: 'Cumi-Cumi',
    spesifikasi: 'Whole 100/200',
    picKontak: 'Ibu Maya\n0812-1122-3344',
    lastUpdated: '28/08/2026 15:10 oleh Dini (Pusat)',
  },
  {
    nama: 'Koperasi Mina Sejahtera',
    lokasi: 'Rembang, Jawa Tengah',
    komoditas: 'Teri Nasi',
    spesifikasi: 'Kering / Basah',
    picKontak: 'Bpk. Hasan\n0813-6677-8899',
    lastUpdated: '28/08/2026 11:05 oleh Tami (Pusat)',
  },
  {
    nama: 'PT Samudra Perkasa',
    lokasi: 'Makassar, Sulawesi Selatan',
    komoditas: 'Udang Vaname',
    spesifikasi: 'Size 30/40',
    picKontak: 'Bpk. Arif\n0823-4455-6677',
    lastUpdated: '27/08/2026 10:25 oleh Rian (Cab. Makassar)',
  },
  {
    nama: 'CV Maluku Bahari',
    lokasi: 'Ambon, Maluku',
    komoditas: 'Tuna (YFT)',
    spesifikasi: '10 kg up, Mix grade',
    picKontak: 'Bpk. Jacob\n0812-4455-6677',
    lastUpdated: '27/08/2026 09:15 oleh Andi (Cab. Ambon)',
  },
  {
    nama: 'PT Samudra Pasifik',
    lokasi: 'Ternate, Maluku Utara',
    komoditas: 'Chirimen',
    spesifikasi: 'Kering Grade A, 1-2 cm',
    picKontak: 'Bpk. Ridwan\n0852-3344-5566',
    lastUpdated: '26/08/2026 16:30 oleh Rian (Cab. Bitung)',
  },
  {
    nama: 'PT Gurita Bahari',
    lokasi: 'Makassar, Sulawesi Selatan',
    komoditas: 'Octopus',
    spesifikasi: '1-2 kg/pc, Frozen',
    picKontak: 'Bpk. Daeng Rahmat\n0811-5566-7788',
    lastUpdated: '26/08/2026 14:00 oleh Aisyah (Direksi)',
  },
  {
    nama: 'CV Laut Sumatra',
    lokasi: 'Belawan, Sumatera Utara',
    komoditas: 'Layur',
    spesifikasi: 'Whole 300-500g',
    picKontak: 'Bpk. Siregar\n0813-7788-9900',
    lastUpdated: '25/08/2026 11:20 oleh Tami (Pusat)',
  },
];

// GET all suppliers
export async function GET() {
  try {
    await connectToDatabase();
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    return NextResponse.json(suppliers, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat mengambil data supplier' }, { status: 500 });
  }
}

// POST new supplier
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { nama, lokasi, komoditas, spesifikasi, picKontak, catatan, user } = body;

    if (!nama || !lokasi || !komoditas || !picKontak) {
      return NextResponse.json({ message: 'Nama, Lokasi, Komoditas, dan PIC/Kontak wajib diisi' }, { status: 400 });
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} oleh ${user || 'Staff'}`;

    const newSupplier = await Supplier.create({
      nama,
      lokasi,
      komoditas,
      spesifikasi: spesifikasi || '',
      picKontak,
      catatan: catatan || '',
      lastUpdated: formattedDate,
    });

    return NextResponse.json({ message: 'Supplier berhasil ditambahkan ke database', data: newSupplier }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menyimpan data supplier' }, { status: 500 });
  }
}

// PUT / Edit supplier
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, nama, lokasi, komoditas, spesifikasi, picKontak, catatan, user } = body;

    if (!id) {
      return NextResponse.json({ message: 'ID supplier wajib diisi' }, { status: 400 });
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} oleh ${user || 'Staff'}`;

    const updated = await Supplier.findByIdAndUpdate(
      id,
      {
        nama,
        lokasi,
        komoditas,
        spesifikasi,
        picKontak,
        catatan,
        lastUpdated: formattedDate,
      },
      { new: true }
    );

    return NextResponse.json({ message: 'Supplier berhasil diperbarui di database', data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui data supplier' }, { status: 500 });
  }
}

// DELETE supplier
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID supplier wajib diisi' }, { status: 400 });
    }

    await Supplier.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Supplier berhasil dihapus dari database' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus data supplier' }, { status: 500 });
  }
}
