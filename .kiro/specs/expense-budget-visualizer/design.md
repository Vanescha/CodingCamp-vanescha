# Design — Expense & Budget Visualizer

## Struktur
- `index.html`: struktur halaman.
- `css/style.css`: seluruh styling.
- `js/script.js`: seluruh logika aplikasi.
- `.kiro/specs/expense-budget-visualizer/`: dokumentasi spesifikasi Kiro.

## Alur data
1. Pengguna mengisi form.
2. JavaScript memvalidasi input.
3. Objek transaksi dibuat.
4. Transaksi disimpan ke Local Storage.
5. UI, total, daftar transaksi, ringkasan kategori, grafik, dan ringkasan bulanan dirender ulang.
6. Saat transaksi dihapus, proses render ulang dilakukan kembali.

## Penyimpanan
Local Storage key:
- `expenseBudgetTransactions`
- `expenseBudgetTheme`

Tidak ada data yang dikirim ke server.
