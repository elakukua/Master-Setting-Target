/* =============================================================================
   assets/charts.js  ·  v2.0  (final)
   AIM+ AP Target Setting — Decision Workbook · Wahana Visi Indonesia
   -----------------------------------------------------------------------------
   Dua chart, satu file:

     WVIChart.dumbbell(rows, opts)   Baseline -> Evaluasi   (ganti dua bar biru/merah)
     WVIChart.bullet(rows, opts)     Capaian vs ambang batas (ganti dua bar teal/abu)
     WVIChart.animate(scope)         jalankan transisi setelah markup masuk DOM

   Keduanya mengembalikan STRING HTML, bukan menyentuh DOM — supaya cocok
   dengan pola string injection di app.js.

   Zero dependency. Tanpa CDN, tanpa fetch, tanpa SVG eksternal.
   Struktur berkas di data/ tidak diubah.

   PEMASANGAN
     1. Simpan sebagai assets/charts.js
     2. Di index.html, tambahkan ke antrean loader SEBELUM assets/app.js:
            ["assets/charts.js","charts.js"],
     3. Di app.js, ganti pembangun markup kedua chart itu dengan:
            el.innerHTML = WVIChart.dumbbell(rows);      atau .bullet(rows)
            WVIChart.animate(el);

   KONTRAK MASUKAN
     dumbbell : [{ code, name, baseline, evaluation, polarity? }]
     bullet   : [{ code, name, actual,   threshold,  polarity? }]

     Nilai boleh fraksi (0.292) maupun persen (29.2) — nilai <= 1 dianggap
     fraksi. null berarti data belum tersedia dan TIDAK PERNAH dibaca sebagai
     nol. Angka 0 adalah nol hasil ukur dan tetap ditampilkan.
   ============================================================================= */

(function (w) {
  'use strict';

  var C = w.WVIChart = w.WVIChart || {};

  /* ===========================================================================
     1 · POLARITAS  —  higher-is-better vs lower-is-better
     ---------------------------------------------------------------------------
     Dicari berurutan:
       1. field pada baris itu sendiri          row.polarity
       2. field di katalog data/indicators.js   polarity / direction / better /
                                                hib / higherIsBetter
       3. tabel cadangan di bawah, dikunci kode indikator
       4. default "higher"

     Jadi kalau Anda MENAMBAHKAN field di data/indicators.js nanti, modul ini
     langsung memakainya tanpa perlu diubah. Menambah field bukan mengubah
     struktur — baris lama tetap valid.

     >>> TABEL INI YANG PERLU ANDA PERIKSA. <<<
     Hanya tiga kode yang saya cukup yakin. Setiap indikator lower-is-better
     yang belum terdaftar akan tampil dengan zona baik di sisi yang salah dan
     panah arah yang salah. Itu tidak memicu error apa pun — hanya diam-diam
     salah, sampai ada yang memeriksa satu per satu.
  ========================================================================== */
  var LOWER_IS_BETTER = C.LOWER_IS_BETTER = {
    'OIOS 160': 1,      /* prevalensi underweight balita                     */
    'OIOS 22' : 1,      /* remaja yang mengalami kekerasan oleh pengasuh     */
    'OIOS 27' : 1       /* proporsi remaja yang menikah                      */
    /* tambahkan kode lain di sini setelah dicek ke definisi indikatornya */
  };

  function normPolarity(v) {
    if (v === true)  return 'higher';
    if (v === false) return 'lower';
    if (v == null)   return null;
    var s = String(v).toLowerCase();
    if (/low|turun|kecil|desc|down/.test(s)) return 'lower';
    if (/high|naik|besar|asc|up/.test(s))    return 'higher';
    return null;
  }

  /* Katalog indikator dicari lewat window kalau ada. Nama globalnya belum saya
     lihat, jadi beberapa kemungkinan dicoba dan gagalnya tidak fatal. */
  function lookupCatalog(code) {
    if (!code) return null;
    var srcs = [w.WVI_INDICATORS, w.WVI_INDICATOR, w.INDICATORS];
    for (var i = 0; i < srcs.length; i++) {
      var s = srcs[i];
      if (!s) continue;

      if (Object.prototype.toString.call(s) === '[object Array]') {
        for (var j = 0; j < s.length; j++) {
          if (s[j] && (s[j].code === code || s[j].Code === code)) return s[j];
        }
      } else if (s.rows && s.columns) {
        var ci = -1;
        for (var c = 0; c < s.columns.length; c++) {
          if (s.columns[c] === 'Code' || s.columns[c] === 'code') { ci = c; break; }
        }
        if (ci < 0) continue;
        for (var k = 0; k < s.rows.length; k++) {
          if (s.rows[k][ci] === code) {
            var o = {};
            for (var m = 0; m < s.columns.length; m++) o[s.columns[m]] = s.rows[k][m];
            return o;
          }
        }
      } else if (s[code]) {
        return s[code];
      }
    }
    return null;
  }

  function resolvePolarity(row, cat) {
    var p = normPolarity(row.polarity);
    if (p) return p;

    if (cat === undefined) cat = lookupCatalog(row.code);
    if (cat) {
      var keys = ['polarity', 'direction', 'better', 'hib', 'higherIsBetter'];
      for (var i = 0; i < keys.length; i++) {
        p = normPolarity(cat[keys[i]]);
        if (p) return p;
      }
    }
    return LOWER_IS_BETTER[row.code] ? 'lower' : 'higher';
  }

  /* ===========================================================================
     2 · UTILITAS BERSAMA
  ========================================================================== */
  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* null tetap null. 0 tetap 0. Nilai <= 1 dianggap fraksi. */
  function pct(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    if (isNaN(n)) return null;
    if (n > 0 && n <= 1) n = n * 100;
    return Math.max(0, Math.min(100, n));
  }

  function labelOf(r, cat) {
    var nm = r.name || (cat && (cat.name || cat.Indicator || cat.indicator)) || '';
    return (r.code ? r.code + ' \u00B7 ' : '') + nm;
  }

  /* ===========================================================================
     3 · DUMBBELL  —  Baseline -> Evaluasi
     ---------------------------------------------------------------------------
     Glyph menunjukkan ARAH NILAI (naik/turun), warna menunjukkan MEMBAIK atau
     MEMBURUK. Dua isyarat dipisah supaya indikator lower-is-better tidak
     tampil sebagai angka turun bersebelahan dengan panah naik.

     Titik baseline berupa cincin kosong, titik evaluasi terisi — bukan hanya
     dua gradasi warna. Itu yang membuat chart tetap terbaca saat dicetak
     hitam-putih dan untuk pembaca deuteranopia.
  ========================================================================== */
  C.dumbbell = function (rows, opts) {
    opts = opts || {};
    var dp = opts.decimals == null ? 1 : opts.decimals;
    var minDelta = opts.minDelta == null ? 0.05 : opts.minDelta;

    var out = ['<div class="dmb" role="group" aria-label="Tren baseline ke evaluasi per indikator">'];

    out.push(
      '<div class="dmb-leg">' +
        '<span><i class="dmb-k-base" aria-hidden="true"></i>Baseline</span>' +
        '<span><i class="dmb-k-eval" aria-hidden="true"></i>Evaluasi</span>' +
        '<span class="dmb-leg-note">Glyph menunjukkan arah nilai, warna menunjukkan membaik atau memburuk</span>' +
      '</div>'
    );

    for (var i = 0; i < (rows || []).length; i++) {
      var r   = rows[i] || {};
      var cat = lookupCatalog(r.code);
      var pol = resolvePolarity(r, cat);

      var label = labelOf(r, cat);
      var tip   = label + ' \u2014 ' +
                  (pol === 'lower' ? 'lebih rendah lebih baik' : 'lebih tinggi lebih baik');

      var a = pct(r.baseline), b = pct(r.evaluation);

      if (a === null || b === null) {
        out.push(
          '<div class="dmb-row dmb-tbc">' +
            '<div class="dmb-lab" tabindex="0" data-tip="' + esc(tip) + ' \u2014 data belum tersedia">' +
              esc(label) + '</div>' +
            '<div class="dmb-track" role="img" aria-label="data belum tersedia">' +
              '<div class="dmb-hatch" aria-hidden="true"></div></div>' +
            '<div class="dmb-val dmb-na">TBC</div>' +
            '<div class="dmb-dir dmb-flat" aria-hidden="true">\u2013</div>' +
          '</div>'
        );
        continue;
      }

      var delta = b - a;
      var flat  = Math.abs(delta) < minDelta;
      var improving = pol === 'lower' ? delta < 0 : delta > 0;

      var glyph, cls, srDir;
      if (flat) {
        glyph = '\u2013'; cls = 'dmb-flat'; srDir = 'tidak berubah';
      } else {
        glyph = delta > 0 ? '\u25B2' : '\u25BC';
        cls   = improving ? 'dmb-up' : 'dmb-down';
        srDir = (delta > 0 ? 'naik' : 'turun') + ', ' + (improving ? 'membaik' : 'memburuk');
      }

      var lo = Math.min(a, b), wd = Math.abs(delta);
      var sr = 'baseline ' + a.toFixed(dp) + ' persen, evaluasi ' + b.toFixed(dp) +
               ' persen, ' + srDir;

      out.push(
        '<div class="dmb-row">' +
          '<div class="dmb-lab" tabindex="0" data-tip="' + esc(tip) + '">' + esc(label) + '</div>' +
          '<div class="dmb-track" role="img" aria-label="' + esc(sr) + '" ' +
               'style="--a:' + a + '%;--b:' + b + '%;--lo:' + lo + '%;--w:' + wd + '%">' +
            '<div class="dmb-rail" aria-hidden="true"></div>' +
            '<div class="dmb-tick" style="left:25%" aria-hidden="true"></div>' +
            '<div class="dmb-tick" style="left:50%" aria-hidden="true"></div>' +
            '<div class="dmb-tick" style="left:75%" aria-hidden="true"></div>' +
            '<div class="dmb-conn" aria-hidden="true"></div>' +
            '<div class="dmb-dot dmb-base" aria-hidden="true"></div>' +
            '<div class="dmb-dot dmb-eval" aria-hidden="true"></div>' +
          '</div>' +
          '<div class="dmb-val">' + a.toFixed(dp) + '% \u2192 ' + b.toFixed(dp) + '%</div>' +
          '<div class="dmb-dir ' + cls + '" aria-hidden="true">' + glyph + '</div>' +
        '</div>'
      );
    }

    out.push('</div>');
    return out.join('');
  };

  /* ===========================================================================
     4 · BULLET  —  Capaian vs ambang batas
     ---------------------------------------------------------------------------
     Ambang warna:
        gap <= 5 poin persentase  -> hijau
        5 < gap <= 30             -> amber
        gap > 30                  -> merah
     gap dihitung terbalik untuk indikator lower-is-better; gap negatif
     (sudah melewati ambang di arah yang benar) masuk hijau.

     Zona baik dibayang — kanan garis ambang untuk higher-is-better, kiri untuk
     lower-is-better. Aturan bacanya jadi satu untuk semua baris: bar yang
     berakhir di dalam bayangan berarti bagus. Panjang bar tidak lagi menjadi
     satu-satunya isyarat, sehingga indikator lower-is-better tidak bekerja
     dengan logika terbalik dari baris lain.
  ========================================================================== */
  function sevOf(gap) {
    if (gap <= 5)  return 'ok';
    if (gap <= 30) return 'warn';
    return 'bad';
  }

  C.bullet = function (rows, opts) {
    opts = opts || {};
    var dp = opts.decimals == null ? 1 : opts.decimals;

    var out = ['<div class="blt" role="group" aria-label="Capaian terhadap ambang batas per indikator">'];

    out.push(
      '<div class="blt-leg">' +
        '<span><i class="blt-k-zone" aria-hidden="true"></i>zona baik</span>' +
        '<span><i class="blt-k blt-ok"   aria-hidden="true"></i>gap \u2264 5</span>' +
        '<span><i class="blt-k blt-warn" aria-hidden="true"></i>5\u201330</span>' +
        '<span><i class="blt-k blt-bad"  aria-hidden="true"></i>&gt; 30</span>' +
        '<span class="blt-leg-note">garis tegak = ambang batas \u00B7 anyaman = kelebihan di arah yang salah</span>' +
      '</div>'
    );

    for (var i = 0; i < (rows || []).length; i++) {
      var r   = rows[i] || {};
      var cat = lookupCatalog(r.code);
      var pol = resolvePolarity(r, cat);
      var low = pol === 'lower';

      var label = labelOf(r, cat);
      var tip   = label + ' \u2014 ambang batas adalah batas ' + (low ? 'atas' : 'bawah');

      var a = pct(r.actual), t = pct(r.threshold);
      var tStr = t === null ? '\u2026' : t.toFixed(dp) + '%';
      var sign = low ? '\u2264' : '\u2265';

      if (a === null) {
        out.push(
          '<div class="blt-row blt-tbc">' +
            '<div class="blt-lab" tabindex="0" data-tip="' + esc(tip) + ' \u2014 data belum tersedia">' +
              esc(label) + '</div>' +
            '<div class="blt-tr" role="img" aria-label="data belum tersedia, ambang batas ' + sign + tStr + '">' +
              '<div class="blt-na" aria-hidden="true"></div>' +
              (t === null ? '' : '<div class="blt-tick blt-tick-dim" style="left:' + t + '%" aria-hidden="true"></div>') +
            '</div>' +
            '<div class="blt-val blt-nav">\u2014 / ' + sign + tStr + '</div>' +
          '</div>'
        );
        continue;
      }

      var gap = t === null ? 0 : (low ? a - t : t - a);
      var sev = t === null ? 'none' : sevOf(gap);

      /* kelebihan hanya dihitung kalau bar melewati ambang di arah yang SALAH */
      var over = 0, overLeft = 0;
      if (t !== null && low && a > t) { over = a - t; overLeft = t; }

      var zone = t === null ? ''
        : low ? '<div class="blt-zone" style="left:0;width:' + t + '%" aria-hidden="true"></div>'
              : '<div class="blt-zone" style="left:' + t + '%;right:0" aria-hidden="true"></div>';

      var sr = a.toFixed(dp) + ' persen, ambang batas ' + sign + tStr +
               (t === null ? '' : ', selisih ' + Math.abs(gap).toFixed(dp) + ' poin ' +
                 (gap <= 0 ? 'melewati ambang' : 'belum tercapai'));

      out.push(
        '<div class="blt-row">' +
          '<div class="blt-lab" tabindex="0" data-tip="' + esc(tip) + '">' + esc(label) + '</div>' +
          '<div class="blt-tr" role="img" aria-label="' + esc(sr) + '" ' +
               'style="--v:' + a + '%;--ov:' + over + '%">' +
            zone +
            '<div class="blt-bar blt-' + sev + '" aria-hidden="true"></div>' +
            (over > 0
              ? '<div class="blt-over blt-' + sev + '" style="left:' + overLeft + '%" aria-hidden="true"></div>'
              : '') +
            (t === null ? '' : '<div class="blt-tick" style="left:' + t + '%" aria-hidden="true"></div>') +
          '</div>' +
          '<div class="blt-val">' + a.toFixed(dp) + '% / ' + sign + tStr + '</div>' +
        '</div>'
      );
    }

    out.push('</div>');
    return out.join('');
  };

  /* ===========================================================================
     5 · ANIMASI
     ---------------------------------------------------------------------------
     Dijalankan setelah markup masuk DOM. Tanpa dipanggil, kedua chart tetap
     tampil — hanya langsung di posisi final tanpa transisi.
  ========================================================================== */
  C.animate = function (scope) {
    var root = scope || document;
    var d = root.querySelectorAll('.dmb');
    var b = root.querySelectorAll('.blt');
    var go = function () {
      var i;
      for (i = 0; i < d.length; i++) d[i].className += ' dmb-go';
      for (i = 0; i < b.length; i++) b[i].className += ' blt-go';
    };
    if (w.requestAnimationFrame) {
      w.requestAnimationFrame(function () { w.requestAnimationFrame(go); });
    } else {
      w.setTimeout(go, 32);
    }
  };

  C.bulletAnimate  = C.animate;      /* alias, kompatibilitas */
  C.resolvePolarity = resolvePolarity;
  C.lookupCatalog   = lookupCatalog;
  C.bulletSeverity  = sevOf;

})(window);
