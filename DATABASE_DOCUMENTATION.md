# Dokumentasi Database - RFID Warehouse Management System

Dokumen ini menjelaskan struktur database lengkap, aturan penamaan, dan prosedur migrasi untuk proyek `template-backend-yogiravelware` dengan sistem two-stage inbound receiving.

## Informasi Umum
- **Engine Database**: PostgreSQL
- **Nama Database**: `sop_db` (singular snake_case)
- **Konvensi Nama Tabel**: Plural snake_case (contoh: `users`, `items`)
- **Konvensi Nama Kolom**: Singular snake_case (contoh: `email`, `sku_code`)
- **Primary Key**: Auto-increment INTEGER (SERIAL)
- **Timestamps**: `created_at`, `updated_at` (TIMESTAMP)

---

## Skema Tabel (6 Total)

### 1. Tabel `users`
Menyimpan informasi pengguna aplikasi dengan role-based access.

| Nama Kolom   | Tipe Data      | Nullable | Default             | Unique | Keterangan |
| :---         | :---           | :---     | :---                | :---   | :--- |
| `id`         | `SERIAL`       | NO       | -                   | YES    | Primary Key, Auto-increment |
| `name`       | `VARCHAR(255)` | NO       | -                   | NO     | Nama lengkap pengguna |
| `email`      | `VARCHAR(255)` | NO       | -                   | YES    | Email unik untuk login |
| `password`   | `VARCHAR(255)` | NO       | -                   | NO     | Password hash (BCrypt) |
| `role`       | `ENUM`         | NO       | `'operator'`        | NO     | Role: admin \| operator |
| `created_at` | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu pembuatan akun |
| `updated_at` | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu pembaruan terakhir |

**Indexes**: `email` (unique)  
**Migrations**: `20260402000000-add-role-to-users-table.js`

---

### 2. Tabel `items`
Master data barang dengan RFID tracking dan stock management.

| Nama Kolom    | Tipe Data      | Nullable | Default | Unique | Keterangan |
| :---          | :---           | :---     | :---    | :---   | :--- |
| `id`          | `SERIAL`       | NO       | -       | YES    | Primary Key |
| `rfid_tag`    | `VARCHAR(100)` | NO       | -       | YES    | RFID tag unik untuk scanning |
| `item_name`   | `VARCHAR(255)` | NO       | -       | NO     | Nama barang |
| `sku_code`    | `VARCHAR(100)` | NO       | -       | YES    | SKU code unik |
| `category`    | `VARCHAR(100)` | NO       | -       | NO     | Kategori barang |
| `uom`         | `ENUM`         | NO       | -       | NO     | Unit: PCS \| BOX \| SET |
| `current_stock` | `INTEGER`     | NO       | `0`     | NO     | Stok tersedia saat ini |
| `created_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO | Waktu pendaftaran |
| `updated_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO | Waktu pembaruan |

**Indexes**: `rfid_tag`, `sku_code` (unique)  
**Migrations**: `20260402000001-create-items-table.js`

---

### 3. Tabel `inbounds`
Header Purchase Order untuk barang masuk.

| Nama Kolom  | Tipe Data      | Nullable | Default             | Unique | Keterangan |
| :---        | :---           | :---     | :---                | :---   | :--- |
| `id`        | `SERIAL`       | NO       | -                   | YES    | Primary Key |
| `po_number` | `VARCHAR(100)` | NO       | -                   | YES    | Nomor PO unik |
| `status`    | `ENUM`         | NO       | `'PENDING'`         | NO     | Status: PENDING \| PROCES \| DONE |
| `created_at` | `TIMESTAMP`   | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu pembuatan PO |
| `updated_at` | `TIMESTAMP`   | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu update status |

**Indexes**: `po_number` (unique)  
**Migrations**: `20260402000002-create-inbounds-tables.js`

---

### 4. Tabel `inbound_items`
Detail items dalam setiap PO (qty_target vs qty_received).

| Nama Kolom    | Tipe Data      | Nullable | Default | Keterangan |
| :---          | :---           | :---     | :---    | :--- |
| `id`          | `SERIAL`       | NO       | -       | Primary Key |
| `inbound_id`  | `INTEGER`      | NO       | -       | FK → inbounds.id |
| `sku_code`    | `VARCHAR(100)` | NO       | -       | FK → items.sku_code |
| `qty_target`  | `INTEGER`      | NO       | -       | Target penerimaan |
| `qty_received` | `INTEGER`     | NO       | `0`     | Sudah diterima (incremental) |
| `created_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | Waktu created |
| `updated_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | Waktu updated |

**Foreign Keys**: `inbound_id` (CASCADE), `sku_code`  
**Migrations**: `20260402000002-create-inbounds-tables.js`

---

### 5. Tabel `outbounds`
Header Sales Order untuk barang keluar.

| Nama Kolom    | Tipe Data      | Nullable | Default             | Unique | Keterangan |
| :---          | :---           | :---     | :---                | :---   | :--- |
| `id`          | `SERIAL`       | NO       | -                   | YES    | Primary Key |
| `order_number` | `VARCHAR(100)` | NO      | -                   | YES    | Nomor order unik |
| `outbound_type` | `ENUM`        | NO      | -                   | NO     | LUNAS \| PINJAM \| RETURN |
| `status`      | `ENUM`         | NO       | `'PENDING'`         | NO     | PENDING \| PROCES \| DONE |
| `created_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu pembuatan |
| `updated_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu update |

**Indexes**: `order_number` (unique)  
**Migrations**: `20260402000003-create-outbounds-tables.js`

---

### 6. Tabel `outbound_items`
Detail items dalam setiap order (qty_target vs qty_delivered).

| Nama Kolom     | Tipe Data      | Nullable | Default | Keterangan |
| :---           | :---           | :---     | :---    | :--- |
| `id`           | `SERIAL`       | NO       | -       | Primary Key |
| `outbound_id`  | `INTEGER`      | NO       | -       | FK → outbounds.id |
| `sku_code`     | `VARCHAR(100)` | NO       | -       | FK → items.sku_code |
| `qty_target`   | `INTEGER`      | NO       | -       | Target pengiriman |
| `qty_delivered` | `INTEGER`     | NO       | `0`     | Sudah dikirim |
| `created_at`   | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | Waktu created |
| `updated_at`   | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | Waktu updated |

**Foreign Keys**: `outbound_id` (CASCADE), `sku_code`  
**Migrations**: `20260402000003-create-outbounds-tables.js`

---

### 7. Tabel `locations` ⭐ NEW
Master lokasi penyimpanan dengan struktur hierarki warehouse → rack → bin.

| Nama Kolom    | Tipe Data      | Nullable | Default             | Unique | Keterangan |
| :---          | :---           | :---     | :---                | :---   | :--- |
| `id`          | `SERIAL`       | NO       | -                   | YES    | Primary Key |
| `location_code` | `VARCHAR(100)` | NO     | -                   | YES    | Kode lokasi unik |
| `qr_string`   | `VARCHAR(255)` | NO       | -                   | YES    | QR code untuk scanning |
| `warehouse`   | `VARCHAR(100)` | NO       | -                   | NO     | Nama gudang |
| `rack`        | `VARCHAR(100)` | NO       | -                   | NO     | Nama rak |
| `bin`         | `VARCHAR(100)` | NO       | -                   | NO     | Nama bin/kompartmen |
| `location_name` | `VARCHAR(255)` | NO    | -                   | NO     | Display name (friendly) |
| `status`      | `ENUM`         | NO       | `'ACTIVE'`          | NO     | ACTIVE \| INACTIVE |
| `created_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu created |
| `updated_at`  | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu updated |

**Indexes**: `location_code`, `qr_string` (unique)  
**Migrations**: `20260402000004-create-locations-and-receiving-log.js`

---

### 8. Tabel `inbound_receiving_log` ⭐ NEW
Audit trail untuk tracking penerimaan barang ke lokasi tertentu (two-stage receiving).

| Nama Kolom      | Tipe Data   | Nullable | Default             | Keterangan |
| :---            | :---        | :---     | :---                | :--- |
| `id`            | `SERIAL`    | NO       | -                   | Primary Key |
| `inbound_item_id` | `INTEGER` | NO       | -                   | FK → inbound_items.id |
| `location_id`   | `INTEGER`   | NO       | -                   | FK → locations.id |
| `qty_received`  | `INTEGER`   | NO       | `1`                 | Jumlah diterima per scan |
| `received_at`   | `TIMESTAMP` | NO       | `CURRENT_TIMESTAMP` | Waktu penerimaan |

**Foreign Keys**: `inbound_item_id` (CASCADE), `location_id`  
**Purpose**: Mencatat history penerimaan detail (1 barang bisa diterima ke multiple lokasi)  
**Migrations**: `20260402000004-create-locations-and-receiving-log.js`

---

## Manajemen Database & Migrasi

### 1. File Migrasi (Execution Order)
Semua file migrasi di `src/migrations/` dijalankan berdasarkan timestamp:

```
1. 1711952000000-create-users-table.js (Initial)
2. 20260402000000-add-role-to-users-table.js (Add role field)
3. 20260402000001-create-items-table.js (Item master)
4. 20260402000002-create-inbounds-tables.js (PO + detail)
5. 20260402000003-create-outbounds-tables.js (Order + detail)
6. 20260402000004-create-locations-and-receiving-log.js (Locations + log)
```

### 2. Menjalankan Migrasi & Seeder
```bash
# Install dependencies
npm install

# Setup database (create if not exists, then migrate)
npm run migrate

# Seed demo data
npm run seed

# Run application
npm start
```

### 3. Rollback Database (Jika Perlu)
```bash
# Rollback last migration
npm run migrate:undo

# Rollback all migrations
npm run migrate:undo:all
```

---

## Aturan Penting bagi Tim

1. **Tidak boleh** mengubah skema langsung via pgAdmin/DBeaver. Semua perubahan **HARUS** via migrasi.
2. Setiap ada perubahan skema, update dokumentasi ini agar tetap sinkron.
3. Selalu include file migrasi baru dalam Pull Request (PR).
4. Maintain order migrasi berdasarkan timestamp.
5. Foreign keys menggunakan CASCADE untuk data consistency.

---

## Relationship Diagram

```
users (1) ──────────── (n) inbounds
                            │
                            ├─ (1) ──────── (n) inbound_items
                            │                   │
                            │                   └─ (FK) items.sku_code
                            │                   └─ (n) ──── (1) locations (via inbound_receiving_log)
                            │
                            └─ inbound_receiving_log (audit trail)

users (1) ──────────── (n) outbounds
                            │
                            └─ (1) ──────── (n) outbound_items
                                            │
                                            └─ (FK) items.sku_code

items (1) ──────────── (n) inbound_items (aggregate stock)
items (1) ──────────── (n) outbound_items (aggregate stock)

locations (1) ──────────── (n) inbound_receiving_log
```

---

**Last Updated**: April 2, 2026  
**Status**: ✅ Complete with two-stage receiving & location hierarchy
