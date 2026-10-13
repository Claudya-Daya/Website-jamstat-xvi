# Panduan menyambungkan formulir pendaftaran

Alur kerjanya: pendaftar mengisi `daftar.html` → data dikirim ke Google Apps Script → data masuk ke Google Sheets, berkas masuk ke Google Drive, pendaftar mendapat nomor dan email konfirmasi.

Semua data tersimpan di akun Google yang Anda pakai pada langkah di bawah. Gunakan akun panitia, bukan akun pribadi.

## A. Pasang di Google (sekitar 10 menit)

1. Buka sheets.google.com, buat **Spreadsheet kosong**, beri nama "Pendaftaran Jambore Statistika XVI".
2. Klik menu **Ekstensi → Apps Script**.
3. Hapus semua kode bawaan, lalu salin seluruh isi file `apps-script/Code.gs` dan tempel di situ.
4. (Opsional) Isi `NOTIFY_EMAIL` di bagian atas dengan email panitia agar mendapat pemberitahuan tiap ada pendaftar baru.
5. Klik ikon disket (Simpan).
6. Klik **Terapkan (Deploy) → Deployment baru**. Klik ikon roda gigi, pilih jenis **Aplikasi web**.
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
7. Klik **Terapkan**. Google akan meminta izin: pilih akun Anda, klik **Lanjutan**, lalu **Buka (nama proyek) (tidak aman)**, lalu **Izinkan**. Layar peringatan ini normal untuk skrip buatan sendiri.
8. Salin **URL aplikasi web** yang berakhiran `/exec`.

## B. Pasang URL di website

1. Buka `daftar.js` di GitHub (ikon pensil).
2. Pada baris `var SCRIPT_URL = "";` tempel URL tadi di antara tanda kutip.
3. Commit. Vercel memperbarui situs otomatis dalam sekitar satu menit.

## C. Uji coba

1. Buka `https://alamat-situs-anda.vercel.app/daftar.html?lomba=seminar`.
2. Isi dengan data uji dan unggah foto kecil.
3. Pastikan: muncul nomor pendaftaran, baris baru ada di Sheet "Pendaftaran", folder "Berkas Pendaftaran Jambore Statistika XVI" terbentuk di Google Drive, dan email konfirmasi masuk.
4. Hapus baris uji dari Sheet sebelum pendaftaran dibuka.

## Kalau mengubah kode Apps Script nanti

Setiap perubahan di `Code.gs` harus diterapkan ulang: **Terapkan → Kelola deployment → ikon pensil → Versi: Versi baru → Terapkan**. URL tetap sama.

## Yang perlu disesuaikan

- Batas anggota per lomba: `COMPETITIONS` di `daftar.js` (`maxAnggota`). Kode Apps Script membatasi maksimal 2 anggota tambahan; ubah angka di `validate_` jika batasnya berbeda.
- Nama lomba dan kode ID: `CONFIG` di `Code.gs`.
- Kolom Status di Sheet bisa Anda ubah manual ("Terverifikasi", "Ditolak") untuk mencatat hasil verifikasi.

## Batasan yang perlu diketahui

- Email konfirmasi memakai kuota Google: sekitar 100 email per hari untuk akun Gmail biasa, 1.500 untuk Google Workspace. Jika pendaftar sangat banyak dalam satu hari, sebagian email bisa tidak terkirim, tetapi data pendaftaran tetap tersimpan.
- Berkas maksimal 2 MB per file, karena dikirim lewat formulir web.
- Formulir memakai kolom jebakan sederhana untuk menahan bot. URL Apps Script bersifat publik, jadi pantau Sheet dari pendaftaran palsu dan hapus manual bila ada.
- Data pribadi peserta (nama, kontak, kartu identitas) tersimpan di Drive dan Sheet Anda. Jangan bagikan tautannya ke publik, dan bagikan akses hanya ke panitia yang perlu.
