import mongoose from 'mongoose';

const SumberSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
  namaSumber: { type: String, default: '' },
  cabang: { type: String, default: '' },
  supplier: { type: String, default: '' },
  qty: { type: Number, default: 0 },
  spesifikasi: { type: String, default: '' },
  size: { type: String, default: '' },
  hargaBahanBaku: { type: Number, default: 0 },
  hargaProses: { type: Number, default: 0 },
  hargaLogistik: { type: Number, default: 0 },
  harga: { type: Number, default: 0 }, // Harga Akhir per Kg = BB + Proses + Logistik
  selected: { type: Boolean, default: false },
  status: { type: String, default: 'Menunggu' }, // 'Menunggu' | 'Disetujui' | 'Ditolak'
  lampiran: { type: String, default: '' },
  catatan: { type: String, default: '' },
  lastUpdated: { type: String, default: '' },
}, { _id: false });

const BahanBakuSchema = new mongoose.Schema(
  {
    noRequest: { type: String, required: true },
    barang: { type: String, default: '' }, // Pusat legacy field
    buyer: { type: String, default: '' },
    negara: { type: String, default: '' },
    komoditas: { type: String, default: '' },
    qty: { type: Number, default: 1 }, // Pusat legacy field
    qtyPermintaan: { type: Number, default: 1 },
    hargaBuyer: { type: Number, default: 0 },
    incoterm: { type: String, default: 'FOB' },
    status: { type: String, default: 'Menunggu' },
    sumber: [SumberSchema],
    filePerhitungan: { type: String, default: '' },
    linkFotoGdrive: { type: String, default: '' },
    linkVideoGdrive: { type: String, default: '' },
    lastUpdated: { type: String, default: '' },
  },
  {
    timestamps: true,
    strict: false,
  }
);

if (mongoose.models.BahanBaku) {
  delete (mongoose.models as any).BahanBaku;
}

export default mongoose.model('BahanBaku', BahanBakuSchema);


