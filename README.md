# ETHEREA – Jambore Statistika XVI

Website statis (HTML, CSS, JS). Tidak perlu build atau npm.

## Formulir pendaftaran
Halaman `daftar.html` mengirim data ke Google Sheets lewat Google Apps Script. Langkah pemasangan ada di `PANDUAN-FORMULIR.md`.

## Isi yang perlu Anda ganti
Cari `data-todo` di `index.html`:
- Tautan Guidebook tiap lomba (5 tombol "Guidebook")
- `SCRIPT_URL` di `daftar.js` (lihat panduan formulir)
- Email, Instagram, dan WhatsApp di footer
- Bagian "Segera diumumkan" di Seminar dan Jadwal: isi tanggal, tempat, pembicara

Warna ada di bagian `:root` pada `style.css`.

## Deploy ke Vercel
**Lewat GitHub (disarankan)**
1. Buat repositori baru di GitHub, unggah semua file di folder ini.
2. Buka vercel.com, klik Add New, lalu Project, dan impor repositori tadi.
3. Framework Preset: Other. Kosongkan Build Command dan Output Directory. Klik Deploy.

**Lewat CLI**
```
npm i -g vercel
cd etherea
vercel --prod
```
