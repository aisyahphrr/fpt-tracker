import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barang from '@/lib/models/Barang';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';

async function isAdminUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return false;
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const email = ((payload?.email as string) || '').toLowerCase();
    const name = ((payload?.name as string) || '').toLowerCase();
    return email.includes('nailah') || name.includes('nailah') || payload?.role === 'admin';
  } catch (e) {
    return false;
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales (Nailah) yang memiliki izin untuk memperbarui barang atau stok.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    
    // Extract fields
    const { nama, cabang, kategori, satuan, deskripsi, status, tambahanMasuk, tanggal } = body;

    await connectToDatabase();

    let updateQuery: any = {};
    
    // Jika ada tambahanMasuk (dari halaman Stok), gunakan $inc
    if (tambahanMasuk !== undefined && Number(tambahanMasuk) > 0) {
      updateQuery.$inc = { barangMasuk: Number(tambahanMasuk) };
      
      // Catat ke buku mutasi dengan tanggal kustom (atau tanggal saat ini jika tidak diisi)
      const Mutasi = (await import('@/lib/models/Mutasi')).default;
      const tanggalMutasi = tanggal ? new Date(tanggal) : new Date();

      await Mutasi.create({
        barangId: id,
        jenis: 'masuk',
        qty: Number(tambahanMasuk),
        keterangan: 'Penambahan stok manual (Barang Masuk)',
        tanggal: tanggalMutasi
      });
    } else {
      // Jika update dari halaman Master Barang (tanpa stok)
      updateQuery = {};
      if (nama !== undefined) updateQuery.nama = nama;
      if (cabang !== undefined) updateQuery.cabang = cabang;
      if (kategori !== undefined) updateQuery.kategori = kategori;
      if (satuan !== undefined) updateQuery.satuan = satuan;
      if (deskripsi !== undefined) updateQuery.deskripsi = deskripsi;
      if (status !== undefined) updateQuery.status = status;
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
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales (Nailah) yang memiliki izin untuk menghapus barang.' },
        { status: 403 }
      );
    }

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
