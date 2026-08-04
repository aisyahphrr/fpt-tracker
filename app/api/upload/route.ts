import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxSs6AMCB5V9iC8naqc57tjDGZHKOGpuvziBKqimTm5A1apAl9WUM1CyKKCCkUKeW5-g/exec';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // 1. Coba Unggah Langsung ke Google Drive via Google Apps Script Web App
    try {
      const gasPayload = {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: base64,
      };

      const gasRes = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasPayload),
      });

      const gasResult = await gasRes.json();

      if (gasResult && gasResult.status === 'success') {
        let fileUrl = gasResult.fileUrl;
        const matchId = fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (matchId && matchId[1]) {
          fileUrl = `https://drive.google.com/file/d/${matchId[1]}/preview`;
        }

        return NextResponse.json({
          message: 'File berhasil diunggah langsung ke Google Drive!',
          fileUrl: fileUrl,
          downloadUrl: gasResult.downloadUrl || gasResult.fileUrl,
          fileName: gasResult.fileName || file.name,
        }, { status: 200 });
      }
    } catch (gasError) {
      console.warn('Google Apps Script Upload Error, fallback to local storage:', gasError);
    }

    // 2. Fallback simpan lokal jika Google Apps Script tidak merespons
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      message: 'File berhasil diunggah',
      fileUrl,
      fileName: file.name,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ message: 'Gagal mengunggah file' }, { status: 500 });
  }
}
