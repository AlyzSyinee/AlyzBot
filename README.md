# ALYZ BOT v3.0 FINAL - Multi Bot WhatsApp Platform

Node.js + Express + Baileys (`@whiskeysockets/baileys` ^6.7.8). Frontend vanilla HTML/CSS/JS, neubrutalism monokrom.

## Struktur

```
index.js              server Express + manajemen bot (pairing code asli)
lib/utils.js          helper (owner, admin, download media, dll)
lib/loader.js         loader fitur + hot reload
lib/feature/*.js      satu file = satu perintah ({ name, run })
public/               halaman web (login, welcome, pair)
media/QR.jpg          HANYA untuk perintah .order
auth/                 sesi WhatsApp (harus di disk persisten)
```

## Jalankan lokal

```
npm install
npm start
```
Buka http://localhost:3000 , tahan sidik jari, lalu PAIR DEVICE.

## Deploy ke Render.com

1. Push folder ini ke GitHub.
2. Render > New > Web Service > pilih repo (atau pakai `render.yaml` via Blueprint).
3. Build Command: `npm install`  |  Start Command: `npm start`
4. Environment: `NODE_VERSION` = `20`
5. Tambah Disk: Name `auth`, Mount Path `/opt/render/project/src/auth`, Size `1 GB`.
   (Disk membutuhkan plan berbayar, mis. Starter. Plan Free tidak punya disk dan akan tidur saat idle.)
6. Deploy. Setelah restart, bot yang sudah pairing tersambung otomatis dari folder `auth`.

## Ganti sampul menu

Edit `lib/feature/menu.js`, ubah konstanta `MENU_COVER_LINK` di bagian atas file.
Isi `''` untuk menu teks saja. `media/QR.jpg` tidak dipakai menu; ganti file itu dengan QR asli untuk `.order`.

## Perintah

| Perintah | Fungsi |
|---|---|
| .menu | daftar fitur (otomatis dari folder fitur) |
| .rvo | reply foto/video sekali lihat |
| .selfmode on/off | owner saja |
| .delete | reply pesan untuk dihapus |
| .toptv | reply video jadi video note |
| .toimg / .tostc | stiker ke foto / foto ke stiker |
| .h / .tagall | mention semua member (admin/owner) |
| .open / .close | buka / tutup grup (admin/owner, bot harus admin) |
| .ban / .deleteban nomor | blok / buka blok member (pesannya dihapus bot) |
| .alyzkudet ya | keluarkan semua member non-admin (admin/owner, bot admin) |
| .getpp | foto profil (reply, tag, atau nomor) |
| .alyzmusik judul | cari dan kirim audio mp3 |
| .p teks 62xxx | kirim pesan ke nomor (owner saja) |
| .order | kirim media/QR.jpg |
| .owner / .info | info |

Tambah fitur: buat file baru di `lib/feature/`, export `{ name, run }`. Terbaca otomatis tanpa restart.

## Catatan

- Cooldown pairing 30 detik berlaku global (`global.lastPair`).
- Login sidik jari hanya tampilan di sisi klien, bukan keamanan sungguhan. Siapa pun yang tahu URL bisa membuka `/pair.html`.
- `.alyzmusik` memakai API publik pihak ketiga; format respons bisa berubah sewaktu-waktu.
