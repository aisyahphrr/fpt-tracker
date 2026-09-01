import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fpt_tracker_secret_jwt_key_2026';
const key = new TextEncoder().encode(JWT_SECRET);

export const ALL_STANDARD_ACCOUNTS: { [email: string]: { name: string; email: string; role: 'admin' | 'staff' | 'direksi' | 'cabang'; defaultPass: string; posisi: string; departemen: string; canSwitchPortal?: boolean } } = {
  // --- 1. PUSAT (Super Admin & Staff Pusat dengan Fitur Switcher ke Cabang) ---
  'nailah@gmail.com': { name: 'Nailah', email: 'nailah@gmail.com', role: 'admin', defaultPass: '123123', posisi: 'Admin Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },
  'ahlan@gmail.com': { name: 'Ahlan', email: 'ahlan@gmail.com', role: 'staff', defaultPass: '123123', posisi: 'Staff Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },
  'utamihartati@perikananindonesia.co.id': { name: 'Utami Hartati', email: 'utamihartati@perikananindonesia.co.id', role: 'admin', defaultPass: '12345678', posisi: 'Tim Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },
  'agusfriyanto@perikananindonesia.co.id': { name: 'Agus Friyanto', email: 'agusfriyanto@perikananindonesia.co.id', role: 'admin', defaultPass: '12345678', posisi: 'Tim Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },
  'nailahcinthari@perikananindonesia.co.id': { name: 'Nailah Cinthari', email: 'nailahcinthari@perikananindonesia.co.id', role: 'admin', defaultPass: '12345678', posisi: 'Tim Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },
  'robertto@perikananindonesia.co.id': { name: 'Robertto', email: 'robertto@perikananindonesia.co.id', role: 'admin', defaultPass: '12345678', posisi: 'Tim Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },
  'yodiadri@perikananindonesia.co.id': { name: 'Yodi Adri', email: 'yodiadri@perikananindonesia.co.id', role: 'admin', defaultPass: '12345678', posisi: 'Tim Pusat', departemen: 'Kantor Pusat', canSwitchPortal: true },

  // --- 2. DIREKSI CABANG ---
  'aisyah@gmail.com': { name: 'Aisyah', email: 'aisyah@gmail.com', role: 'direksi', defaultPass: '123123', posisi: 'Direksi Cabang', departemen: 'Direksi Cabang' },
  'titikmustikasari@perikananindonesia.co.id': { name: 'Titik Mustikasari', email: 'titikmustikasari@perikananindonesia.co.id', role: 'direksi', defaultPass: '12345678', posisi: 'Direksi Cabang', departemen: 'Direksi Cabang' },
  'errintopardede@perikananindonesia.co.id': { name: 'Errinto Pardede', email: 'errintopardede@perikananindonesia.co.id', role: 'direksi', defaultPass: '12345678', posisi: 'Direksi Cabang', departemen: 'Direksi Cabang' },

  // --- 3. KANTOR CABANG (24 Kantor Cabang Daerah) ---
  'cabang@gmail.com': { name: 'Staff Cabang', email: 'cabang@gmail.com', role: 'cabang', defaultPass: '123123', posisi: 'Staff Cabang', departemen: 'Kantor Cabang' },
  'jakarta@perikananindonesia.co.id': { name: 'Cabang Jakarta', email: 'jakarta@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Jakarta', departemen: 'Cabang Jakarta' },
  'belawan@perikananindonesia.co.id': { name: 'Cabang Belawan', email: 'belawan@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Belawan', departemen: 'Cabang Belawan' },
  'brondong@perikananindonesia.co.id': { name: 'Cabang Brondong', email: 'brondong@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Brondong', departemen: 'Cabang Brondong' },
  'tegal@perikananindonesia.co.id': { name: 'Cabang Tegal', email: 'tegal@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Tegal', departemen: 'Cabang Tegal' },
  'pati@perikananindonesia.co.id': { name: 'Cabang Pati', email: 'pati@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Pati', departemen: 'Cabang Pati' },
  'bacan@perikananindonesia.co.id': { name: 'Cabang Bacan', email: 'bacan@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Bacan', departemen: 'Cabang Bacan' },
  'subang@perikananindonesia.co.id': { name: 'Cabang Subang', email: 'subang@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Subang', departemen: 'Cabang Subang' },
  'pekalongan@perikananindonesia.co.id': { name: 'Cabang Pekalongan', email: 'pekalongan@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Pekalongan', departemen: 'Cabang Pekalongan' },
  'rembang@perikananindonesia.co.id': { name: 'Cabang Rembang', email: 'rembang@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Rembang', departemen: 'Cabang Rembang' },
  'lampulo@perikananindonesia.co.id': { name: 'Cabang Lampulo', email: 'lampulo@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Lampulo', departemen: 'Cabang Lampulo' },
  'lampulo@perikananindoensia.co.id': { name: 'Cabang Lampulo', email: 'lampulo@perikananindoensia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Lampulo', departemen: 'Cabang Lampulo' },
  'padang@perikananindonesia.co.id': { name: 'Cabang Padang', email: 'padang@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Padang', departemen: 'Cabang Padang' },
  'bitung@perikananindonesia.co.id': { name: 'Cabang Bitung', email: 'bitung@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Bitung', departemen: 'Cabang Bitung' },
  'sorong@perikananindonesia.co.id': { name: 'Cabang Sorong', email: 'sorong@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Sorong', departemen: 'Cabang Sorong' },
  'ambon@perikananindonesia.co.id': { name: 'Cabang Ambon', email: 'ambon@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Ambon', departemen: 'Cabang Ambon' },
  'pemangkat@perikananindonesia.co.id': { name: 'Cabang Pemangkat', email: 'pemangkat@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Pemangkat', departemen: 'Cabang Pemangkat' },
  'mayangan@perikananindonesia.co.id': { name: 'Cabang Mayangan', email: 'mayangan@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Mayangan', departemen: 'Cabang Mayangan' },
  'bali@perikananindonesia.co.id': { name: 'Cabang Bali', email: 'bali@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Bali', departemen: 'Cabang Bali' },
  'surabaya@perikananindonesia.co.id': { name: 'Cabang Surabaya', email: 'surabaya@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Surabaya', departemen: 'Cabang Surabaya' },
  'prigi@perikananindonesia.co.id': { name: 'Cabang Prigi', email: 'prigi@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Prigi', departemen: 'Cabang Prigi' },
  'tarakan@perikananindonesia.co.id': { name: 'Cabang Tarakan', email: 'tarakan@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Tarakan', departemen: 'Cabang Tarakan' },
  'gorontalo@perikananindonesia.co.id': { name: 'Cabang Gorontalo', email: 'gorontalo@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Gorontalo', departemen: 'Cabang Gorontalo' },
  'makassar@perikananindonesia.co.id': { name: 'Cabang Makassar', email: 'makassar@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Makassar', departemen: 'Cabang Makassar' },
  'bengkayang@perikananindonesia.co.id': { name: 'Cabang Bengkayang', email: 'bengkayang@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Bengkayang', departemen: 'Cabang Bengkayang' },
  'tanjungpandan@perikananindonesia.co.id': { name: 'Cabang Tanjung Pandan', email: 'tanjungpandan@perikananindonesia.co.id', role: 'cabang', defaultPass: '12345678', posisi: 'Kantor Cabang Tanjung Pandan', departemen: 'Cabang Tanjung Pandan' },
};

export async function POST(req: Request) {
  try {
    const { email, password, portalChoice } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi' }, { status: 400 });
    }

    await connectToDatabase();

    const targetEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: targetEmail });
    const standardConfig = ALL_STANDARD_ACCOUNTS[targetEmail];

    // Auto-create / update standard account if password matches its configured default
    if (standardConfig && (password === standardConfig.defaultPass || password === '12345678' || password === '123123')) {
      const hashedPassword = await bcrypt.hash(password, 10);
      if (!user) {
        user = await User.create({
          name: standardConfig.name,
          email: standardConfig.email,
          role: standardConfig.role,
          posisi: standardConfig.posisi,
          departemen: standardConfig.departemen,
          password: hashedPassword,
          telepon: '08123456789',
          alamat: 'Indonesia',
        });
      } else {
        user.name = standardConfig.name;
        user.role = standardConfig.role;
        user.posisi = standardConfig.posisi;
        user.departemen = standardConfig.departemen;
        user.password = hashedPassword;
        await user.save();
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'Email atau password salah' }, { status: 401 });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Email atau password salah' }, { status: 401 });
    }

    const canSwitch = standardConfig?.canSwitchPortal || user.role === 'admin' || user.role === 'staff';
    const effectiveRole = user.role;

    // Create JWT Token using jose
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: effectiveRole,
      name: user.name,
      canSwitchPortal: canSwitch,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(key);

    const chosenPortal = portalChoice || (canSwitch ? 'pusat' : 'cabang');

    const response = NextResponse.json({ 
      message: 'Login berhasil',
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        canSwitchPortal: canSwitch,
        portal: chosenPortal,
      } 
    }, { status: 200 });

    // Set auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 hari
    });

    // Set portal choice cookie if Pusat user
    if (canSwitch) {
      response.cookies.set({
        name: 'portal_mode',
        value: chosenPortal,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    } else {
      response.cookies.set({
        name: 'portal_mode',
        value: 'cabang',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
