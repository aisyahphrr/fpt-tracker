import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'direksi', 'cabang'],
      default: 'staff',
    },
    telepon: {
      type: String,
      default: '',
    },
    alamat: {
      type: String,
      default: '',
    },
    posisi: {
      type: String,
      default: 'Staff',
    },
    departemen: {
      type: String,
      default: 'Operasional',
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Prevent caching issues in Next.js development
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', UserSchema);
