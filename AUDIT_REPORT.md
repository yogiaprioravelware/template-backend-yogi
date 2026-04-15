# Laporan Audit Skema Database & Modul Backend

## 1. Pendahuluan
Laporan ini berisi hasil audit menyeluruh terhadap modul backend `template-backend-yogiravelware` setelah dilakukan proses migrasi ulang (backup, rollback, migrate fresh) dan seeding data. Proses audit bertujuan untuk mengidentifikasi ketidaksesuaian skema database, constraint yang belum terpenuhi, relasi tabel, dan fungsi-fungsi yang belum terintegrasi dengan sempurna.

## 2. Temuan Masalah

### 2.1. Inkompatibilitas Dialek SQL pada Seeder
- **Masalah:** Pada file seeder `20260414110000-demo-staging.js`, terdapat penggunaan sintaks `LIMIT 1` yang tidak kompatibel dengan dialek SQL Server (`mssql`). SQL Server menggunakan `TOP 1`.
- **Dampak:** Proses seeding awal gagal dieksekusi (Error: Incorrect syntax near '1').
- **Status:** **Telah Diperbaiki** dengan menyesuaikan sintaks query berdasarkan dialek SQL yang aktif (`queryInterface.sequelize.options.dialect`).

### 2.2. Tidak Adanya Asosiasi Model (Missing ORM Associations)
- **Masalah:** Meskipun skema database pada file migration telah mendefinisikan *Foreign Key* dengan constraint `ON UPDATE CASCADE ON DELETE CASCADE` (misal pada `inbounds`, `outbounds`, `staging_sessions`, `locations`), sebagian besar file model di `src/models/` tidak memiliki definisi asosiasi Sequelize (seperti `hasMany`, `belongsTo`, `belongsToMany`).
- **Dampak:** Pengembang tidak dapat menggunakan fitur *Eager Loading* (`include`) bawaan Sequelize. Akibatnya, pada beberapa layanan (seperti `get-inbound-detail-service.js`), penggabungan data antar tabel dilakukan secara manual di memori (menggunakan JavaScript `map` dan `reduce`), yang berpotensi menyebabkan masalah kinerja (*N+1 query problem*) seiring bertambahnya jumlah data.

### 2.3. Penggunaan Tipe Data ENUM pada SQL Server
- **Masalah:** Beberapa model (seperti `StagingSession.js`, `StagingItem.js`, `Inbound.js`, `Outbound.js`) dan migration mendefinisikan tipe data `DataTypes.ENUM`. SQL Server secara bawaan tidak memiliki tipe data ENUM seperti PostgreSQL atau MySQL.
- **Dampak:** Sequelize mencoba mem-polyfill ini menggunakan `VARCHAR` dengan constraint `CHECK`. Meski dapat berjalan, penggunaan ini sering kali rentan terhadap modifikasi nilai di masa mendatang dan tidak optimal pada SQL Server.

### 2.4. Ketiadaan File Sentralisasi Model (`models/index.js`)
- **Masalah:** Direktori `src/models` tidak memiliki file `index.js` yang biasanya bertugas memuat dan meregistrasi seluruh model beserta asosiasinya ke dalam satu instance Sequelize secara terpusat.
- **Dampak:** Asosiasi antar model (jika ditambahkan nantinya) akan sulit dikelola dan rentan terhadap masalah *circular dependency*.

## 3. Dampak Terhadap Fungsionalitas Sistem
Meskipun pengujian unit (Unit Tests) dan pengujian End-to-End (E2E Tests) **berhasil lulus 100%**, masalah struktural pada arsitektur ORM (tidak adanya asosiasi) akan berdampak jangka panjang pada:
- **Performa:** Pengambilan data relasional yang manual tidak memanfaatkan optimalisasi SQL JOIN.
- **Maintainability:** Penambahan fitur baru yang melibatkan multi-tabel akan memerlukan penulisan *boilerplate code* agregasi yang berulang-ulang.
- **Data Integrity:** Jika operasi *delete* atau *update* dilakukan melalui level ORM tanpa asosiasi, constraint level database mungkin tidak tertangani dengan rapi oleh aplikasi.

## 4. Rekomendasi Perbaikan

1. **Definisikan Asosiasi Sequelize Secara Lengkap:**
   - Tambahkan fungsi statis `associate(models)` pada setiap file model (misal: `Inbound.hasMany(models.InboundItem, { foreignKey: 'inbound_id' })`).
2. **Buat Sentralisasi Model:**
   - Tambahkan file `src/models/index.js` untuk membaca seluruh file model secara otomatis, menginisialisasi model, dan mengeksekusi fungsi `associate()` dari masing-masing model untuk membentuk relasi.
3. **Refaktor Layanan untuk Menggunakan Eager Loading:**
   - Refaktor kode pada layer `services` (contoh: `get-inbound-detail-service.js` dan `get-outbound-detail-service.js`) agar menggunakan opsi `include: [ModelLain]` alih-alih melakukan *query* terpisah dan menggabungkan datanya secara manual dengan JavaScript.
4. **Standarisasi ENUM ke VARCHAR dengan Validasi:**
   - Ganti penggunaan `ENUM` dengan `STRING` yang dilengkapi properti validasi `isIn: [['VALUE1', 'VALUE2']]` pada model untuk memastikan kompatibilitas dan keamanan penuh di SQL Server.
