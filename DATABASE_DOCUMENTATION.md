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

## Skema Tabel (16 Total)

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

### 9. Tabel `roles` ⭐ NEW
Master data peran pengguna untuk sistem ACL.

| Nama Kolom   | Tipe Data      | Nullable | Default             | Unique | Keterangan |
| :---         | :---           | :---     | :---                | :---   | :--- |
| `id`         | `SERIAL`       | NO       | -                   | YES    | Primary Key |
| `name`       | `VARCHAR(50)`  | NO       | -                   | YES    | Nama role (admin, operator, dll) |
| `description`| `TEXT`         | YES      | -                   | NO     | Penjelasan peran |
| `created_at` | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu dibuat |

**Migrations**: `20260407104802-create-acl-tables.js`

---

### 10. Tabel `permissions` ⭐ NEW
Daftar izin akses spesifik per modul dan aksi.

| Nama Kolom   | Tipe Data      | Nullable | Default | Unique | Keterangan |
| :---         | :---           | :---     | :---    | :---   | :--- |
| `id`         | `SERIAL`       | NO       | -       | YES    | Primary Key |
| `name`       | `VARCHAR(100)` | NO       | -       | YES    | identifier (e.g. item:create) |
| `module`     | `VARCHAR(50)`  | NO       | -       | NO     | Nama modul (item, user, dll) |
| `action`     | `VARCHAR(50)`  | NO       | -       | NO     | Aksi (create, read, dll) |
| `description`| `TEXT`         | YES      | -       | NO     | Penjelasan izin |

**Migrations**: `20260407104802-create-acl-tables.js`

---

### 11. Tabel `role_permissions` ⭐ NEW
Tabel penghubung Many-to-Many antara Role dan Permission.

| Nama Kolom     | Tipe Data | Nullable | Default | Keterangan |
| :---           | :---      | :---     | :---    | :--- |
| `id`           | `SERIAL`  | NO       | -       | Primary Key |
| `role_id`      | `INTEGER` | NO       | -       | FK → roles.id |
| `permission_id`| `INTEGER` | NO       | -       | FK → permissions.id |

**Foreign Keys**: `role_id` (CASCADE), `permission_id` (CASCADE)  
**Migrations**: `20260407104802-create-acl-tables.js`

---

### 12. Tabel `item_locations` ⭐ NEW
Penyimpanan stok item secara spesifik per lokasi (Bin/Rak).

| Nama Kolom    | Tipe Data | Nullable | Default | Keterangan |
| :---          | :---      | :---     | :---    | :--- |
| `id`          | `SERIAL`  | NO       | -       | Primary Key |
| `item_id`     | `INTEGER` | NO       | -       | FK → items.id |
| `location_id` | `INTEGER` | NO       | -       | FK → locations.id |
| `stock`       | `INTEGER` | NO       | `0`     | Jumlah stok di lokasi ini |
| `created_at`  | `TIMESTAMP` | NO     | `NOW()` | Waktu created |
| `updated_at`  | `TIMESTAMP` | NO     | `NOW()` | Waktu updated |

**Constraints**: UNIQUE (`item_id`, `location_id`)  
**Migrations**: `20260410101500-create-item-locations-table.js`

---

### 13. Tabel `inventory_movements` ⭐ NEW
Laporan/ledger pergerakan stok sebagai audit trail lengkap.

| Nama Kolom     | Tipe Data      | Nullable | Default | Keterangan |
| :---           | :---           | :---     | :---    | :--- |
| `id`           | `SERIAL`       | NO       | -       | Primary Key |
| `item_id`      | `INTEGER`      | NO       | -       | FK → items.id |
| `location_id`  | `INTEGER`      | NO       | -       | FK → locations.id |
| `type`         | `VARCHAR(50)`  | NO       | -       | INBOUND, OUTBOUND, OPNAME, dll |
| `qty_change`   | `INTEGER`      | NO       | -       | Perubahan jumlah (+/-) |
| `balance_after`| `INTEGER`      | NO       | -       | Stok akhir setelah pergerakan |
| `reference_id` | `VARCHAR(100)` | YES      | -       | PO Number / Order Number |
| `operator_name`| `VARCHAR(255)` | YES      | -       | Nama yang melakukan aksi |
| `created_at`   | `TIMESTAMP`    | NO       | `NOW()` | Waktu transaksi |

**Migrations**: `20260410101502-create-inventory-movements-table.js`

---

### 15. Tabel `staging_sessions` ⭐ NEW
Menyimpan informasi sesi konsolidasi barang outbound.

| Nama Kolom       | Tipe Data      | Nullable | Default             | Unique | Keterangan |
| :---             | :---           | :---     | :---                | :---   | :--- |
| `id`             | `SERIAL`       | NO       | -                   | YES    | Primary Key |
| `session_number` | `VARCHAR(100)` | NO       | -                   | YES    | Nomor sesi unik |
| `status`         | `ENUM`         | NO       | `'OPEN'`            | NO     | OPEN \| CLOSED \| FINALIZED |
| `created_by_id`  | `INTEGER`      | YES      | -                   | NO     | FK → users.id |
| `created_at`     | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu dibuat |
| `updated_at`     | `TIMESTAMP`    | NO       | `CURRENT_TIMESTAMP` | NO     | Waktu diperbarui |

**Migrations**: `20260414100000-create-staging-tables.js`

---

### 16. Tabel `staging_items` ⭐ NEW
Detail barang yang masuk dalam sesi staging.

| Nama Kolom          | Tipe Data      | Nullable | Default | Keterangan |
| :---                | :---           | :---     | :---    | :--- |
| `id`                | `SERIAL`       | NO       | -       | Primary Key |
| `staging_session_id`| `INTEGER`      | NO       | -       | FK → staging_sessions.id |
| `rfid_tag`          | `VARCHAR(100)` | NO       | -       | RFID tag barang |
| `outbound_item_id`  | `INTEGER`      | YES      | -       | FK → outbound_items.id |
| `location_id`       | `INTEGER`      | NO       | -       | FK → locations.id (lokasi asal) |
| `status`            | `ENUM`         | NO       | `'STAGED'` | STAGED \| FINALIZED |

**Migrations**: `20260414100000-create-staging-tables.js`

---

### 17. Tabel `staging_audit_logs` ⭐ NEW
Audit trail aktivitas di area staging.

| Nama Kolom          | Tipe Data | Nullable | Default | Keterangan |
| :---                | :---      | :---     | :---    | :--- |
| `id`                | `SERIAL`  | NO       | -       | Primary Key |
| `staging_session_id`| `INTEGER` | NO       | -       | FK → staging_sessions.id |
| `user_id`           | `INTEGER` | YES      | -       | FK → users.id |
| `action`            | `VARCHAR` | NO       | -       | ADD_ITEM, FINALIZE, dll |
| `details`           | `TEXT`    | YES      | -       | JSON details (RFID, SKU, dll) |
| `created_at`        | `TIMESTAMP` | NO     | `NOW()` | Waktu aksi |

**Migrations**: `20260414100000-create-staging-tables.js`

---

### 14. View `reconciliation_view` ⭐ VIEW
Digunakan untuk membandingkan stok sistem (global) vs stok fisik per lokasi.

**Logic**: Query menggabungkan data `items` dengan aggregasi dari `item_locations` untuk melihat selisih stok.
**Migrations**: `20260410101600-create-reconciliation-view.js`

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
roles (1) ────────── (n) role_permissions (n) ────────── (1) permissions
  │
  └─ (1) ────────── (n) users (via role_id)

users (1) ──────────── (n) inbounds
                            │
                            ├─ (1) ──────── (n) inbound_items
                            │                   │
                            │                   └─ (FK) items.sku_code
                            │                   └─ (n) ──── (1) locations (via receiving_log)
                            │
                            └─ inbound_receiving_log (audit trail)

items (1) ──────────── (n) item_locations (1) ────────── (1) locations
  │                          │
  └─ (1) ──────────── (n) inventory_movements (audit trail)
                             │
                             └─ (FK) locations.id

items (1) ──────────── (n) inbound_items 
items (1) ──────────── (n) outbound_items 
```

---

**Last Updated**: April 13, 2026  
**Status**: ✅ Synced with ACL & Inventory Movement tracking
