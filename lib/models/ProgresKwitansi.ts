import mongoose from 'mongoose';

const ProgresKwitansiSchema = new mongoose.Schema(
  {
    noQuo: {
      type: String,
      required: [true, 'No. Quo wajib diisi'],
    },
    buyer: {
      type: String,
      required: [true, 'Buyer wajib diisi'],
    },
    status: {
      type: String,
      enum: ['Waiting', 'Negotiation', 'Terbit PO', 'Price Deal', 'Rejected'],
      default: 'Waiting',
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

if (mongoose.models.ProgresKwitansi) {
  delete (mongoose.models as any).ProgresKwitansi;
}

export default mongoose.model('ProgresKwitansi', ProgresKwitansiSchema);
