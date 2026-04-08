# Panduan Lengkap Migrasi & Setup Microsoft SQL Server (MSSQL)

Dokumen ini berisi panduan menyeluruh mulai dari setup alat manajemen (SSMS) hingga rencana teknis migrasi kode dari PostgreSQL ke MSSQL agar perintah `npm run migrate` dan `npm run seed` tetap berfungsi.

---

## BAGIAN 1: Setup & Penggunaan SSMS (SQL Server Management Studio)

Setelah menginstal SQL Server 2019, Anda memerlukan SSMS sebagai antarmuka visual (GUI) untuk mengelola database.

### 1. Kenapa Perlu SSMS?
SSMS adalah "dashboard" utama untuk database Anda. Tanpanya, pengelolaan database menjadi sulit. Manfaat utamanya:
*   **Visualisasi Data**: Melihat isi tabel tanpa harus menulis kode.
*   **Manajemen Database**: Membuat, menghapus, atau backup database dengan klik kanan.
*   **Query Sandbox**: Menguji query SQL secara langsung sebelum diimplementasikan di Node.js.

### 2. Langkah Instalasi & Login
1.  **Download**: [Link Resmi SSMS](https://aka.ms/ssmsfullsetup).
2.  **Login**: Buka SSMS, gunakan `.` (titik) sebagai **Server Name** dan pilih `Windows Authentication` untuk login awal.
3.  **Buat Database**: Klik kanan pada folder `Databases` > `New Database` > Beri nama `db_inventory`.

---

## BAGIAN 2: Analisis & Rencana Migrasi Kode

### 1. Status Kesiapan Saat Ini

| Komponen | Status | Penjelasan |
| :--- | :--- | :--- |
| **ORM (Sequelize)** | **Ready** | Sequelize mendukung MSSQL. Perlu ganti `dialect` ke `mssql` dan instal driver `tedious`. |
| **Migrasi (node-pg-migrate)** | **Not Ready** | Saat ini menggunakan alat khusus PostgreSQL. Harus direfactor ke format Sequelize Migration agar bisa jalan di MSSQL. |
| **Seeder (Sequelize-CLI)** | **Partial Ready** | Sudah menggunakan format agnostic, namun perlu dicek jika ada query SQL manual. |

### 2. Tantangan Utama
*   **Alat Migrasi**: `node-pg-migrate` tidak mengenal bahasa T-SQL milik MSSQL.
*   **Dialek SQL**: Tipe data seperti `SERIAL` (PG) harus diganti menjadi `IDENTITY` (MSSQL). Sequelize Migration akan menangani ini secara otomatis jika kita melakukan refactor.

---

## BAGIAN 3: Roadmap Implementasi (Langkah Teknis)

Agar tujuan "Tinggal npm migrate up dan npm seeder up" tercapai, ikuti langkah ini:

### Langkah 1: Persiapan Driver
Jalankan perintah berikut untuk menginstal driver database Microsoft:
```bash
npm install tedious
```

### Langkah 2: Refactor Migrasi ke "Database Agnostic"
Ubah semua file di `src/migrations` dari format PostgreSQL ke format Sequelize Migration menggunakan `queryInterface`. 
*   **Contoh Refactor:**
    *   *Lama:* `pgm.createTable('roles', { id: 'id', ... })`
    *   *Baru:* `queryInterface.createTable('Roles', { id: { type: Sequelize.INTEGER, primaryKey: true }, ... })`

### Langkah 3: Update Script package.json
Ubah script agar seragam menggunakan Sequelize-CLI:
```json
"scripts": {
  "migrate:up": "sequelize-cli db:migrate",
  "seed:up": "sequelize-cli db:seed:all"
}
```

### Langkah 4: Konfigurasi Dinamis di .env
Atur dialek database agar bisa berpindah-pindah melalui environment variable:
```env
DB_DIALECT=mssql
DB_HOST=localhost
DB_NAME=db_inventory
```

---

## KESIMPULAN
Migrasi ke MSSQL sangat dimungkinkan. Kunci utamanya adalah melakukan **refactor sistem migrasi** menjadi Sequelize Migration. Dengan cara ini, aplikasi Anda menjadi "Database Agnostic" — benar-benar bisa berpindah antar database hanya dengan mengubah satu baris di file `.env`.
