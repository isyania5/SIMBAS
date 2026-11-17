# SIMBAS

SIMBAS (Sistem Informasi Manajemen Bank Sampah) adalah aplikasi web berbahasa Indonesia untuk petugas dan nasabah. Aplikasi menggunakan Next.js App Router, TypeScript, Tailwind CSS, Auth.js Credentials (rilis stabil NextAuth.js v4), Drizzle ORM, dan PostgreSQL Neon.

## Modul

- **Admin/petugas:** dashboard, data nasabah dan akun, katalog jenis/harga sampah, setoran, penarikan, dan laporan transaksi.
- **Warga/nasabah:** dashboard saldo pribadi dan riwayat transaksi pribadi.
- Tidak ada pendaftaran mandiri. Petugas membuat dan menonaktifkan akun nasabah.
- Harga setoran disimpan sebagai snapshot; saldo dihitung dari transaksi yang tersimpan.

## Menjalankan secara lokal

Prasyarat: Node.js 20.19+ atau 22+, npm, dan database PostgreSQL Neon.

1. Pasang dependensi:

   ```powershell
   npm install
   ```

2. Salin `.env.example` menjadi `.env`, lalu isi connection string pooled `DATABASE_URL`, connection string langsung `DATABASE_URL_UNPOOLED`, dan buat `AUTH_SECRET` acak. Jangan commit `.env`.

   ```powershell
   Copy-Item .env.example .env
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Tempel hasil generator sebagai `AUTH_SECRET` pada `.env`. Aplikasi memakai `DATABASE_URL` pooled; migrasi dan bootstrap admin memakai `DATABASE_URL_UNPOOLED` langsung.

3. Buat dan terapkan migrasi:

   ```powershell
   npm run db:generate
   npm run db:migrate
   ```

4. Buat admin pertama secara lokal melalui terminal interaktif:

   ```powershell
   npm run admin:create
   ```

   Skrip meminta nama, email, serta kata sandi yang dimasukkan secara tersembunyi. Kata sandi minimal 12 dan maksimal 72 byte UTF-8. Skrip hanya dapat membuat admin pertama dan tidak menyediakan endpoint setup publik.

5. Jalankan aplikasi:

   ```powershell
   npm run dev
   ```

   Buka `http://localhost:3000`. Petugas membuat akun warga dari menu **Data nasabah**.

## Pemeriksaan

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Migrasi dan pembuatan admin memerlukan kredensial Neon yang valid. Detail konfigurasi produksi terdapat di [DEPLOYMENT.md](./DEPLOYMENT.md).

## Rute aplikasi

| Halaman | Rute |
| --- | --- |
| Login | `/login` |
| Dashboard admin | `/dashboard` |
| Data nasabah | `/nasabah` |
| Jenis dan harga sampah | `/jenis-sampah` |
| Setoran sampah | `/setoran` |
| Penarikan tabungan | `/penarikan` |
| Laporan transaksi | `/laporan` |
| Dashboard nasabah | `/warga/dashboard` |
| Riwayat nasabah | `/warga/riwayat` |
