import mongoose from 'mongoose';

const MutasiSchema = new mongoose.Schema({
  barangId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barang',
    required: true
  },
  tanggal: {
    type: Date,
    required: true,
    default: Date.now
  },
  jenis: {
    type: String,
    enum: ['masuk', 'keluar'],
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  keterangan: {
    type: String,
    required: false
  },
  referensiId: {
    type: String, // Bisa diisi ID Permintaan atau lainnya agar bisa dilacak
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.models.Mutasi || mongoose.model('Mutasi', MutasiSchema);
