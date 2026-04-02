
# Dokumentasi Teknis - User API

## Skema Database

### Tabel `users`

| Nama Kolom   | Tipe Data      | Keterangan                        |
| :---         | :---           | :---                              |   
| `id`         | `SERIAL`       | Primary Key, Auto-increment       |
| `name`       | `VARCHAR(255)` | Nama pengguna                     |
| `email`      | `VARCHAR(255)` | Email pengguna, harus unik        |
| `password`   | `VARCHAR(255)` | Password pengguna (sudah di-hash) |
| `created_at` | `TIMESTAMP`    | Waktu pembuatan akun              |  

## Spesifikasi API

### 1. Registrasi Pengguna

- **Endpoint**: `POST /api/users/register`
- **Deskripsi**: Mendaftarkan pengguna baru.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
- **Response Error (400/500)**:
  ```json
  {
    "success": false,
    "errors": [
      { "message": "Error message" }
    ]
  }
  ```

### 2. Login Pengguna

- **Endpoint**: `POST /api/users/login`
- **Deskripsi**: Login untuk mendapatkan token JWT.
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "token": "your_jwt_token"
    }
  }
  ```

### 3. Mendapatkan Semua Pengguna

- **Endpoint**: `GET /api/users`
- **Deskripsi**: Mendapatkan daftar semua pengguna.
- **Headers**: `Authorization: Bearer your_jwt_token`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    ]
  }
  ```

### 4. Mendapatkan Pengguna Berdasarkan ID

- **Endpoint**: `GET /api/users/:id`
- **Deskripsi**: Mendapatkan detail pengguna berdasarkan ID.
- **Headers**: `Authorization: Bearer your_jwt_token`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
  ```

### 5. Memperbarui Pengguna

- **Endpoint**: `PUT /api/users/:id`
- **Deskripsi**: Memperbarui data pengguna berdasarkan ID.
- **Headers**: `Authorization: Bearer your_jwt_token`
- **Request Body**:
  ```json
  {
    "name": "John Doe Updated",
    "email": "john.doe.updated@example.com"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "John Doe Updated",
      "email": "john.doe.updated@example.com"
    }
  }
  ```

### 6. Menghapus Pengguna

- **Endpoint**: `DELETE /api/users/:id`
- **Deskripsi**: Menghapus pengguna berdasarkan ID.
- **Headers**: `Authorization: Bearer your_jwt_token`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": "User deleted successfully"
  }
  ```
