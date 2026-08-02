import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Permintaan from '@/lib/models/Permintaan';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    
    await connectToDatabase();
    
    // Ambil data permintaan lama
    const oldPermintaan = await Permintaan.findById(id);
    if (!oldPermintaan) {
      return NextResponse.json({ message: 'Permintaan tidak ditemukan' }, { status: 404 });
    }

    const oldStatus = oldPermintaan.status;
    const newStatus = body.status || oldStatus;

    // Hitung ulang jumlahItem dan totalQty jika ada perubahan items
    if (body.items) {
      body.jumlahItem = body.items.length;
      body.totalQty = body.items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);
    }

    // Lakukan pembaruan Permintaan
    const updatedPermintaan = await Permintaan.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    // Otomatisasi Pemotongan/Pengembalian Stok
    const Barang = (await import('@/lib/models/Barang')).default;
    const Mutasi = (await import('@/lib/models/Mutasi')).default;
    
    // Skenario 1: Menjadi Selesai -> Potong stok (tambah barangKeluar)
    if (oldStatus !== 'selesai' && newStatus === 'selesai') {
      for (const item of updatedPermintaan.items) {
        if (item.barangId) {
          await Barang.findByIdAndUpdate(item.barangId, {
            $inc: { barangKeluar: item.qty }
          });
          
          await Mutasi.create({
            barangId: item.barangId,
            jenis: 'keluar',
            qty: item.qty,
            keterangan: `Pengurangan otomatis dari Permintaan: ${updatedPermintaan.noRequest}`,
            tanggal: new Date(updatedPermintaan.tanggal), // Menggunakan tanggal permintaan
            referensiId: updatedPermintaan.noRequest
          });
        }
      }
    } 
    // Skenario 2: Batal Selesai -> Kembalikan stok (kurangi barangKeluar)
    else if (oldStatus === 'selesai' && newStatus !== 'selesai') {
      for (const item of updatedPermintaan.items) {
        if (item.barangId) {
          await Barang.findByIdAndUpdate(item.barangId, {
            $inc: { barangKeluar: -item.qty }
          });
          
          await Mutasi.create({
            barangId: item.barangId,
            jenis: 'masuk',
            qty: item.qty,
            keterangan: `Pengembalian otomatis (Pembatalan Permintaan: ${updatedPermintaan.noRequest})`,
            tanggal: new Date(),
            referensiId: updatedPermintaan.noRequest
          });
        }
      }
    }

    return NextResponse.json({ message: 'Permintaan berhasil diperbarui', data: updatedPermintaan }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui permintaan' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    const deletedPermintaan = await Permintaan.findByIdAndDelete(id);

    if (!deletedPermintaan) {
      return NextResponse.json({ message: 'Permintaan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Permintaan berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus permintaan' }, { status: 500 });
  }
}
