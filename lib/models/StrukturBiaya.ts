import mongoose from 'mongoose';

const StrukturBiayaSchema = new mongoose.Schema(
  {
    noRequest: { type: String, required: true },
    buyer: { type: String, required: true },
    logistik: { type: String, default: '' },
    filePerhitungan: { type: String, default: '' },
    catatan: { type: String, default: '' },
  },
  {
    timestamps: true,
    strict: false,
  }
);

if (mongoose.models.StrukturBiaya) {
  delete (mongoose.models as any).StrukturBiaya;
}

export default mongoose.model('StrukturBiaya', StrukturBiayaSchema);
