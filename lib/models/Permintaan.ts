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
    status: {
      type: String,
      enum: ['pending', 'quotation_sent', 'signing_mou', 'selesai', 'cancelled'],
      default: 'pending'
    },
    catatan: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Permintaan || mongoose.model('Permintaan', PermintaanSchema);
