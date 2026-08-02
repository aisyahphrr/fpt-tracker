import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
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

function isNailah(email?: string) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e.includes('nailah');
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
      user = await User.findOne({ email: /nailah/i }).select('-password');
      
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

    // Enforce role & posisi: Hanya Nailah yang Admin (Admin Sales), selain Nailah PASTI Staff (Staff Sales)
    const isUserAdmin = isNailah(user.email);
    const correctRole = isUserAdmin ? 'admin' : 'staff';

    let updateNeeded = false;
    const updateObj: any = {};

    if (user.role !== correctRole) {
      updateObj.role = correctRole;
      user.role = correctRole;
      updateNeeded = true;
    }

    if (!isUserAdmin && (!user.posisi || user.posisi === 'Admin Sales')) {
      updateObj.posisi = 'Staff Sales';
      user.posisi = 'Staff Sales';
      updateNeeded = true;
    }

    if (updateNeeded) {
      await User.findByIdAndUpdate(user._id, updateObj);
    }

    const userObj = user.toObject ? user.toObject() : user;
    userObj.role = correctRole;
    if (!isUserAdmin && (!userObj.posisi || userObj.posisi === 'Admin Sales')) {
      userObj.posisi = 'Staff Sales';
    }

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
      user = await User.findOne({ email: /nailah/i });
    }

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const isUserAdmin = isNailah(user.email || email);
    const correctRole = isUserAdmin ? 'admin' : 'staff';
    let targetPosisi = posisi;
    if (!isUserAdmin && (!targetPosisi || targetPosisi === 'Admin Sales')) {
      targetPosisi = 'Staff Sales';
    }

    const updateData: any = { role: correctRole };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (telepon !== undefined) updateData.telepon = telepon;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (targetPosisi !== undefined) updateData.posisi = targetPosisi;
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
