# API Documentation - RFID Warehouse Management System

Dokumentasi lengkap untuk RFID-based warehouse management system dengan user authentication, item tracking, two-stage inbound receiving, dan order dispatch management.

## API Base Information
- **Base URL**: `http://localhost:3000` (local) atau `https://api.example.com` (production)
- **API Version**: v1.0
- **Content-Type**: `application/json`
- **Authentication**: JWT Token (except Register & Login)

---

# 📌 TABLE OF CONTENTS

1. [User Management](#user-management) (6 endpoints)
2. [Item Management](#item-management) (8 endpoints)
3. [Inbound (Two-Stage Receiving)](#inbound-two-stage-receiving) (5 endpoints)
4. [Outbound (Order Dispatch)](#outbound-order-dispatch) (4 endpoints)
5. [Location Management](#location-management) (5 endpoints)
6. [Role & Permission Management](#role--permission-management) (3 endpoints)
7. [Response Format](#response-format)
8. [Error Handling](#error-handling)

---

# 👥 USER MANAGEMENT

## 1. Register User (Public)

**Endpoint**: `POST /api/users/register`

Register user baru dengan default role "operator".

### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Response Success (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "operator",
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

### Response Error (400 Bad Request)
```json
{
  "success": false,
  "errors": [
    { "message": "\"email\" must be a valid email" }
  ]
}
```

---

## 2. Login User (Public)

**Endpoint**: `POST /api/users/login`

Login dan dapatkan JWT token untuk akses endpoint protected.

### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "operator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error (401 Unauthorized)
```json
{
  "success": false,
  "errors": [
    { "message": "Invalid email or password" }
  ]
}
```

---

## 3. Get All Users

**Endpoint**: `GET /api/users`

Mendapatkan daftar semua user (role-based).

### Headers
```
Authorization: Bearer <token>
```

### Query Parameters
- None

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "operator",
      "created_at": "2026-04-02T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "created_at": "2026-04-02T10:05:00.000Z"
    }
  ]
}
```

---

## 4. Get User by ID

**Endpoint**: `GET /api/users/:id`

Mendapatkan detail user berdasarkan ID.

### Headers
```
Authorization: Bearer <token>
```

### Path Parameters
- `id` (required): User ID

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "operator",
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 5. Update User

**Endpoint**: `PUT /api/users/:id`

Memperbarui informasi user.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "operator"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "role": "operator"
  }
}
```

---

## 6. Delete User

**Endpoint**: `DELETE /api/users/:id`

Menghapus user.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": "User deleted successfully"
}
```

---

## 7. Change User Role

**Endpoint**: `PUT /api/users/:id/role`

Mengubah role user (admin/operator) atau mengaitkan dengan Role ID tertentu.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "role_id": 1
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "role_id": 1,
    "message": "Role assigned successfully"
  }
}
```

---

# 📦 ITEM MANAGEMENT

## 1. Register Item

**Endpoint**: `POST /api/items`

Mendaftarkan item baru dengan RFID tag dan master data.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "rfid_tag": "RFID-001-SKU-A001",
  "item_name": "Electronic Component A",
  "sku_code": "SKU-001",
  "category": "Electronics",
  "uom": "PCS"
}
```

### Response Success (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rfid_tag": "RFID-001-SKU-A001",
    "item_name": "Electronic Component A",
    "sku_code": "SKU-001",
    "category": "Electronics",
    "uom": "PCS",
    "current_stock": 0,
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 2. Get All Items

**Endpoint**: `GET /api/items`

Mendapatkan daftar semua item (newest first).

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rfid_tag": "RFID-001-SKU-A001",
      "item_name": "Electronic Component A",
      "sku_code": "SKU-001",
      "category": "Electronics",
      "uom": "PCS",
      "current_stock": 50,
      "created_at": "2026-04-02T10:00:00.000Z"
    }
  ]
}
```

---

## 3. Get Item by ID

**Endpoint**: `GET /api/items/:id`

Mendapatkan detail item berdasarkan ID.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rfid_tag": "RFID-001-SKU-A001",
    "item_name": "Electronic Component A",
    "sku_code": "SKU-001",
    "category": "Electronics",
    "uom": "PCS",
    "current_stock": 50,
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 4. Update Item

**Endpoint**: `PUT /api/items/:id`

Memperbarui data item.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "item_name": "Electronic Component A - Updated",
  "category": "Electronics - Premium"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rfid_tag": "RFID-001-SKU-A001",
    "item_name": "Electronic Component A - Updated",
    "sku_code": "SKU-001",
    "category": "Electronics - Premium",
    "uom": "PCS",
    "current_stock": 50
  }
}
```

---

## 5. Delete Item

**Endpoint**: `DELETE /api/items/:id`

Menghapus item.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": "Item deleted successfully"
}
```

---

## 6. Perform Stock Opname

**Endpoint**: `POST /api/items/opname`

Melakukan penyesuaian stok fisik secara manual atau melalui audit berkala. Membutuhkan izin `item:update`.

### Request Body
```json
{
  "rfid_tag": "RFID-001",
  "location_qr": "QR-GDG-A-RAK-1",
  "actual_qty": 45,
  "reference": "STK-OPN-APR26"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "item_id": 1,
    "old_qty": 50,
    "new_qty": 45,
    "adjustment": -5,
    "message": "Stock Opname completed successfully"
  }
}
```

---

## 7. Get Item Movement History

**Endpoint**: `GET /api/items/:id/history`

Mendapatkan riwayat audit trail pergerakan stok untuk satu item tertentu (dari tabel `inventory_movements`).

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "type": "INBOUND",
      "qty_change": 20,
      "balance_after": 20,
      "location_name": "Gudang A - Rak 1 - Bin 1",
      "operator": "admin",
      "created_at": "2026-04-10T10:00:00Z"
    }
  ]
}
```

---

## 8. Get Stock Reconciliation Report

**Endpoint**: `GET /api/items/reconciliation`

Mendapatkan laporan perbandingan stok global sistem vs detail stok per lokasi menggunakan `reconciliation_view`.

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "item_id": 1,
      "sku_code": "SKU-001",
      "system_stock": 100,
      "location_total_stock": 100,
      "discrepancy": 0,
      "status": "MATCH"
    }
  ]
}
```

---

# 📥 INBOUND (TWO-STAGE RECEIVING)

## 1. Create PO (Purchase Order)

**Endpoint**: `POST /api/inbounds`

Membuat Purchase Order baru dengan list item yang akan diterima.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "po_number": "PO-2026-001",
  "items": [
    {
      "sku_code": "SKU-001",
      "qty_target": 100
    },
    {
      "sku_code": "SKU-002",
      "qty_target": 50
    }
  ]
}
```

### Response Success (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "po_number": "PO-2026-001",
    "status": "PENDING",
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 2. Get All POs

**Endpoint**: `GET /api/inbounds`

Mendapatkan daftar semua PO dengan item count.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "po_number": "PO-2026-001",
      "status": "PROCES",
      "item_count": 2,
      "created_at": "2026-04-02T10:00:00.000Z"
    }
  ]
}
```

---

## 3. Get PO Detail

**Endpoint**: `GET /api/inbounds/:id`

Mendapatkan detail PO dengan list items dan progress.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "po_number": "PO-2026-001",
    "status": "PROCES",
    "items": [
      {
        "id": 1,
        "sku_code": "SKU-001",
        "item_name": "Electronic Component A",
        "category": "Electronics",
        "uom": "PCS",
        "qty_target": 100,
        "qty_received": 25
      },
      {
        "id": 2,
        "sku_code": "SKU-002",
        "item_name": "Electronic Component B",
        "category": "Electronics",
        "uom": "PCS",
        "qty_target": 50,
        "qty_received": 0
      }
    ],
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 4. Stage 1: Scan Item (RFID)

**Endpoint**: `POST /api/inbounds/:id/scan-item`

Tahap pertama: Scan RFID untuk identifikasi barang. Sistem akan validasi item ada dalam PO ini.

### Headers
```
Authorization: Bearer <token>
```

### Path Parameters
- `id` (required): Inbound ID

### Request Body
```json
{
  "rfid_tag": "RFID-001-SKU-A001"
}
```

### Response Success (200 OK) - Item Valid, Awaiting Location
```json
{
  "success": true,
  "data": {
    "pending_location": true,
    "item": {
      "id": 1,
      "rfid_tag": "RFID-001-SKU-A001",
      "item_name": "Electronic Component A",
      "sku_code": "SKU-001",
      "category": "Electronics",
      "uom": "PCS"
    },
    "inbound_item": {
      "id": 1,
      "qty_target": 100,
      "qty_received": 24,
      "qty_remaining": 76
    }
  }
}
```

### Response Error (404 Not Found)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Item not found",
  "message": "Item dengan RFID tag tidak ditemukan"
}
```

---

## 5. Stage 2: Set Location (QR Scan)

**Endpoint**: `POST /api/inbounds/:id/set-location`

Tahap kedua: Scan QR code lokasi penyimpanan. Hanya setelah tahap ini, qty_received dan stock akan terupdate.

### Headers
```
Authorization: Bearer <token>
```

### Path Parameters
- `id` (required): Inbound ID

### Request Body
```json
{
  "inbound_item_id": 1,
  "qr_string": "QR-GDG-A-RAK-1-BIN-1"
}
```

### Response Success (200 OK) - Item Received & Stored
```json
{
  "success": true,
  "data": {
    "location": {
      "id": 1,
      "location_code": "LOC-001",
      "qr_string": "QR-GDG-A-RAK-1-BIN-1",
      "warehouse": "Gudang A",
      "rack": "Rak 1",
      "bin": "Bin 1",
      "location_name": "Gudang A - Rak 1 - Bin 1"
    },
    "inbound_item": {
      "id": 1,
      "sku_code": "SKU-001",
      "qty_target": 100,
      "qty_received": 25,
      "qty_remaining": 75
    },
    "inbound_progress": {
      "po_number": "PO-2026-001",
      "status": "PROCES",
      "total_items": 2,
      "completed_items": 0,
      "progress_percentage": 12
    }
  }
}
```

### Two-Stage Flow Diagram
```
POST /scan-item (rfid_tag)
        ↓
   Validasi RFID
        ↓
Response: pending_location = true
        ↓
POST /set-location (inbound_item_id, qr_string)
        ↓
   Validasi lokasi
        ↓
   qty_received +1
   ↓
   current_stock +1
   ↓
   create inbound_receiving_log entry
        ↓
Response: Lokasi, progress update
```

---

# 📤 OUTBOUND (ORDER DISPATCH)

## 1. Create Sales Order

**Endpoint**: `POST /api/outbounds`

Membuat sales order dengan 3 tipe: LUNAS (fixed sales), PINJAM (loan), RETURN (return).

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "order_number": "ORD-2026-001",
  "outbound_type": "LUNAS",
  "items": [
    {
      "sku_code": "SKU-001",
      "qty_target": 10
    }
  ]
}
```

### Response Success (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-2026-001",
    "outbound_type": "LUNAS",
    "status": "PENDING",
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 2. Get All Orders

**Endpoint**: `GET /api/outbounds`

Mendapatkan daftar semua sales order.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_number": "ORD-2026-001",
      "outbound_type": "LUNAS",
      "status": "DONE",
      "item_count": 1,
      "created_at": "2026-04-02T10:00:00.000Z"
    }
  ]
}
```

---

## 3. Get Order Detail

**Endpoint**: `GET /api/outbounds/:id`

Mendapatkan detail order dengan items dan current stock.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-2026-001",
    "outbound_type": "LUNAS",
    "status": "DONE",
    "items": [
      {
        "id": 1,
        "sku_code": "SKU-001",
        "item_name": "Electronic Component A",
        "qty_target": 10,
        "qty_delivered": 10,
        "current_stock": 40
      }
    ],
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 4. Scan Item for Picking

**Endpoint**: `POST /api/outbounds/:id/scan`

Single-stage scanning untuk picking. Update qty_delivered dan decrease stock.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "rfid_tag": "RFID-001-SKU-A001"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "rfid_tag": "RFID-001-SKU-A001",
      "sku_code": "SKU-001",
      "item_name": "Electronic Component A"
    },
    "outbound_item": {
      "id": 1,
      "qty_target": 10,
      "qty_delivered": 5
    },
    "stock_after_picking": 45,
    "outbound_status": "PROCES"
  }
}
```

---

# 📍 LOCATION MANAGEMENT

## 1. Create Location

**Endpoint**: `POST /api/locations`

Membuat lokasi penyimpanan baru.

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "location_code": "LOC-001",
  "qr_string": "QR-GDG-A-RAK-1-BIN-1",
  "warehouse": "Gudang A",
  "rack": "Rak 1",
  "bin": "Bin 1",
  "location_name": "Gudang A - Rak 1 - Bin 1"
}
```

### Response Success (201 Created)
```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "id": 1,
    "location_code": "LOC-001",
    "qr_string": "QR-GDG-A-RAK-1-BIN-1",
    "warehouse": "Gudang A",
    "rack": "Rak 1",
    "bin": "Bin 1",
    "location_name": "Gudang A - Rak 1 - Bin 1",
    "status": "ACTIVE"
  }
}
```

---

## 2. Get All Locations

**Endpoint**: `GET /api/locations`

Mendapatkan daftar semua lokasi.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": [
    {
      "id": 1,
      "location_code": "LOC-001",
      "qr_string": "QR-GDG-A-RAK-1-BIN-1",
      "warehouse": "Gudang A",
      "rack": "Rak 1",
      "bin": "Bin 1",
      "location_name": "Gudang A - Rak 1 - Bin 1",
      "status": "ACTIVE",
      "created_at": "2026-04-02T10:00:00.000Z"
    }
  ]
}
```

---

## 3. Get Location by ID

**Endpoint**: `GET /api/locations/:id`

Mendapatkan detail lokasi.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Location retrieved successfully",
  "data": {
    "id": 1,
    "location_code": "LOC-001",
    "qr_string": "QR-GDG-A-RAK-1-BIN-1",
    "warehouse": "Gudang A",
    "rack": "Rak 1",
    "bin": "Bin 1",
    "location_name": "Gudang A - Rak 1 - Bin 1",
    "status": "ACTIVE",
    "created_at": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 4. Update Location

**Endpoint**: `PUT /api/locations/:id`

Memperbarui lokasi (dapat mengubah status ke INACTIVE).

### Headers
```
Authorization: Bearer <token>
```

### Request Body
```json
{
  "status": "INACTIVE"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "id": 1,
    "location_code": "LOC-001",
    "qr_string": "QR-GDG-A-RAK-1-BIN-1",
    "warehouse": "Gudang A",
    "rack": "Rak 1",
    "bin": "Bin 1",
    "location_name": "Gudang A - Rak 1 - Bin 1",
    "status": "INACTIVE"
  }
}
```

---

## 5. Delete Location

**Endpoint**: `DELETE /api/locations/:id`

Menghapus lokasi.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Location deleted successfully",
  "data": null
}
```

---

# 🔑 ROLE & PERMISSION MANAGEMENT

## 1. Get All Roles

**Endpoint**: `GET /api/roles`


### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "admin" },
    { "id": 2, "name": "operator" }
  ]
}
```

---

## 2. Get All Permissions

**Endpoint**: `GET /api/roles/permissions`

Mendapatkan daftar semua permission yang terdaftar di sistem untuk ditampilkan di matrix checklist.

### Headers
```
Authorization: Bearer <token>
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "user:read", "description": "View users" },
    { "id": 2, "name": "user:write", "description": "Create users" }
  ]
}
```

---

## 3. Assign Permissions to Role

**Endpoint**: `POST /api/roles/:id/assign-permissions`

Menyimpan konfigurasi permission untuk role tertentu.

### Headers
```
Authorization: Bearer <token>
```

### Path Parameters
- `id` (required): Role ID

### Request Body
```json
{
  "permissionIds": [1, 2, 3, 5]
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "data": "Permissions assigned successfully"
}
```

---

# 📋 RESPONSE FORMAT

## Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

## Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "message": "Specific error 1" },
    { "message": "Specific error 2" }
  ]
}
```

---

# ⚠️ ERROR HANDLING

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 200 | OK | Request successful |
| 201 | CREATED | Resource created successfully |
| 400 | BAD_REQUEST | Invalid request data |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 500 | SERVER_ERROR | Internal server error |

### Common Error Messages
- `"Validation error"` - Invalid input format
- `"Not found"` - Resource doesn't exist
- `"Already exists"` - Duplicate unique field (email, RFID, SKU, PO number, etc)
- `"Unauthorized"` - Missing JWT token
- `"Forbidden"` - Insufficient role/permissions

---

# 🔐 AUTHENTICATION

All endpoints except Register & Login require JWT token in header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires after 24 hours.

---

**Last Updated**: April 13, 2026  
**API Version**: v1.0  
**Status**: ✅ Synced with ACL & Inventory Movement tracking
