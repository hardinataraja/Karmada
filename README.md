# KARMADA

Webapp ringan untuk manajemen rental mobil, dibuat dengan HTML, CSS, dan JavaScript vanilla. Layout adaptif: dashboard adminpanel di laptop dan antarmuka bergaya aplikasi di ponsel. Firebase Authentication + Firestore opsional (compat SDK via CDN); tanpa konfigurasi Firebase, aplikasi dapat dicoba dalam mode demo lokal.

## Jalankan lokal

Buka folder melalui server HTTP statis (service worker tidak berjalan dari `file://`). Contoh:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Menghubungkan Firebase

1. Buat project Firebase dan aktifkan **Authentication > Email/Password** serta **Google**.
2. Buat Cloud Firestore database.
3. Salin konfigurasi web app Firebase ke `js/firebase-config.js` menggantikan nilai `YOUR_...`.
4. Tambahkan domain deployment ke Authentication > Settings > Authorized domains.
5. Terapkan Firestore Rules contoh di `firestore.rules`.

Konfigurasi Firebase web berisi identitas publik project (bukan service account/private key). Jangan pernah menaruh service-account key di aplikasi browser.

Data disimpan dengan isolasi per pengguna: `users/{uid}` dan subkoleksi `vehicles`, `bookings`. Terapkan dan tinjau Firestore Rules sebelum penggunaan nyata.

## Foto kendaraan

Foto dipilih lewat dropdown **Merk → Tipe → Tahun** di form *Tambah mobil*; semua foto untuk kombinasi itu tampil, dan Anda memilih satu sebagai foto utama. Klik foto di kartu armada untuk melihat semua fotonya.

1. Taruh foto di `assets/cars/` dengan nama `merk_tipe_tahun.ext` (foto tambahan: `merk_tipe_tahun_2.ext`). Contoh: `toyota_avanza_2023.png`.
2. Jalankan `python3 tools/generate_catalog.py` untuk memperbarui `js/catalog.js`.
3. Commit dan deploy. Detail ada di `assets/cars/README.md`.

Mobil yang merknya tidak ada di katalog bisa ditambah lewat opsi *Lainnya (tanpa foto)*. Pastikan foto yang digunakan memang memiliki izin penggunaan.

## Deploy

Proyek ini statis, tanpa proses build. Isi seluruh folder ke repository GitHub lalu deploy folder root ke Vercel atau GitHub Pages. HTTPS diperlukan untuk instalasi PWA di deployment. Vercel dapat memakai preset Static/Other; GitHub Pages dapat menerbitkan dari root branch.

## Isi proyek

- `index.html`, `css/`, `js/`: antarmuka dan aplikasi.
- `manifest.webmanifest`, `sw.js`: instalasi dan cache PWA.
- `assets/icons/`: ikon aplikasi.
- `assets/cars/`: foto kendaraan; `js/catalog.js`: daftar merk/tipe/tahun (dibuat otomatis); `tools/generate_catalog.py`: pembuatnya.
- `firestore.rules`: contoh aturan akses per pengguna.

Mode demo menyimpan data pada browser yang sama (localStorage), bukan ke cloud.
