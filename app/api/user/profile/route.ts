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

export async function GET() {
  try {
    await connectToDatabase();
    
    const cookieStore = await cookies();
    const portalModeCookie = cookieStore.get('portal_mode')?.value;
    
    let userId = await getUserIdFromToken();
    let user = null;

    if (userId) {
      user = await User.findById(userId).select('-password');
    }

    if (!user) {
      // Fallback
      user = await User.findOne({ email: 'nailah@gmail.com' }).select('-password');
      if (!user) {
        const hashedPassword = await bcrypt.hash('123123', 10);
        user = await User.create({
          name: 'Nailah',
          email: 'nailah@gmail.com',
          password: hashedPassword,
          role: 'admin',
          posisi: 'Admin Pusat',
          telepon: '08123456789',
          alamat: 'Jakarta',
          departemen: 'Kantor Pusat'
        });
      }
    }

    const email = (user.email || '').toLowerCase().trim();
    const isPusat = user.role === 'admin' || user.role === 'staff' || email.includes('nailah') || email.includes('ahlan') || email.includes('utamihartati') || email.includes('agusfriyanto') || email.includes('nailahcinthari') || email.includes('robertto') || email.includes('yodiadri');
    const isDireksi = user.role === 'direksi' || email.includes('aisyah') || email.includes('titikmustikasari') || email.includes('errintopardede');

    let effectiveRole = user.role;
    if (isPusat) effectiveRole = user.role || 'admin';
    else if (isDireksi) effectiveRole = 'direksi';
    else effectiveRole = 'cabang';

    const userObj: any = user.toObject ? user.toObject() : { ...user };
    userObj.role = effectiveRole;
    userObj.canSwitchPortal = isPusat;
    userObj.portalMode = isPusat ? (portalModeCookie || 'pusat') : 'cabang';

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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (telepon !== undefined) updateData.telepon = telepon;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (posisi !== undefined) updateData.posisi = posisi;
    if (departemen !== undefined) updateData.departemen = departemen;

    const updatedUser: any = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    const resultObj = updatedUser?.toObject ? updatedUser.toObject() : updatedUser;

    return NextResponse.json({ message: 'Profil berhasil diperbarui', user: resultObj }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: error.message || 'Gagal memperbarui profil' }, { status: 500 });
  }
}
