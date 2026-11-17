# Layanan Tata Usaha SMAN 104 Jakarta - Frontend

Antarmuka web portal layanan administrasi Tata Usaha SMA Negeri 104 Jakarta. Aplikasi ini hanya berisi tampilan; data dan autentikasi dilayani oleh repo backend: **<URL-REPO-BACKEND>**.

## Fitur

**Publik (tanpa login)**
- Beranda, daftar layanan, Surat Keputusan (SK), pengumuman, denah sekolah
- Cek status pengajuan memakai nomor pengajuan
- Halaman Kontak dengan FAQ yang bisa dicari

**Siswa/orang tua dan guru/staf**
- Mengajukan layanan (dengan lampiran PDF/JPG/PNG), memantau status, memperbaiki dan mengirim ulang pengajuan
- Ganti kata sandi

**Dashboard staf TU** (`/tu`): menu muncul sesuai izin akun
- Antrian pengajuan, kelola SK, pegawai, pengumuman, banner, serta kontak & FAQ

**Dashboard admin** (`/admin`)
- Kelola akun (buat, ubah, aktif/nonaktif, buka kunci, reset sandi, atur izin per modul)
- Log audit

## Teknologi

React 19, Vite 8, Tailwind CSS 4, React Router 7, Heroicons.

## Prasyarat

- Node.js 20.19+ atau 22.12+ (disarankan versi LTS terbaru) dan npm
- Backend berjalan di `http://localhost:8000` (lihat README repo backend), **atau** pakai mode demo di bawah

## Instalasi dan menjalankan (lokal)

```bash
git clone <URL-REPO-FRONTEND>
cd sman-frontend
npm install
npm run dev
```

Buka `http://localhost:5173`.

Secara bawaan aplikasi memanggil API di `http://localhost:8000/api`. Untuk mengubahnya, buat file `.env.local` (tidak ikut Git) di folder proyek:

```env
VITE_API_URL=http://localhost:8000/api
```

> Setelah mengubah file `.env`, hentikan `npm run dev` (Ctrl+C) lalu jalankan lagi.

### Mode demo (tanpa backend)

Untuk sekadar melihat tampilan tanpa menjalankan backend, isi `.env.local`:

```env
VITE_DEMO_LOGIN=true
```

Pada mode ini login menerima isian apa saja, dan menu mengikuti peran yang dipilih. Dashboard yang membutuhkan data server tidak berfungsi. **Jangan pernah mengaktifkannya di produksi.**

## Variabel lingkungan

| Variabel | Fungsi | Contoh |
|---|---|---|
| `VITE_API_URL` | Alamat dasar API backend (diakhiri `/api`) | `https://nama-backend.up.railway.app/api` |
| `VITE_DEMO_LOGIN` | `true` = mode demo tanpa backend. Kosongkan atau `false` untuk normal. | `false` |

Semua variabel berawalan `VITE_` **terbuka bagi siapa pun** karena ikut masuk ke hasil build. Jangan menaruh kata sandi, token, atau kunci rahasia di sini.

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan dengan hot reload |
| `npm run build` | Build produksi ke folder `dist/` (otomatis menjalankan `npm run pegawai` lebih dulu) |
| `npm run preview` | Menjalankan hasil build secara lokal |
| `npm run lint` | Memeriksa kode dengan ESLint |
| `npm run pegawai` | Membuat `src/data/pegawai.js` dari `data/Daftar_Nama_Tendik_Guru.xlsx` |

### Catatan data pegawai

`npm run build` membaca `data/Daftar_Nama_Tendik_Guru.xlsx` (sheet yang namanya memuat "guru" dan "tendik", dengan kolom `NAMA` dan `JABATAN`). **Build gagal jika file ini hilang atau formatnya berubah.** Data ini dipakai untuk mode demo. Pada mode normal, data pegawai diambil dari backend (diimpor lewat dashboard TU).

## Struktur folder

```
sman-frontend/
├─ data/                 Excel sumber data pegawai
├─ scripts/              buat-pegawai.mjs (xlsx -> src/data/pegawai.js)
├─ public/               aset statis
├─ src/
│  ├─ main.jsx           titik masuk + provider (Toast, Konfirmasi, Sandi ulang, Status aplikasi)
│  ├─ App.jsx            daftar seluruh rute
│  ├─ pages/             halaman publik, dashboard TU, dan dashboard admin
│  ├─ components/        komponen bersama (Navbar, Footer, Modal, Field, dsb.)
│  ├─ context/           status login, notifikasi, dialog konfirmasi, konfirmasi sandi
│  ├─ lib/               api.js (komunikasi ke backend), validasi, hook bantu
│  └─ data/              data statis dan cadangan
├─ vercel.json           pengalihan SPA ke index.html
└─ vite.config.js
```

## Cara kerja singkat

- Semua panggilan ke backend lewat fungsi `api()` di `src/lib/api.js`, yang otomatis menyertakan token `Authorization: Bearer ...`.
- Token disimpan di `sessionStorage` (hilang saat tab ditutup). Jika server menjawab 401 (token kedaluwarsa atau akun dinonaktifkan), pengguna otomatis keluar.
- Untuk aksi sensitif (mis. menghapus data), server meminta konfirmasi kata sandi; kotak konfirmasi muncul otomatis.
- Menu dan halaman dashboard disaring berdasarkan `role`, `is_admin`, dan daftar `izin` dari backend. Itu hanya pengaturan tampilan; **pengaman sebenarnya ada di backend**.

## Deploy ke Vercel

1. Impor repo ini di Vercel (framework terdeteksi sebagai Vite).
2. Build command `npm run build`, output directory `dist`.
3. Tambahkan Environment Variable: `VITE_API_URL=https://<domain-backend>/api`.
4. Deploy. File `vercel.json` sudah mengatur agar semua alamat diarahkan ke `index.html` (React Router).
5. **Penting:** daftarkan domain Vercel Anda di `allowed_origins` pada `config/cors.php` di repo backend, lalu deploy ulang backend. Tanpa ini, browser memblokir panggilan API (error CORS).

## Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `Failed to fetch` atau error CORS di Console | Backend belum jalan, `VITE_API_URL` salah, atau domain frontend belum masuk `allowed_origins` di backend |
| Halaman 404 saat di-refresh di Vercel | Pastikan `vercel.json` ikut ter-commit |
| `npm run build` gagal membaca Excel | Pastikan `data/Daftar_Nama_Tendik_Guru.xlsx` ada dan masih punya sheet guru/tendik berikut kolom `NAMA` |
| Perubahan `.env` tidak terbaca | Restart `npm run dev` |
| Port 5173 terpakai | Tutup proses lama, atau jalankan `npm run dev -- --port 5174` (lalu tambahkan origin itu di CORS backend) |
| Layar putih setelah login | Buka Console (F12) dan baca pesan merahnya; biasanya data dari API tidak sesuai harapan |

## Berkontribusi

```bash
git checkout -b fitur/nama-fitur
# ... kerjakan, lalu:
npm run lint
git add .
git commit -m "feat: deskripsi singkat perubahan"
git push origin fitur/nama-fitur
```

Buka Pull Request ke cabang utama. Jangan melakukan commit langsung ke cabang utama.

## Tim

<isi nama anggota kelompok>
