import mongoose from 'mongoose';

const PengirimanSchema = new mongoose.Schema(
  {
    buyer: {
      type: String,
      required: [true, 'Buyer wajib diisi'],
    },
    noPo: {
      type: String,
      required: [true, 'No. PO wajib diisi'],
    },
    dokumen: {
      invoice: { type: String, default: '' },
      awb: { type: String, default: '' },
      suratJalan: { type: String, default: '' },
      tellySheet: { type: String, default: '' },
      fotoProduct: { type: String, default: '' },
      tandaTerima: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Pemuatan Ikan', 'Pengiriman', 'Diterima', 'Reject'],
      default: 'Pemuatan Ikan',
    },
    keterangan: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Pengiriman) {
  delete (mongoose.models as any).Pengiriman;
}

export default mongoose.model('Pengiriman', PengirimanSchema);
