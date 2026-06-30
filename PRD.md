# PRD — Arka Gamez / GAMOS Store
**Platform jual-beli & instalasi game PC/Laptop — Web Storefront + Admin Dashboard**

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | 30 Juni 2026 |
| Status | Draft — menunggu konfirmasi asumsi di Bab 11 |
| Disusun oleh | Fullstack Developer (AI-assisted, Claude Code) |

---

## 1. Latar Belakang

Client menjalankan bisnis jasa jual/instalasi game PC & laptop, saat ini beroperasi via toko Shopee **"LINK GAMES"** (Pontianak, `shopid 602098742`, 1445 listing produk, rating 4.87, 36rb+ followers) dan sebuah prototype web **`index (1).html`** (single-file SPA, GAMOS STORE).

Tujuan proyek ini: membangun ulang storefront tersebut menjadi website **multi-page (MPA)** yang production-grade, dengan backend **Supabase** dan hosting **Vercel**, lengkap dengan **dashboard admin** untuk mengelola katalog (1400+ game) dan pesanan tanpa perlu sentuh kode.

### 1.1 Audit Kondisi Saat Ini (`index (1).html`)

| Temuan | Detail | Dampak |
|---|---|---|
| Katalog tidak lengkap | 1023 baris data, 1015 game unik di file lama. Setelah digabung dengan feed lebih baru `linkyuu.github.io/LISTGAME` (`data_game.js`, sumber yang dipakai situs berjalan client saat ini) → **1029 game unik**, 67 di antaranya ditandai sumber sebagai `[NEW GAME]` | Masih ada gap dari klaim 1445 listing di Shopee — lihat 1.2 & Bab 6.4 |
| Arsitektur SPA, bukan MPA | Semua route di-handle JS di satu file HTML, `display:none` toggle antar "halaman" | Tidak SEO-friendly, tidak sesuai requirement MPA |
| API key ter-expose | `RAWG_API_KEY` hardcoded di client-side JS | Bisa di-abuse pihak lain, quota gampang habis |
| Tidak ada backend | Semua data game hardcoded di array JS | Tidak bisa update katalog tanpa edit kode & deploy ulang |
| Cover image live-fetch | Tiap render card manggil RAWG API per game, rasio gambar tidak konsisten (`object-fit: cover` doang) | Lambat, boros quota API, visual tidak rapi |
| Checkout tanpa persistensi | Order cuma dibentuk jadi pesan WhatsApp, tidak pernah disimpan | Tidak ada riwayat transaksi, rawan kehilangan data order |
| Tidak ada admin tooling | Tambah/ubah game = edit kode manual | Tidak scalable untuk 1400+ produk |

### 1.2 Kendala Pengambilan Data Katalog

Toko Shopee sumber data (`shopee.co.id/link.yu`, shopid `602098742`, item_count **1445**) memblokir akses terprogram ke daftar produk — endpoint `search_items`, `rcmd_items` mengembalikan `403 Forbidden` (anti-scraping WAF), hanya endpoint info toko (`get_shop_detail`) yang bisa diakses publik.

Sebagai sumber tambahan, ditemukan `https://linkyuu.github.io/LISTGAME/` (username GitHub `linkyuu` = username Shopee `link.yu` — kemungkinan besar feed data yang sama dipakai untuk situs berjalan client saat ini). File `data_game.js` di repo tersebut berhasil ditarik langsung (`raw.githubusercontent.com`, statis, tidak diblokir) dan sudah digabung ke `data/games_raw.csv`: menambahkan 13 judul baru beneran (007 First Light, Forza Horizon 6, FIFA 2026, Moto GP 2026, Paralives, Outbound, Undisputed, Subnautica 2, Mixtape, Dead As Disco, CarX Drift Racing 2, Directive 8020, LEGO Batman: Legacy of the Dark Knight, Tomodachi Life) dan menandai 67 judul existing sebagai `[NEW GAME]` (dipakai sebagai sinyal badge "Baru" — lihat Bab 5 & 7).

Total **1445** di Shopee kemungkinan mencakup listing non-game (paket bundling, jasa, item variasi) — bukan murni 1445 judul game unik. Sisa gap dari 1029 ke 1445 tetap memerlukan tindakan client (lihat Bab 6.4), tapi tidak lagi jadi blocker untuk mulai development.

---

## 2. Tujuan & Non-Tujuan

### 2.1 Tujuan (in-scope)
- Website **multi-page**, fast & SEO-friendly, sanggup menampung **1400+ game** tanpa lag.
- Backend terpusat di **Supabase** (Postgres + Auth + Storage) sebagai single source of truth.
- Cover art tiap game **rapi & konsisten** (rasio seragam, kualitas tinggi), di-generate lewat pipeline ETL — bukan fetch API real-time di browser.
- **Dashboard admin** lengkap: kelola game (CRUD, bulk import, override cover/harga), kelola pesanan, kelola kategori.
- Checkout tetap pakai alur **konfirmasi manual via WhatsApp** (sesuai model bisnis berjalan), tapi disimpan ke database (bukan cuma jadi pesan WA yang hilang) dan arsitekturnya siap ditambah payment gateway otomatis tanpa rombak ulang.
- Guest checkout tetap bisa (tanpa daftar akun), opsional akun customer (riwayat pesanan, wishlist) karena toh butuh sistem auth buat admin juga.

### 2.2 Non-Tujuan (Phase 1 — didorong ke fase berikutnya)
- Integrasi payment gateway otomatis (Midtrans/Xendit) — Phase 2.
- Marketplace multi-seller.
- Aplikasi mobile native.
- Sistem loyalty/poin/voucher kompleks.

---

## 3. Target Pengguna

| Persona | Kebutuhan |
|---|---|
| **Customer (guest)** | Cari & beli game cepat tanpa ribet daftar akun |
| **Customer (terdaftar)** | Riwayat pesanan, wishlist, checkout lebih cepat |
| **Admin/Owner** | Kelola 1400+ game, proses pesanan masuk, atur harga/promo, tanpa minta tolong developer tiap kali ada perubahan |

---

## 4. Arsitektur yang Diusulkan

### 4.1 Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend framework | **Next.js (App Router)** | Tiap route = halaman server-rendered sungguhan (memenuhi requirement MPA + SEO), ekosistem integrasi Supabase paling matang (`@supabase/ssr`), native di Vercel |
| Hosting | **Vercel** | Sesuai requirement, auto-deploy dari Git, Edge/CDN built-in |
| Backend | **Supabase** (Postgres, Auth, Storage, RLS) | Sesuai requirement, row-level security menggantikan kebutuhan backend server custom |
| Image delivery | Supabase Storage + Next.js Image Optimization | Resize/transform on-demand, gak perlu generate banyak ukuran manual |
| Validasi form | Zod | Validasi konsisten client & server |

> **Asumsi yang perlu dikonfirmasi:** Next.js App Router dipilih sebagai default dari 3 opsi yang sempat didiskusikan (Next.js / Astro / Vanilla Multi-Page). Lihat Bab 11.

### 4.2 Peta Halaman (Site Map)

| Route | Deskripsi | Akses |
|---|---|---|
| `/` | Beranda + katalog (search, filter kategori, pagination) | Publik |
| `/game/[slug]` | Detail game (deskripsi, screenshot/trailer pre-fetched, tombol beli) | Publik |
| `/cart` | Keranjang belanja | Publik (session/local) |
| `/checkout` | Form checkout (Player ID, data guest/akun) | Publik |
| `/checkout/[order_number]` | Konfirmasi order + redirect WhatsApp | Publik |
| `/akun/masuk`, `/akun/daftar` | Login/register customer | Publik |
| `/akun/pesanan` | Riwayat pesanan | Customer login |
| `/akun/wishlist` | Wishlist tersimpan | Customer login |
| `/admin/masuk` | Login admin | Publik (form), role-gated |
| `/admin` | Dashboard overview (statistik) | Admin |
| `/admin/games` | Tabel kelola game (search/filter/bulk action) | Admin |
| `/admin/games/[id]` | Edit game (harga, cover override, status) | Admin |
| `/admin/games/baru` | Tambah game manual | Admin |
| `/admin/games/import` | Bulk import CSV (lihat Bab 8) | Admin |
| `/admin/pesanan` | Kelola pesanan masuk | Admin |
| `/admin/pesanan/[id]` | Detail pesanan + update status | Admin |
| `/admin/kategori` | Kelola kategori | Admin |
| `/admin/pengaturan` | No. WA, harga default, banner promo | Admin |

### 4.3 Keamanan Akses
Semua proteksi route admin dilakukan **server-side** (middleware Next.js cek session + `profiles.role = 'admin'`), bukan cuma disembunyikan di UI. Database diproteksi **Row Level Security (RLS)** di setiap tabel — lihat `supabase/schema.sql`.

---

## 5. Data Model

Skema lengkap ada di [`supabase/schema.sql`](supabase/schema.sql) (siap dijalankan di Supabase SQL editor). Ringkasan tabel:

| Tabel | Fungsi |
|---|---|
| `categories` | Lookup Ringan/Sedang/Agak Berat/Berat |
| `games` | Data game: nama, slug, harga, cover, status (draft/active/archived), kategori, `is_new` (badge "Baru" dari tag sumber data), `is_featured` (highlight kurasi admin) |
| `game_media` | Screenshot/trailer per game, **pre-fetched** (bukan live call ke RAWG tiap buka halaman) |
| `profiles` | Extend `auth.users`, simpan role (`customer`/`admin`) |
| `orders` | Pesanan (status: pending → confirmed → paid → processing → completed/cancelled) |
| `order_items` | Item per pesanan, snapshot nama & harga saat transaksi |
| `wishlists` | Wishlist customer login |
| `import_jobs` | Audit log tiap run ETL/bulk import |

Checkout dilakukan lewat **RPC `create_order()`** (transaksi atomik order + items sekaligus, lihat schema), bukan insert terpisah dari client — menghindari order setengah-jadi kalau ada error di tengah proses.

Index `pg_trgm` dipasang di `games.name` supaya search-as-you-type tetap cepat walau katalog 1400+ baris.

---

## 6. Pipeline Data Katalog & Cover Art

Ini bagian yang udah dibangun & ditest di sesi ini (lihat folder `scripts/` dan `data/`).

### 6.1 Alur 3 Tahap

```
index (1).html  ──┐
                   ├──①──► data/games_raw.csv ──②──► data/games_import.csv
data_game.js    ──┘         (1029 game, merged,        + cover_url, cover_source,
(linkyuu.github.io)         deduped, is_new flag)       confidence (per game)
                                                                    │
                                                                    ③
                                                                    ▼
                                                          Supabase: tabel `games`
                                                          + Storage bucket `game-covers`
```

**① `scripts/extract_games.py`** — parse blok `rawCSV`/`csvData` dari satu atau lebih sumber (HTML lama + `data_game.js` dari `linkyuu.github.io/LISTGAME`), bersihkan tag `[NEW GAME]`/`Hypervisor`, merge & dedupe (sumber lebih baru menang kalau ada konflik size/kategori, tag `[NEW GAME]` jadi kolom `is_new`), keluarkan `data/games_raw.csv`. *(Sudah dijalankan: 1029 game unik, 67 ditandai `is_new=true`.)*

**② `scripts/fetch_covers.py`** — untuk tiap game:
1. Cari di **SteamGridDB** (sumber utama — cover art kurasi komunitas, akurasi match jauh lebih baik daripada nebak via endpoint pencarian Steam yang tidak resmi).
2. Kalau tidak ketemu, fallback ke **RAWG API**.
3. Kalau tetap tidak ketemu, generate placeholder otomatis (bukan broken image).
4. Gambar yang ketemu **didownload, di-crop/fit ke rasio 3:4 tetap (600×800)**, dikonversi ke **WebP** — supaya semua card di grid konsisten visualnya, tidak tergantung rasio asli sumber gambar.
5. **Idempotent & resumable**: progress disimpan per-game (`data/covers_progress.json`), checkpoint tiap 25 game, aman di-Ctrl+C dan dilanjut kapan saja, dan otomatis skip game yang sudah pernah berhasil diproses kalau script dijalankan ulang (penting karena katalog akan terus tumbuh).
6. Output: `data/games_import.csv` (siap import) + `data/qc_report.csv` (daftar game yang hasil cover-nya "low confidence"/placeholder/error, untuk direview manual sebelum publish).

**③ `scripts/upload_to_supabase.py`** — upload cover ke Supabase Storage, upsert ke tabel `games`. Game baru masuk sebagai **status `draft`** (tidak langsung tampil ke publik) sampai direview lewat dashboard admin. Game yang sudah ada **tidak ditimpa** kalau adminnya sudah override cover secara manual (`cover_source = 'manual'`) — supaya re-run script tidak menghapus kerja manual admin.

### 6.2 Cara Menjalankan

```bash
pip install -r scripts/requirements.txt
cp .env.example .env   # isi STEAMGRIDDB_API_KEY (gratis, daftar di steamgriddb.com) & RAWG_API_KEY

python scripts/extract_games.py            # sudah dijalankan, hasil ada di data/games_raw.csv
python scripts/fetch_covers.py --limit 20  # test dulu pada 20 game
python scripts/fetch_covers.py             # full run (1029 game, ~10-15 menit)
python scripts/upload_to_supabase.py       # upload ke Supabase (isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY dulu)
```

### 6.3 Kontrol Kualitas (QC)
Karena matching otomatis tidak akan 100% akurat untuk 1000+ judul (terutama game generik/ambigu), dashboard admin punya **halaman review QC** yang menampilkan semua game dengan `cover_source IN ('placeholder','rawg')` atau `confidence IN ('low','none')`, supaya admin tinggal cek & ganti cover yang salah, bukan trust 100% otomatis.

### 6.4 Menutup Gap Katalog (1029 → 1445+)
Karena Shopee memblokir scraping daftar produk terprogram, sumber data tambahan harus didapat dari salah satu:
1. **Export Seller Centre Shopee** (paling direkomendasikan, kalau client punya akses login toko).
2. Screenshot/copy-paste manual per halaman, diproses bertahap.

Pipeline di atas (②③) dirancang menerima **CSV apa pun** dengan kolom `name,size,category` — jadi begitu data tambahan didapat, tinggal digabung ke `games_raw.csv` (atau diupload langsung lewat fitur **Bulk Import** di dashboard admin) dan dijalankan ulang. Tidak perlu tulis kode baru.

---

## 7. Fitur Customer-Facing

| Fitur | Detail |
|---|---|
| Browse & search | Search-as-you-type (trigram index), filter kategori, **server-side pagination** (24-48 game/halaman — bukan render 1400+ card sekaligus seperti versi lama) |
| Badge "Baru" | Game dengan `is_new = true` (dari tag `[NEW GAME]` di feed sumber) tampil dengan badge khusus + bisa difilter/section terpisah di beranda ("Baru Ditambahkan") |
| Detail game | Galeri media pre-fetched (bukan live API call), harga, tombol beli/keranjang |
| Keranjang | Tambah/hapus item, persist di local storage (guest) atau DB (login) |
| Checkout | Form Player ID + data kontak → `create_order()` RPC → redirect WhatsApp admin dengan pesan terformat (alur sama seperti sekarang, tapi order **tersimpan di DB**) |
| Akun (opsional) | Daftar/masuk via Supabase Auth (email atau Google), riwayat pesanan, wishlist |

---

## 8. Dashboard Admin (Fitur Baru)

### 8.1 Overview / Beranda Admin
Kartu statistik: total game (active/draft), pesanan pending, revenue bulan ini, jumlah game yang butuh review QC cover.

### 8.2 Manajemen Game
- Tabel game dengan **search, filter (kategori/status), sort, pagination server-side** (wajib — tabel 1400+ baris tidak boleh di-load sekaligus ke browser).
- Edit per game: nama, deskripsi, harga & harga coret, kategori, status (draft/active/archived), **upload/ganti cover manual** (drag & drop → langsung ke Supabase Storage, otomatis set `cover_source = 'manual'` supaya tidak ketimpa pipeline ETL lain kali).
- Bulk action: publish banyak draft sekaligus, ubah kategori massal.
- **Bulk Import**: upload CSV (`games_import.csv` dari pipeline atau format manual) → preview perbedaan (game baru vs update) → konfirmasi → eksekusi.
- **Halaman Review QC**: filter cepat ke game dengan cover hasil placeholder/low-confidence.

### 8.3 Manajemen Pesanan
- List pesanan dengan filter status & tanggal, search by Player ID/nomor order.
- Detail pesanan: item dibeli, data customer, total.
- Update status (pending → confirmed → paid → processing → completed/cancelled).
- Tombol "Chat WhatsApp" langsung ke nomor customer dengan template pesan.
- Export pesanan ke CSV.

### 8.4 Manajemen Kategori & Pengaturan
- CRUD kategori (Ringan/Sedang/Agak Berat/Berat, bisa nambah kategori baru).
- Pengaturan toko: nomor WhatsApp admin, harga default & harga coret default, persen "hemat", banner/promo.

---

## 9. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Performa** | Pagination/server-side rendering untuk katalog (bukan render 1400+ DOM node sekaligus), lazy-load gambar, index `pg_trgm` untuk search cepat |
| **SEO** | Server-rendered per halaman, meta tag dinamis per game (title/description/og:image dari `cover_url`), `sitemap.xml` ter-generate otomatis untuk semua `/game/[slug]`, `robots.txt` |
| **Keamanan** | RLS aktif di semua tabel, `service_role` key Supabase **tidak pernah** dikirim ke client, proteksi route admin di server (middleware), validasi input (Zod) di semua form, rate-limit pada `create_order` untuk cegah spam order |
| **Skalabilitas** | Schema & UI sudah didesain untuk 1400+ item dan terus bertumbuh, tidak ada hardcoded limit |
| **Aksesibilitas** | Semantic HTML, `alt` text otomatis dari nama game, keyboard-navigable cart/checkout |
| **Observability** | `import_jobs` sebagai audit trail tiap proses import/ETL, error logging via Vercel |

---

## 10. Risiko & Catatan Penting

| Risiko | Penjelasan | Mitigasi |
|---|---|---|
| Hak cipta cover art | Cover di-source dari SteamGridDB/RAWG/Steam CDN untuk situs komersial — area abu-abu hak cipta/ToS, risiko kecil untuk skala toko ini tapi bukan nol | Disebutkan secara terbuka ke client untuk keputusan bisnis mereka sendiri; gambar di-rehost ke Storage sendiri (bukan hotlink permanen ke CDN pihak ketiga) supaya minimal tidak rapuh secara teknis |
| Data lama kotor | Beberapa baris di HTML lama format-nya tidak konsisten (koma hilang, kategori huruf kecil) | Sudah ditangani defensif di script (`extract_games.py`, `upload_to_supabase.py`), tapi disarankan ada **manual data-quality pass** sebelum go-live |
| Gap katalog | 1029 vs 1445 target (klaim Shopee, kemungkinan termasuk listing non-game) | Lihat Bab 6.4 — butuh aksi dari client (akses Seller Centre / data manual), bukan blocker teknis |
| Scraping Shopee diblokir | API listing produk Shopee 403 untuk request terprogram | Tidak ada workaround scraping yang reliable & legal; rekomendasi export resmi |

---

## 11. Asumsi yang Perlu Dikonfirmasi Client

Beberapa keputusan arsitektur di PRD ini diambil sebagai **default rekomendasi developer** karena sempat belum dikonfirmasi eksplisit. Mohon dikonfirmasi/dikoreksi sebelum development dimulai:

1. **Framework**: Next.js App Router (vs Astro vs vanilla multi-page HTML) — direkomendasikan karena ekosistem Supabase+Vercel paling matang.
2. **Checkout**: tetap manual via WhatsApp di Phase 1 (vs langsung integrasi payment gateway) — direkomendasikan karena sesuai alur bisnis berjalan, gateway bisa ditambah di Phase 2 tanpa rombak skema.
3. **Auth customer**: guest checkout + akun opsional (vs guest-only) — direkomendasikan karena sistem auth sudah wajib ada untuk login admin, jadi marginal cost rendah untuk sekalian buka akun customer.
4. **Katalog**: lanjut development dengan 1029 game sekarang (sudah dikonfirmasi client, lihat Bab 1.2), sisanya menyusul via Bulk Import begitu client siapkan datanya (vs menunda development sampai data lengkap).

---

## 12. Roadmap Bertahap

| Fase | Cakupan |
|---|---|
| **Fase 0** *(selesai sesi ini)* | Audit data lama, pipeline ETL cover art, skema Supabase |
| **Fase 1 — MVP** | Storefront Next.js (katalog/detail/cart/checkout WA), Supabase live, Dashboard admin inti (CRUD game + bulk import + kelola pesanan), deploy Vercel |
| **Fase 2** | Integrasi payment gateway otomatis, polish akun customer (riwayat/wishlist), SEO hardening (sitemap, structured data) |
| **Fase 3** | Analytics/laporan penjualan, sistem promo/voucher, activity log, multi-role admin |

---

## 13. Lampiran — Berkas yang Sudah Dibuat Sesi Ini

```
Arka Gamez/
├── index (1).html              # prototype lama (referensi)
├── PRD.md                      # dokumen ini
├── .env.example                # template environment variable
├── data/
│   └── games_raw.csv           # 1029 game, hasil extract+merge+dedupe (2 sumber)
├── scripts/
│   ├── extract_games.py        # ① HTML lama → CSV bersih
│   ├── fetch_covers.py         # ② CSV → cover art ternormalisasi (WebP 3:4)
│   ├── upload_to_supabase.py   # ③ Upload ke Supabase Storage + DB
│   └── requirements.txt
└── supabase/
    └── schema.sql               # skema lengkap + RLS policies
```
