import mongoose from 'mongoose';

const SumberSchema = new mongoose.Schema({
  namaSumber: { type: String, required: true },
  harga: { type: Number, default: 0 },
  size: { type: String, default: '' },
  spesifikasi: { type: String, default: '' },
});

const BahanBakuSchema = new mongoose.Schema(
  {
    noRequest: { type: String, required: true },
    barang: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    sumber: [SumberSchema],
    filePerhitungan: { type: String, default: '' },
    linkFotoGdrive: { type: String, default: '' },
    linkVideoGdrive: { type: String, default: '' },
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
