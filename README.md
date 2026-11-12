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

Letakkan file gambar di `assets/cars/`, dengan nama lowercase seperti `avanza_2020.png`, `brio_2021.jpg`, atau `xpander_2022.webp`. Saat kendaraan ditambahkan, aplikasi membentuk nama file dari model dan tahun lalu mencoba beberapa ekstensi. Jika file tidak ditemukan, gambar mobil fallback akan ditampilkan. Pastikan foto yang digunakan memang memiliki izin penggunaan.

## Deploy

Proyek ini statis, tanpa proses build. Isi seluruh folder ke repository GitHub lalu deploy folder root ke Vercel atau GitHub Pages. HTTPS diperlukan untuk instalasi PWA di deployment. Vercel dapat memakai preset Static/Other; GitHub Pages dapat menerbitkan dari root branch.

## Isi proyek

- `index.html`, `css/`, `js/`: antarmuka dan aplikasi.
- `manifest.webmanifest`, `sw.js`: instalasi dan cache PWA.
- `assets/icons/`: ikon aplikasi.
- `assets/cars/`: tempat foto kendaraan milik proyek.
- `firestore.rules`: contoh aturan akses per pengguna.

Mode demo menyimpan data pada browser yang sama (localStorage), bukan ke cloud.
