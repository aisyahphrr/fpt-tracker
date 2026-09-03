import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Permintaan from '@/lib/models/Permintaan';
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
    const role = ((payload?.role as string) || '').toLowerCase();
    return email.includes('nailah') || name.includes('nailah') || role === 'admin' || role === 'direksi' || role === 'cabang';
  } catch (e) {
    return false;
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Anda tidak memiliki izin untuk mengubah permintaan atau status.' },
        { status: 403 }
      );
    }

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
      body.items = body.items.map((item: any) => ({
        ...item,
        barangId: (item.barangId && item.barangId !== '') ? item.barangId : undefined
      }));
      body.jumlahItem = body.items.length;
      body.totalQty = body.items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);
    }

    // Lakukan pembaruan Permintaan
    const updatedPermintaan = await Permintaan.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedPermintaan) {
      return NextResponse.json({ message: 'Gagal memperbarui data permintaan' }, { status: 500 });
    }

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

    // Sinkronisasi update qty & harga ke BahanBaku jika ada
    try {
      const BahanBaku = (await import('@/lib/models/BahanBaku')).default;
      if (updatedPermintaan.items && updatedPermintaan.items.length > 0) {
        for (const item of updatedPermintaan.items) {
          const perKg = (item as any).hargaBuyerPerKg || (Number(item.qty) > 0 && Number(item.harga) > 100000 ? Math.round(Number(item.harga) / Number(item.qty)) : Number(item.harga));
          await BahanBaku.updateMany(
            { 
              $or: [
                { noRequest: updatedPermintaan.noRequest },
                { buyer: updatedPermintaan.buyer, komoditas: item.name }
              ]
            },
            { 
              $set: { 
                qtyPermintaan: item.qty,
                hargaBuyer: perKg,
                spesifikasi: item.spesifikasi || item.size || 'Grade A',
              } 
            }
          );
        }
      }
    } catch (syncErr) {
      console.error('Error syncing to BahanBaku:', syncErr);
    }

    return NextResponse.json({ message: 'Permintaan berhasil diperbarui', data: updatedPermintaan }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memperbarui permintaan' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Akses ditolak. Hanya Admin Sales (Nailah) yang memiliki izin untuk menghapus permintaan.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await connectToDatabase();

    const deletedPermintaan = await Permintaan.findByIdAndDelete(id);

    if (!deletedPermintaan) {
      return NextResponse.json({ message: 'Permintaan tidak ditemukan' }, { status: 404 });
    }

    // Clean up associated BahanBaku record(s)
    try {
      const BahanBaku = (await import('@/lib/models/BahanBaku')).default;
      await BahanBaku.deleteMany({
        $or: [
          { noRequest: deletedPermintaan.noRequest },
          { buyer: deletedPermintaan.buyer }
        ]
      });
    } catch (cleanErr) {
      console.error('Error cleaning up associated BahanBaku:', cleanErr);
    }

    return NextResponse.json({ message: 'Permintaan berhasil dihapus' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting permintaan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat menghapus permintaan' }, { status: 500 });
  }
}
