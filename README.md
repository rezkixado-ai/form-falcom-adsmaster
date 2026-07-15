# Falcom Ads Landing + Dashboard Lead — Setup

## Struktur file
```
public/                  ← ini yang di-deploy sebagai website
  index.html              ← landing page
  assets/style.css
  assets/main.js
  admin/index.html        ← dashboard (login + tabel lead)
  admin/admin.css
  admin/admin.js
netlify/functions/       ← "server" kecil (Netlify Functions)
  _auth.js                ← helper login (jangan diakses langsung)
  admin-login.js
  get-leads.js
  update-lead.js
netlify.toml              ← config Netlify
package.json              ← dependency untuk functions
supabase-schema.sql        ← jalankan ini di Supabase dulu
```

## Langkah 1 — Setup Supabase
1. Buka project Supabase yang sudah ada (atau bikin baru khusus project ini)
2. Buka **SQL Editor** → New query → paste isi `supabase-schema.sql` → Run
3. Buka **Project Settings → API**, catat 3 hal ini:
   - `Project URL` (contoh: `https://xxxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (JANGAN PERNAH taruh ini di kode frontend — cuma dipakai di Netlify Functions)

## Langkah 2 — Isi Konfigurasi di Kode
1. Buka `public/assets/main.js`, ganti 3 baris paling atas:
   ```js
   var SUPABASE_URL = "https://xxxxx.supabase.co";
   var SUPABASE_ANON_KEY = "eyJxxxxxxx...";   // anon public key
   var WA_PHONE_NUMBER = "628xxxxxxxxxx";      // nomor WA Falcom
   ```
   (Anon key aman ditaruh di sini — memang didesain untuk publik, keamanan
   datanya dijaga lewat Row Level Security yang sudah diatur di schema.)

## Langkah 3 — Deploy ke Netlify
1. Push folder ini ke GitHub repo baru (atau drag-drop folder `public` + file lain langsung ke Netlify kalau belum pakai Git)
2. Di Netlify: **Add new site → Import from Git** (atau drag-drop)
3. Build settings: publish directory `public`, functions directory `netlify/functions` (biasanya otomatis kebaca dari `netlify.toml`)

## Langkah 4 — Set Environment Variables di Netlify (WAJIB)
Di Netlify: **Site settings → Environment variables**, tambahkan:
| Key | Value |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (rahasia!) |
| `ADMIN_PASSWORD` | password untuk login dashboard |
| `COOKIE_SECRET` | string acak panjang, bebas (misal 40 karakter acak) |

Setelah isi environment variables, **redeploy** site (Deploys → Trigger deploy) supaya function membaca variable barunya.

## Langkah 5 — Sambungkan Domain Sendiri
1. Netlify: **Domain settings → Add custom domain** → masukkan `ads.falcom-technology.com`
2. Netlify kasih instruksi CNAME record yang perlu ditambahin
3. Masuk ke pengelola DNS domain falcom-technology.com (biasanya di provider domain/hosting), tambahkan CNAME sesuai instruksi Netlify
4. Tunggu propagasi DNS (biasanya 15 menit – beberapa jam)

## Langkah 6 — Test
1. Buka landing page, isi form dengan data dummy, submit
2. Cek Supabase → Table Editor → `leads` → pastikan data masuk
3. Buka `/admin`, login pakai `ADMIN_PASSWORD`, pastikan data dummy tadi muncul
4. Ubah status/nilai deal/catatan di tabel, refresh halaman, pastikan tersimpan
5. Test tombol "Export CSV"

## Catatan keamanan
- Password dashboard ini cocok untuk 1 pengguna internal. Kalau nanti butuh
  beberapa akun sales dengan hak akses berbeda, upgrade ke Supabase Auth.
- Jangan pernah commit `SUPABASE_SERVICE_ROLE_KEY` ke Git — itu selalu lewat
  Netlify environment variables saja.
