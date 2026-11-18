# Deployment SIMBAS ke GitHub, Neon, dan Vercel

Panduan ini menggunakan GitHub dan dashboard Vercel. Domain `vercel.app` dibuat otomatis oleh Vercel setelah deployment pertama.

## 1. Unggah proyek ke GitHub

1. Buat repository baru di GitHub.
2. Dari folder proyek, inisialisasi Git jika perlu, lalu commit dan push source code.
3. Pastikan `.env`, `.env.local`, `.env.production`, dan semua kredensial tidak ikut di-commit. `.gitignore` mengabaikan file environment; hanya `.env.example` yang boleh masuk repository.
4. Jangan menaruh URL database atau kata sandi di source code, issue, maupun log deployment.

## 2. Buat database Neon

1. Buat project PostgreSQL di dashboard Neon.
2. Ambil connection string pooled untuk aplikasi dan connection string langsung (tanpa `-pooler`) untuk migrasi/bootstrap; simpan keduanya sebagai secret. Gunakan branch produksi untuk deployment produksi.
3. Connection string umumnya berisi `sslmode=require`; jangan membagikannya atau memasukkannya ke GitHub.

## 3. Import repository di Vercel

1. Pilih **Add New → Project** di dashboard Vercel.
2. Hubungkan akun GitHub dan import repository SIMBAS.
3. Biarkan framework terdeteksi sebagai Next.js dan gunakan root directory proyek.
4. Sebelum deployment pertama, isi environment variables berikut di **Project Settings → Environment Variables**:

   | Nama | Nilai |
   | --- | --- |
   | `DATABASE_URL` | Connection string pooled Neon |
   | `AUTH_SECRET` | Secret acak minimal 32 byte; buat sendiri, jangan gunakan nilai contoh |
   | `AUTH_TRUST_HOST` | `true` (percaya host yang diteruskan platform Vercel) |

   Tambahkan variables ke environment Production. Tambahkan ke Preview/Development bila deployment tersebut memang akan menggunakan database yang sesuai. Jangan menggunakan database produksi untuk preview yang tidak tepercaya.

## 4. Terapkan migrasi database

Jalankan migrasi **sekali secara eksplisit sebelum deployment produksi**, bukan sebagai langkah otomatis pada setiap build Vercel. Gunakan source code dari commit yang akan di-deploy dan connection string Neon yang sama dengan Production.

Di PowerShell pada komputer tepercaya, masukkan URL langsung Neon (tanpa `-pooler`) dengan prompt tersembunyi, lalu terapkan migrasi:

```powershell
$secure = Read-Host "DATABASE_URL_UNPOOLED Neon (langsung, tanpa -pooler)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:DATABASE_URL_UNPOOLED = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  npm ci
  npm run db:migrate
  if ($LASTEXITCODE -ne 0) { throw "Migrasi gagal; deployment harus dihentikan." }
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Item Env:DATABASE_URL_UNPOOLED -ErrorAction SilentlyContinue
}
```

Pastikan folder migrasi `drizzle/` berisi file SQL hasil `npm run db:generate` dan ikut di-commit. Jangan menjalankan `drizzle-kit push` pada database produksi; gunakan migrasi yang direview dan tersimpan di repository.

## 5. Buat admin pertama

Gunakan connection string langsung Neon sementara hanya pada terminal tepercaya. Perintah ini meminta kata sandi tanpa menampilkannya dan tidak membuat endpoint setup publik:

```powershell
$secure = Read-Host "DATABASE_URL_UNPOOLED Neon (langsung, tanpa -pooler)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:DATABASE_URL_UNPOOLED = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  npm run admin:create
  if ($LASTEXITCODE -ne 0) { throw "Admin pertama belum berhasil dibuat." }
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Item Env:DATABASE_URL_UNPOOLED -ErrorAction SilentlyContinue
}
```

Jalankan sesudah migrasi. Prosedur ini hanya menerima pembuatan admin pertama; skrip mengambil advisory lock PostgreSQL untuk mencegah dua proses bootstrap membuat admin bersamaan. Simpan kata sandi melalui pengelola rahasia yang tepercaya.
Kata sandi harus minimal 8 karakter dan maksimal 72 byte UTF-8.

## 6. Deploy

1. Kembali ke project Vercel dan jalankan deployment dari branch GitHub yang dipilih, atau push commit untuk memicu deployment.
2. Periksa build logs. Build tidak menjalankan migrasi atau membuat akun.
3. Setelah deployment berhasil, buka domain `vercel.app` yang diberikan Vercel dan masuk dengan kredensial admin yang baru dibuat.
4. Di aplikasi, buat jenis sampah dan akun nasabah sebelum mencoba pencatatan transaksi.
5. Uji setoran, nilai setoran, saldo, penolakan penarikan melebihi saldo, riwayat warga, filter laporan, dan cetak browser.

## 7. Secret dan operasi

- Rotasi `AUTH_SECRET` akan membatalkan sesi yang sedang aktif; tetapkan nilai rahasia yang sama untuk Production pada semua deployment.
- Jangan menambahkan `DATABASE_URL` atau kata sandi admin ke repository, screenshot, issue, atau output CI.
- Preview Vercel sebaiknya memakai Neon branch terpisah dan akun uji.
- Untuk perubahan skema berikutnya: buat migrasi dengan `npm run db:generate`, tinjau file SQL, commit migrasi, terapkan ke database target satu kali dengan `npm run db:migrate`, lalu deploy.
- Database Neon aktif dan pembuatan akun admin pertama membutuhkan secret milik pemilik project. Keduanya tidak dapat diselesaikan dari repository tanpa kredensial tersebut.
