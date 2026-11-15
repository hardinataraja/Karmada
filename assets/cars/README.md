# Foto armada

Nama file wajib mengikuti pola (huruf kecil, pemisah `_`):

    merk_tipe_tahun.ext
    merk_tipe_tahun_2.ext      <- foto tambahan untuk mobil yang sama

Contoh:

    toyota_avanza_2023.png
    toyota_avanza_2023_2.jpg   (sudut lain)
    honda_brio_2025.png
    mitsubishi_xpander-cross_2024.webp   (tanda - = spasi di dalam nama)

Setelah menambah/mengganti foto, jalankan dari folder root proyek:

    python3 tools/generate_catalog.py

Perintah itu membuat ulang `js/catalog.js`, yang dipakai dropdown Merk -> Tipe -> Tahun
di form Tambah mobil. Nama tampilan khusus (BMW, CR-V, dll.) diatur di `names.json`.

Saran: ukuran maksimal ~1000 px lebar, format WebP/JPG, di bawah 150 KB per foto.
Pastikan Anda punya izin memakai foto tersebut.
