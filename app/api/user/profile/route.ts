import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';
const key = new TextEncoder().encode(JWT_SECRET);

async function getUserIdFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

function checkIsNailahOrAdmin(user: any) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();
  return email.includes('nailah') || name.includes('nailah') || user.role === 'admin';
}

export async function GET() {
  try {
    await connectToDatabase();
    
    let userId = await getUserIdFromToken();
    let user = null;

    if (userId) {
      user = await User.findById(userId).select('-password');
    }

    if (!user) {
      // Fallback: Cari user Nailah
      user = await User.findOne({ $or: [{ email: /nailah/i }, { name: /nailah/i }] }).select('-password');
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        user = await User.create({
          name: 'Nailah',
          email: 'nailah@gmail.com',
          password: hashedPassword,
          role: 'admin',
          posisi: 'Admin Sales',
          telepon: '',
          alamat: '',
          departemen: 'Sales & Inventory'
        });
      }
    }

    // Enforce role & posisi: Jika user Nailah / Admin -> Admin (Admin Sales), selain itu Staff (Staff Sales)
    const isUserAdmin = checkIsNailahOrAdmin(user);
    const correctRole = isUserAdmin ? 'admin' : 'staff';
    const correctPosisi = isUserAdmin ? (user.posisi || 'Admin Sales') : 'Staff Sales';

    let updateNeeded = false;
    const updateObj: any = {};

    if (user.role !== correctRole) {
      updateObj.role = correctRole;
      user.role = correctRole;
      updateNeeded = true;
    }

    if (user.posisi !== correctPosisi) {
      updateObj.posisi = correctPosisi;
      user.posisi = correctPosisi;
      updateNeeded = true;
    }

    if (updateNeeded) {
      await User.findByIdAndUpdate(user._id, updateObj);
    }

    const userObj = user.toObject ? user.toObject() : user;
    userObj.role = correctRole;
    userObj.posisi = correctPosisi;

    return NextResponse.json(userObj, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Gagal mengambil data profil' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, email, telepon, alamat, posisi, departemen } = body;

    await connectToDatabase();
    let userId = await getUserIdFromToken();

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      user = await User.findOne({ $or: [{ email: /nailah/i }, { name: /nailah/i }] });
    }

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const isUserAdmin = checkIsNailahOrAdmin({ email: email || user.email, name: name || user.name, role: user.role });
    const correctRole = isUserAdmin ? 'admin' : 'staff';
    let targetPosisi = isUserAdmin ? (posisi || user.posisi || 'Admin Sales') : 'Staff Sales';

    const updateData: any = { role: correctRole, posisi: targetPosisi };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (telepon !== undefined) updateData.telepon = telepon;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (departemen !== undefined) updateData.departemen = departemen;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    const resultObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    resultObj.role = correctRole;

    return NextResponse.json({ message: 'Profil berhasil diperbarui', user: resultObj }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: error.message || 'Gagal memperbarui profil' }, { status: 500 });
  }
}
