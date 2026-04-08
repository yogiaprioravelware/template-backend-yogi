# Langkah-Langkah Implementasi Migrasi MSSQL

Dokumen ini berisi panduan teknis langkah-demi-langkah untuk memindahkan database aplikasi Anda dari PostgreSQL ke Microsoft SQL Server (MSSQL).

---

## Langkah 1: Persiapan di SSMS (Visual)
1.  Buka **SSMS (SQL Server Management Studio)**.
2.  Klik kanan pada folder **Databases** > **New Database**.
3.  Beri nama database: `template_db` (atau sesuai keinginan Anda).
4.  Klik **OK**. Database kosong Anda sekarang siap digunakan.

---

## Langkah 2: Instalasi Driver & Paket Tambahan
Buka terminal di root proyek Anda, lalu jalankan perintah:
```bash
npm install tedious
```
*`tedious` adalah driver yang dibutuhkan Sequelize untuk berkomunikasi dengan SQL Server.*

---

## Langkah 3: Penyesuaian Kode Koneksi
Buka file `src/utils/database.js` dan ubah `dialect` menjadi `mssql`.

**Sebelum:**
```javascript
dialect: "postgres",
```

**Sesudah (Disarankan dinamis):**
```javascript
dialect: process.env.DB_DIALECT || "postgres",
```

---

## Langkah 4: Pembaruan Konfigurasi (.env)
Sesuaikan file `.env` Anda dengan kredensial SQL Server:
```env
DB_HOST=localhost
DB_USER=sa              # Username SQL Server Anda
DB_PASSWORD=Password123 # Password yang Anda buat saat instalasi
DB_NAME=template_db     # Nama database yang dibuat di Langkah 1
DB_DIALECT=mssql
DB_PORT=1433            # Port default MSSQL
```

---

## Langkah 5: Refactor Migrasi (PENTING)
Karena migrasi saat ini menggunakan `node-pg-migrate` (khusus Postgres), kita perlu memindahkannya ke format **Sequelize Migrations**.

### Contoh Perubahan File Migrasi:
**Lama (src/migrations/xxx.js):**
```javascript
exports.up = (pgm) => {
  pgm.createTable("roles", {
    id: "id",
    name: { type: "varchar(50)", notNull: true },
  });
};
```

**Baru (src/migrations_new/xxx.js):**
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("roles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("roles");
  }
};
```

---

## Langkah 6: Eksekusi Migrasi & Seeder
Terakhir, jalankan perintah untuk membangun struktur tabel dan mengisi data awal:

1.  **Migrasi**: `npm run migrate:up` (setelah script di package.json diperbarui).
2.  **Seeder**: `npm run seed:up`.

---

## Langkah 7: Verifikasi di SSMS
1.  Buka kembali SSMS.
2.  Klik kanan pada database Anda > **Refresh**.
3.  Buka folder **Tables**. Pastikan tabel `users`, `roles`, `permissions`, dll. sudah muncul di sana.
4.  Klik kanan pada salah satu tabel > **Select Top 1000 Rows** untuk melihat data hasil seeder.
