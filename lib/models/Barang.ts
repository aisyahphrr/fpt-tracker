import mongoose from 'mongoose';

const BarangSchema = new mongoose.Schema(
  {
    kode: {
      type: String,
      required: [true, 'Kode barang wajib diisi'],
      unique: true,
    },
    nama: {
      type: String,
      required: [true, 'Nama barang wajib diisi'],
    },
    kategori: {
      type: String,
      required: [true, 'Kategori wajib diisi'],
    },
    satuan: {
      type: String,
      required: [true, 'Satuan wajib diisi (contoh: Pcs, Rim)'],
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

export default mongoose.models.Barang || mongoose.model('Barang', BarangSchema);
