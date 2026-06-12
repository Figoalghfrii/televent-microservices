# TelEvent Microservices

> Sistem manajemen event kampus berbasis arsitektur microservices dengan GraphQL API dan Docker.

---

## Daftar Isi

- [Deskripsi Aplikasi](#deskripsi-aplikasi)
- [Arsitektur](#arsitektur)
- [Teknologi](#teknologi)
- [Struktur Direktori](#struktur-direktori)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Endpoint GraphQL](#endpoint-graphql)
- [Contoh Query & Mutation](#contoh-query--mutation)
- [Frontend Client](#frontend-client)
- [Menghentikan Aplikasi](#menghentikan-aplikasi)

---

## Deskripsi Aplikasi

TelEvent adalah aplikasi manajemen event kampus yang dibangun menggunakan arsitektur **Microservices**. Setiap domain entitas dipisah menjadi layanan independen yang masing-masing memiliki:

- Endpoint **GraphQL** tersendiri
- **Database MySQL** tersendiri
- **Docker container** tersendiri

Sistem terdiri dari 4 service utama:

| Service | Domain | Port |
|---|---|---|
| event-service | Manajemen event kampus | 4001 |
| ticket-service | Manajemen kategori tiket | 4002 |
| staff-service | Manajemen staf dan penugasan | 4003 |
| speaker-service | Manajemen pembicara dan jadwal sesi | 4004 |

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│            Vue 3 SPA  (client/index.html)               │
└────────┬──────────┬──────────┬──────────┬───────────────┘
         │          │          │          │
    HTTP POST  HTTP POST  HTTP POST  HTTP POST
    :4001      :4002      :4003      :4004
         │          │          │          │
┌────────▼──┐ ┌─────▼─────┐ ┌─▼────────┐ ┌▼────────────┐
│  event-   │ │  ticket-  │ │  staff-  │ │  speaker-   │
│  service  │ │  service  │ │  service │ │  service    │
└────────┬──┘ └─────┬─────┘ └──┬───────┘ └──────┬──────┘
         │          │          │                 │
    ┌────▼──┐  ┌────▼──┐  ┌────▼──┐        ┌────▼──┐
    │ MySQL │  │ MySQL │  │ MySQL │        │ MySQL │
    │events │  │tickets│  │staffs │        │speaker│
    └───────┘  └───────┘  └───────┘        └───────┘
```

---

## Teknologi

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js 20 Alpine |
| GraphQL Server | Apollo Server 4 + Express 4 |
| Database | MySQL 2 |
| Containerization | Docker + Docker Compose |
| Frontend | Vue 3 (CDN) + Bootstrap 5.3 |

---

## Struktur Direktori

```
televent-final/
├── event-service/
│   ├── src/
│   │   ├── db/pool.js                  # Koneksi MySQL
│   │   ├── schema/event.typeDefs.js    # GraphQL schema
│   │   ├── resolvers/event.resolver.js # Resolver & business logic
│   │   └── server.js                   # Entry point Apollo + Express
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── ticket-service/                     # Struktur sama seperti event-service
├── staff-service/                      # Struktur sama seperti event-service
├── speaker-service/                    # Struktur sama seperti event-service
├── client/
│   ├── index.html                      # Vue 3 SPA
│   ├── script.js                       # App logic & GraphQL calls
│   └── style.css
├── docker-compose.yml                  # Orkestrasi 4 container
└── README.md
```

---

## Prasyarat

Pastikan sudah terinstall:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — untuk menjalankan container
- Database MySQL yang sudah berjalan — bisa lokal, Railway, PlanetScale, atau layanan lain
- 4 database MySQL yang sudah dibuat (satu per service)

---

## Instalasi & Menjalankan

### 1. Clone / Extract Project

```bash
# Pastikan berada di folder root project
cd televent-final
```

### 2. Setup Environment Variable

Copy file `.env.example` menjadi `.env` pada setiap service:

```bash
cp event-service/.env.example event-service/.env
cp ticket-service/.env.example ticket-service/.env
cp staff-service/.env.example staff-service/.env
cp speaker-service/.env.example speaker-service/.env
```

### 3. Isi Credential Database

Edit masing-masing file `.env` dan isi dengan credential database yang sesuai:

```env
DB_HOST=host_database_anda
DB_PORT=3306
DB_USER=username
DB_PASSWORD=password
DB_NAME=nama_database
```

> **Catatan:** Jika database berjalan di localhost dan Docker Desktop digunakan, ganti `DB_HOST` dengan `host.docker.internal` bukan `localhost`.

Setiap service membutuhkan database yang berbeda:

| File | Database |
|---|---|
| `event-service/.env` | Database untuk tabel `events` |
| `ticket-service/.env` | Database untuk tabel `ticket_categories` |
| `staff-service/.env` | Database untuk tabel `staffs` dan `staff_assignments` |
| `speaker-service/.env` | Database untuk tabel `speakers` dan `speaker_assignments` |

### 4. Jalankan Semua Container

```bash
docker compose up --build
```

Perintah ini akan:
- Build image Docker untuk keempat service
- Menjalankan keempat container secara bersamaan
- Meng-inject environment variable dari file `.env` masing-masing service

Tunggu hingga semua service menampilkan log berikut:

```
televent-event-service   | Event Service running at http://localhost:4001/graphql
televent-ticket-service  | Ticket Service running at http://localhost:4002/graphql
televent-staff-service   | Staff Service running at http://localhost:4003/graphql
televent-speaker-service | Speaker Service running at http://localhost:4004/graphql
```

---

## Endpoint GraphQL

Setelah semua container berjalan, akses GraphQL Playground (Apollo Sandbox) di browser:

| Service | URL |
|---|---|
| Event Service | http://localhost:4001/graphql |
| Ticket Service | http://localhost:4002/graphql |
| Staff Service | http://localhost:4003/graphql |
| Speaker Service | http://localhost:4004/graphql |

---

## Contoh Query & Mutation

### Event Service (`http://localhost:4001/graphql`)

```graphql
# Query semua event
query {
  events(status: "Upcoming", sort_by: "date", order: "asc") {
    id
    nama_event
    tanggal
    lokasi
    status_event
  }
}

# Mutation create event
mutation {
  createEvent(input: {
    nama_event: "Seminar AI 2025"
    tanggal: "2025-12-01"
    waktu: "09:00"
    lokasi: "Telkom University"
    deskripsi: "Seminar tentang AI"
    status_event: "Upcoming"
  }) {
    id
    nama_event
    status_event
  }
}

# Mutation update event
mutation {
  updateEvent(id: "1", input: {
    nama_event: "Seminar AI 2025 (Updated)"
    tanggal: "2025-12-01"
    waktu: "10:00"
    lokasi: "Aula Telkom University"
    deskripsi: "Updated"
    status_event: "Ongoing"
  }) {
    id
    nama_event
    status_event
  }
}

# Mutation delete event
mutation {
  deleteEvent(id: "1")
}
```

### Ticket Service (`http://localhost:4002/graphql`)

```graphql
# Query tiket berdasarkan event
query {
  ticketCategoriesByEvent(event_id: "1") {
    id
    nama_tiket
    harga
    kuota
    tiket_terjual
  }
}

# Mutation create tiket
mutation {
  createTicketCategory(input: {
    event_id: "1"
    nama_tiket: "Tiket Regular"
    harga: 50000
    kuota: 200
    tiket_terjual: 0
    deskripsi: "Tiket masuk reguler"
  }) {
    id
    nama_tiket
    harga
  }
}
```

### Staff Service (`http://localhost:4003/graphql`)

```graphql
# Query semua staf
query {
  staffs {
    id
    nama_staff
    divisi
    email
  }
}

# Mutation create staf
mutation {
  createStaff(input: {
    nama_staff: "Budi Santoso"
    divisi: "Logistik"
    no_hp: "081234567890"
    email: "budi@telkomuniversity.ac.id"
  }) {
    id
    nama_staff
    divisi
  }
}

# Mutation create penugasan staf
mutation {
  createStaffAssignment(input: {
    staff_id: "1"
    event_id: "1"
    role_tugas: "Koordinator Acara"
    status_tugas: "Active"
  }) {
    id
    role_tugas
    status_tugas
  }
}
```

### Speaker Service (`http://localhost:4004/graphql`)

```graphql
# Query semua speaker
query {
  speakers {
    id
    nama_speaker
    instansi
    bidang_keahlian
  }
}

# Mutation create speaker
mutation {
  createSpeaker(input: {
    nama_speaker: "Dr. Andi Wijaya"
    instansi: "Institut Teknologi Bandung"
    bidang_keahlian: "Artificial Intelligence"
    email: "andi@itb.ac.id"
    no_hp: "081298765432"
  }) {
    id
    nama_speaker
    instansi
  }
}

# Mutation create jadwal sesi speaker
mutation {
  createSpeakerAssignment(input: {
    speaker_id: "1"
    event_id: "1"
    judul_materi: "Machine Learning in Industry 4.0"
    sesi: "Sesi 1"
    jam_mulai: "08:30"
    jam_selesai: "10:00"
  }) {
    id
    judul_materi
    sesi
  }
}
```

---

## Frontend Client

Frontend berada di folder `client/` dan dibangun menggunakan Vue 3 via CDN.

**Cara membuka:**
- Buka file `client/index.html` langsung di browser, atau
- Gunakan **Live Server** di VS Code (klik kanan → Open with Live Server)

**Halaman yang tersedia:**

| Halaman | Fitur |
|---|---|
| Dashboard | Ringkasan statistik total event, tiket, staf, speaker |
| Events | List, tambah, edit, hapus event |
| Ticket Categories | Manajemen kategori tiket per event |
| Staff Management | CRUD staf dan penugasan staf ke event |
| Speaker Management | CRUD speaker dan penjadwalan sesi |

Client terhubung ke endpoint berikut:

```javascript
EVENT_API   = "http://localhost:4001/graphql"
TICKET_API  = "http://localhost:4002/graphql"
STAFF_API   = "http://localhost:4003/graphql"
SPEAKER_API = "http://localhost:4004/graphql"
```

---

## Menghentikan Aplikasi

```bash
# Hentikan semua container
docker compose down

# Hentikan dan hapus semua image (build ulang dari awal)
docker compose down --rmi all
```