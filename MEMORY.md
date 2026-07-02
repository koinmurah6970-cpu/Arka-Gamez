# Link Yu — Catatan Pending

## Belum dikerjain

### 1. Fonnte WA Bot
- Token belum diisi di `web/.env.local` → `FONNTE_TOKEN=`
- Ambil token dari https://app.fonnte.com
- Setelah isi, langsung aktif — kode sudah siap

### 2. Steam Original Price
- Script sudah ada di `scripts/populate_steam_prices.py`
- Belum dijalankan — semua `original_price` masih Rp 350.000 (default lama)
- Cara jalanin:
  ```bash
  pip install -r scripts/requirements.txt
  set NEXT_PUBLIC_SUPABASE_URL=https://vpcmbicdancjwvmbzngx.supabase.co
  set SUPABASE_SERVICE_ROLE_KEY=<ambil dari Supabase dashboard>
  python scripts/populate_steam_prices.py
  ```
- Proses ~20 menit (1029 game, rate limit Steam 1.2 detik/request)

### 3. Email Notifikasi ke Customer
- Kode sudah ada, API key Resend sudah diisi
- **Blocked:** butuh domain sendiri untuk kirim ke semua customer
  - Sekarang hanya bisa kirim ke `koinmurah6970@gmail.com` (sandbox)
  - Setelah punya domain: verifikasi di https://resend.com/domains
  - Ganti `RESEND_FROM=noreply@domainkamu.com` di `.env.local` dan Vercel env vars

### 4. Vercel Environment Variables
- Setelah semua token siap, tambahkan ke Vercel dashboard (bukan cuma `.env.local`):
  - `FONNTE_TOKEN`
  - `RESEND_API_KEY`
  - `RESEND_FROM`

---

## Sudah jalan

- Storefront: katalog, filter kategori, search, pagination
- Kartu produk: size label, badge kategori warna, tombol cart + Beli Sekarang
- Checkout: direct checkout (`?direct=`) + cart checkout
- Email field di checkout (validasi format email)
- WA bot: kode siap, tinggal isi token Fonnte
- Email notif: kode siap, tinggal domain
- Request Game: form customer + halaman admin
- Admin dashboard: kelola pesanan, ubah status, notif WA+email
- Rebrand: Link Yu (dari GAMOS STORE)
- Harga: semua game Rp 10.000
