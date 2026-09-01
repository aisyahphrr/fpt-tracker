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
  harga: {
    type: Number,
    default: 0
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
      default: 'pending'
    },
    statusStok: {
      type: String,
      enum: ['Stock', 'Non-Stock'],
      default: 'Stock'
    },
    lastUpdated: {
      type: String,
      default: ''
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
