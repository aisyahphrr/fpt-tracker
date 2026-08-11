import mongoose from 'mongoose';

const BarangSchema = new mongoose.Schema(
  {
    kode: {
      type: String,
      required: [true, 'Kode barang wajib diisi'],
    },
    nama: {
      type: String,
      required: [true, 'Nama barang wajib diisi'],
    },
    cabang: {
      type: String,
      default: 'Jakarta',
    },
    kategori: {
      type: String,
      required: [true, 'Kategori wajib diisi'],
    },
    satuan: {
      type: String,
      required: [true, 'Satuan wajib diisi (contoh: Kg, Ton)'],
    },
    deskripsi: {
      type: String,
      default: '',
    },
    stokAwal: {
      type: Number,
      default: 0,
    },
    barangMasuk: {
      type: Number,
      default: 0,
    },
    barangKeluar: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['aktif', 'nonaktif'],
      default: 'aktif',
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Barang) {
  delete (mongoose.models as any).Barang;
}

export default mongoose.model('Barang', BarangSchema);
