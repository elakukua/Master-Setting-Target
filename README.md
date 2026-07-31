# AIM+ AP Target Setting — Decision Workbook

Situs statis untuk proses penetapan target Area Programme siklus **AIM+ FY27–FY30**.
PEARL · Wahana Visi Indonesia.

Sembilan lembar laporan (`HOME`, `01`–`08`) plus satu lembar setup (`00_MASTER`).
Tanpa build step, tanpa dependency, tanpa server — cukup HTML, CSS, dan satu file JavaScript.

| Lembar | Menjawab apa |
|---|---|
| `HOME` | Cakupan siklus dan sejauh mana target sudah disetujui. Tidak memuat informasi kualitas data — submission masih bergerak, jadi halaman ini berorientasi hasil. |
| `01_NATIONAL` | **Tren antar AP dari data tingkat nasional.** AP mana yang mengusulkan pergerakan seberapa jauh, dan apakah usulannya mencapai threshold. |
| `02_ZONAL` | **Perbandingan antar indikator di dalam satu zonal.** Indikator mana yang diusulkan mendarat di threshold, mana yang dibiarkan jauh tertinggal. |
| `03_AP` | Dossier satu AP untuk dibawa ke workshop, 30 baris tetap, satu halaman A4. |
| `04_OUTCOME` | Satu outcome menyeluruh di semua AP, untuk diskusi sektor. |
| `05_INDICATOR` | Satu baris indikator secara forensik, dengan definisi dan riwayat keputusannya. |
| `06_DECISIONS` | Log keputusan, append-only. Satu-satunya tempat mencatat. |
| `07_DATAQUALITY` | Daftar koreksi untuk DMEAL. Sengaja tidak ditampilkan di HOME. |
| `08_REFERENCE` | Definisi indikator, threshold, legenda, FAQ, QA checklist. |

---

## 0 · Kode akses

Halaman dibuka dengan kode **`wvipearl`**. Kode diminta sekali per sesi browser.

> **Ini pagar sopan, bukan pengamanan.** Repository-nya publik, jadi siapa pun yang membuka
> `assets/app.js` atau folder `data/` di GitHub bisa membaca kodenya dan seluruh datanya
> tanpa melewati halaman ini. Fungsinya hanya mencegah orang yang tidak sengaja menemukan
> tautannya ikut membaca. Selama isinya masih angka kerja yang belum final, itu cukup.
>
> Kalau suatu saat isinya tidak boleh terbaca publik, kode di halaman tidak akan menolong —
> yang diperlukan: repository privat (GitHub Pages untuk repo privat perlu paket Team ke atas),
> hosting internal WVI di belakang OneLogin, atau tidak menaruh angka itu di situs publik sama sekali.

Mengubah kodenya: cari `GATE_CODE` di `assets/app.js`, ganti isinya, commit.

---

## 1 · Publikasi ke GitHub Pages

1. Buat repository baru, misal `aimplus-target-setting`.
2. Upload seluruh isi folder ini ke **root** repository (bukan di dalam subfolder).
3. Buka **Settings → Pages**.
4. *Source*: **Deploy from a branch**. *Branch*: `main`, folder `/ (root)`. **Save**.
5. Tunggu satu sampai dua menit. Alamatnya:
   `https://<akun>.github.io/<nama-repo>/`

Kalau repo bersifat privat, GitHub Pages hanya tersedia untuk akun Team/Enterprise.
Alternatifnya: Netlify Drop, atau buka `index.html` langsung dari folder — semuanya jalan
tanpa server karena data dimuat lewat `<script src>`, bukan `fetch`.

File `.nojekyll` sudah disertakan supaya GitHub tidak memproses folder ini sebagai blog Jekyll.

---

## 2 · Struktur file

```
index.html                 kerangka halaman
assets/app.css             seluruh styling — palet, status, cetak
assets/app.js              engine + sepuluh lembar
data/ap-register.js        daftar 17 AP + PETA OUTCOME per AP
data/indicators.js         katalog 26 indikator + register threshold
data/master.js             tblMaster — satu baris per AP × indikator
data/decisions.js          tblDecision — log keputusan (append-only)
.nojekyll
README.md
```

Empat file di `data/` adalah satu-satunya tempat data berada. `assets/` tidak perlu disentuh
saat data berubah.

---

## 3 · Tiga cara mengubah data

### a. Edit file langsung di GitHub — untuk perubahan kecil
Buka `data/master.js` di GitHub, klik ikon pensil, ubah angkanya, commit.
Halaman langsung ikut berubah setelah Pages selesai deploy.

### b. Paste dari Excel — untuk ganti seluruh submission
Tombol **⤓ Import submissions** di toolbar. Blok data disalin dari Excel tanpa baris header,
16 kolom, urutan sesuai `tblMaster`. Persentase boleh `0.235` atau `23.5%`.
AP baru yang belum ada di register otomatis ditambahkan.
Setelah itu buka **00_MASTER → Save & publish** dan unduh `master.js` untuk di-commit.

### c. Sheet `00_MASTER` — untuk koreksi manual per baris
Isinya: pengaturan siklus, peta outcome, katalog indikator, editor data per AP,
dan log keputusan. Setiap perubahan langsung menghitung ulang seluruh model.

> Perubahan di halaman disimpan di **browser Anda saja** (localStorage), bukan di repository.
> Halaman statis tidak bisa menulis balik ke GitHub. Alurnya:
> **edit di 00_MASTER → unduh file data → commit di GitHub.**
> Tombol *Discard local edits* mengembalikan tampilan ke data repo.

---

## 4 · Peta Outcome per AP

Tiap AP punya pilihan outcome sendiri. Peta itu ada di `data/ap-register.js`:

```js
{zonal:"NTT", ap:"Rote Ndao", ap_id:"05232", strategic:"Full AP",
 outcomes:["Goal","OC 1","OC 2","OC 3"]}          // OC 4 tidak dikerjakan AP ini
```

Bisa juga diklik langsung di **00_MASTER → Outcome map per AP**:

- klik satu titik untuk menyalakan/mematikan satu outcome pada satu AP
- klik **judul kolom** untuk menyalakan/mematikan outcome itu pada semua AP sekaligus
  (● semua aktif · ◐ sebagian · ○ tidak ada)

**Efeknya, otomatis di seluruh halaman:** baris yang outcome-nya tidak aktif untuk AP tersebut
menjadi **REFERENCE** — tetap terlihat, tidak dihitung dalam readiness, dan tidak pernah
dianggap penghambat. Ini persis definisi REFERENCE pada spesifikasi:
*"tidak berlaku untuk AP ini / hanya informasi"*. Tidak ada data yang terhapus; nyalakan
kembali dan baris itu masuk lagi ke antrean.

Karena itu **Approval Progress dihitung terhadap baris in-scope**, bukan seluruh baris —
kalau tidak, target 90% tidak akan pernah tercapai selama ada AP yang tidak mengerjakan
satu outcome. Angka in-scope dan out-of-scope tertulis di bawah bar progres pada `HOME`,
dan ada kartu **Not applicable** di `01_NATIONAL`.

---

## 4b · Cara `01_NATIONAL` dan `02_ZONAL` membandingkan

Dua halaman itu tidak membandingkan persentase mentah antar indikator, karena stunting 14%
dan literasi 80% bukan skala yang sama, dan indikator reduksi bergerak ke arah berlawanan.
Yang dibandingkan adalah dua ukuran yang aman terhadap arah dan skala:

**Jarak ke threshold** (satuan poin persentase, `pp`). Diukur ke arah yang dianggap perbaikan,
jadi indikator reduksi — stunting, kekerasan, perkawinan anak — berada di skala yang sama
dengan indikator kenaikan. **0 pp berarti threshold tercapai.**

**Gap closure.** Bagian dari jarak baseline→threshold yang ditutup oleh target usulan:

```
gap closure = (target − baseline) / (threshold − baseline)      arah disesuaikan
```

100% artinya target mendarat tepat di threshold, di atas 100% melampauinya, di bawah 100%
belum sampai. Ini yang membuat ambisi 17 AP dan 26 indikator bisa dijajarkan.

Tiga penjagaan supaya angkanya tidak menipu:

- **median, bukan rata-rata** — satu indikator ekstrem tidak bisa menggeser penilaian satu AP
- **gap di bawah 1 pp tidak dihitung sebagai rasio** — baseline yang sudah nyaris menyentuh
  threshold akan menghasilkan rasio liar; baris seperti itu dinilai cukup dari tercapai atau tidak
- **rasio dibatasi 200%**, dan baris dengan proporsi di luar 0–100% dikeluarkan dari kedua
  ukuran ini — kesalahan input tidak boleh menyetir tampilan hasil. Baris itu tetap muncul
  utuh di `07_DATAQUALITY`.

---

## 5 · Format `data/master.js`

```js
window.WVI_MASTER = {
  columns: ["Zonal","AP","AP_ID","Outcome","Code","Num_Base","Den_Base","Pct_Base",
            "Num_LOP","Den_LOP","Pct_LOP","Delta","AP_Proposal","Threshold","AP_vs_Threshold"],
  rows: [
    ["Kalbar","Bengkayang","05144","OC 1","OIOS 97",68,275,0.247,487,833,0.585,0.34,0.34,1,"Set target"]
  ]
};
```

Aturan yang harus dijaga:

| Hal | Aturan |
|---|---|
| Proporsi | disimpan sebagai fraksi. `0.247` = 24,7% |
| Tidak ada data | `null`. **Bukan** `0` — nol berarti nilainya benar-benar nol |
| Threshold TBC | `null` |
| `Code` | harus ada di `data/indicators.js`, karena nama indikator diambil dari sana |
| `Outcome` | salah satu dari `Goal`, `OC 1`, `OC 2`, `OC 3`, `OC 4` |
| `AP_vs_Threshold` | `Set target` atau `Monitor Indicator` |
| Kunci baris | `Zonal\|AP\|Code` harus unik. Duplikat memblokir distribusi (gate §4.4) |

---

## 6 · Sebelum workshop pertama

`data/decisions.js` yang disertakan berisi **167 baris contoh**, supaya lembar laporan
ada isinya saat pertama dibuka. Sekali saja, sebelum dipakai sungguhan:

1. **00_MASTER → Decision log → Clear the decision log**
2. **Save & publish → ⤓ data/decisions.js**, lalu commit file kosongnya

Setelah itu jangan pernah dikosongkan lagi — log itu jejak audit.
Revisi selalu **baris baru**, bukan edit baris lama, dan tidak ada tombol hapus di sheet 06.

---

## 7 · Pemeriksaan sebelum dibagikan

`08_REFERENCE → QA checklist` menjalankan 20 pemeriksaan §10.3 secara langsung dari data.
Sembilan belas dihitung otomatis; satu (print preview satu halaman) perlu dilihat manusia.
Jangan bagikan file kalau masih ada yang FAIL.

Pemeriksaan pertama, **import gate**, juga tampil di `HOME` dan `07_DATAQUALITY`.
Kalau ada Row_ID duplikat, gate berbunyi *DO NOT DISTRIBUTE* sampai duplikatnya diselesaikan.

---

## 8 · Catatan teknis

- **Cetak.** Ctrl/Cmd+P mencetak lembar yang sedang terbuka: A4 landscape, lebar satu halaman,
  slicer dan tombol tidak ikut tercetak. `03_AP` dirancang tepat satu halaman untuk dijadikan
  handout workshop; `08_REFERENCE` portrait sebagai annex.
- **Warna dan ikon.** Setiap status membawa ikon (`● ◆ ◧ ▲ –`), jadi tetap terbaca saat
  dicetak hitam-putih. Lima status saja, tidak ada yang keenam.
- **Tidak ada perhitungan target.** Situs ini menampilkan apa yang dikirim AP dan mencatat
  apa yang diputuskan review. Semua formula bersifat presentasi atau validasi.
- **Offline.** Tidak ada CDN, font eksternal, atau panggilan jaringan apa pun.
- **Browser.** Chrome, Edge, Firefox, Safari versi terkini. Layar sempit tetap terpakai,
  tabel bisa digeser horizontal.

---

## 9 · Data yang menyertai rilis ini

Nama AP, kode OIOS, definisi indikator, dan nilai threshold pada rilis ini masih
**placeholder yang masuk akal**, bukan angka AIM+ resmi. Ganti keempat file di `data/`
dengan submission asli sebelum dipakai untuk keputusan.

Versi: `v1.1` · 31 Juli 2026 — kode akses, HOME diringkas, `01` menjadi tren antar AP, `02` menjadi perbandingan indikator.
Versi: `v1.0` · 31 Juli 2026 · disusun mengikuti *AIM+ AP Target Setting Decision Workbook — Build Specification v1.0*.
