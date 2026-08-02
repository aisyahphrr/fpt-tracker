import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barang from '@/lib/models/Barang';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    
    // Extract fields
    const { nama, kategori, satuan, deskripsi, status, tambahanMasuk } = body;

    await connectToDatabase();

    let updateQuery: any = {};
    
    // Jika ada tambahanMasuk (dari halaman Stok), gunakan $inc
    if (tambahanMasuk !== undefined && Number(tambahanMasuk) > 0) {
      updateQuery.$inc = { barangMasuk: Number(tambahanMasuk) };
      
      // Catat ke buku mutasi
      const Mutasi = (await import('@/lib/models/Mutasi')).default;
      await Mutasi.create({
        barangId: id,
        jenis: 'masuk',
        qty: Number(tambahanMasuk),
        keterangan: 'Penambahan stok manual (Barang Masuk)',
        tanggal: new Date()
      });
    } else {
      // Jika update dari halaman Master Barang (tanpa stok)
      updateQuery = { nama, kategori, satuan, deskripsi, status };
    }

    const updatedBarang = await Barang.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, runValidators: true }
    );

    if (!updatedBarang) {
      return NextResponse.json({ message: 'Barang tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Barang berhasil diperbarui', data: updatedBarang }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui barang' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    const deletedBarang = await Barang.findByIdAndDelete(id);

    if (!deletedBarang) {
      return NextResponse.json({ message: 'Barang tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Barang berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting barang:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus barang' }, { status: 500 });
  }
}
