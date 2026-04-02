# Dokumentasi Database - User API

Dokumen ini menjelaskan struktur database, aturan penamaan, dan prosedur migrasi untuk proyek `template-yogiravelware`.

## Informasi Umum
- **Engine Database**: PostgreSQL
- **Nama Database**: `sop_db` (singular snake_case)
- **Konvensi Nama Tabel**: Plural snake_case (contoh: `users`)
- **Konvensi Nama Kolom**: Singular snake_case (contoh: `email`)

---

## Skema Tabel

### 1. Tabel `users`
Tabel ini digunakan untuk menyimpan informasi dasar pengguna aplikasi.

| Nama Kolom   | Tipe Data      | Nullable | Default             | Keterangan |
| :---         | :---           | :---     | :---                | :--- |
| `id`         | `SERIAL`       | NO       | -                   | Primary Key, Auto-increment |
| `name`       | `VARCHAR(255)` | NO       | -                   | Nama lengkap pengguna |
| `email`      | `VARCHAR(255)` | NO       | -                   | Email unik (digunakan untuk login)   |
| `password`   | `VARCHAR(255)` | NO       | -                   | Hash password (BCrypt) |
| `created_at` | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | Waktu pembuatan akun |

---

## Manajemen Database & Migrasi

Sesuai dengan **Prosedur SOP Poin 4**, proyek ini menggunakan **Sequelize ORM** untuk manajemen model dan migrasi skema database.

### 1. Membuat Migrasi & Seeder Baru
Gunakan perintah berikut jika ada perubahan skema atau penambahan data awal:
```bash
# Perintah manual menggunakan node-pg-migrate (untuk skema)
node-pg-migrate create <nama-migrasi>

# Perintah manual menggunakan sequelize-cli (untuk data/seeder)
npx sequelize-cli seed:generate --name <nama-seeder>
```

### 2. Menjalankan Migrasi & Seeder
Pastikan database sudah dibuat di PostgreSQL, lalu jalankan:
```bash
# Terapkan perubahan skema
npm run migrate:up

# Isi data awal (seeder)
npm run seed:up

# Batalkan data awal (rollback seeder)
npm run seed:down
```

### 3. File Migrasi Terakhir
Daftar file migrasi dapat ditemukan di direktori `src/migrations/`. 
Contoh: `1711952000000-create-users-table.js`

---

## Aturan Penting bagi Tim
1. **Dilarang keras** mengubah skema database secara langsung melalui GUI (seperti pgAdmin atau DBeaver). Semua perubahan **WAJIB** melalui file migrasi.
2. Setiap kali ada perubahan skema, pastikan untuk memperbarui dokumentasi ini agar tetap sinkron dengan skema di database.
3. Selalu sertakan file migrasi baru dalam Pull Request (PR) ke branch `dev`.
