import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  nama: string;
  lokasi: string;
  komoditas: string;
  spesifikasi?: string;
  picKontak: string;
  telepon?: string;
  catatan?: string;
  lastUpdated?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    nama: { type: String, required: true },
    lokasi: { type: String, required: true },
    komoditas: { type: String, required: true },
    spesifikasi: { type: String, default: '' },
    picKontak: { type: String, required: true },
    telepon: { type: String, default: '' },
    catatan: { type: String, default: '' },
    lastUpdated: { type: String, default: '' },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
