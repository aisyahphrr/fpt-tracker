import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password should be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'staff'],
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
      default: 'Admin Sales',
    },
    departemen: {
      type: String,
      default: 'Sales & Inventory',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
