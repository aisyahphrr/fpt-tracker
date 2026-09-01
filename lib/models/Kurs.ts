import mongoose, { Schema, Document } from 'mongoose';

export interface IKurs extends Document {
  USD: number;
  JPY: number;
  selectedCurrency: 'IDR' | 'USD' | 'JPY';
  lastUpdated: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const KursSchema = new Schema<IKurs>(
  {
    USD: { type: Number, required: true, default: 16200 },
    JPY: { type: Number, required: true, default: 109.85 },
    selectedCurrency: { type: String, default: 'IDR' },
    lastUpdated: { type: String, default: 'Aktif per 30 Mei 2026, 14:30' },
    updatedBy: { type: String, default: 'Aisyah (Direksi)' },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Kurs || mongoose.model<IKurs>('Kurs', KursSchema);
