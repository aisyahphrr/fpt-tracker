import mongoose from 'mongoose';

const RequestItemSchema = new mongoose.Schema({
  barangId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barang',
    required: false
  },
  name: {
    type: String,
    required: true
  },
  spesifikasi: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  catatan: {
    type: String,
    default: ''
  }
});

const PermintaanSchema = new mongoose.Schema(
  {
    noRequest: {
      type: String,
      required: true,
      unique: true
    },
    tanggal: {
      type: String,
      required: true
    },
    buyer: {
      type: String,
      required: true
    },
    negara: {
      type: String,
      default: ''
    },
    tujuan: {
      type: String,
      default: ''
    },
    jumlahItem: {
      type: Number,
      required: true
    },
    totalQty: {
      type: Number,
      required: true
    },
    items: [RequestItemSchema],
    fileQuotation: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'processed_by_sbb', 'processed_by_pl', 'price_processed_by_sbd', 'rejected', 'quotation_sent'],
      default: 'pending'
    },
    catatan: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

if (mongoose.models.Permintaan) {
  delete (mongoose.models as any).Permintaan;
}

export default mongoose.model('Permintaan', PermintaanSchema);
