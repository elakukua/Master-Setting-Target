/* =============================================================================
   assets/overview.js  ·  v1.0
   National Target Dashboard — tata letak Overview yang disetujui
   -----------------------------------------------------------------------------
   Membangun seluruh halaman Overview dari data asli di data/*.js:
     · strip KPI
     · Evaluation vs threshold   (bullet, diperbesar)
     · Baseline vs evaluation    (dumbbell, kolom label diperbaiki)
     · Delta per indicator       (diperkaya: delta + jarak sisa ke ambang)
     · Top / Lowest performing   (berdampingan, satu metrik yang sama)
     · filter status, outcome, dan AP yang menyaring keempat kartu sekaligus

   Zero dependency. Tanpa CDN, tanpa fetch. Struktur data/*.js tidak diubah.

   PEMAKAIAN
       WVIOverview.render(document.getElementById('app'));

   atau dengan data yang Anda siapkan sendiri:

       WVIOverview.render(el, { rows: myRows });

   AGREGASI
   Subtitle chart Anda menyebut "Weighted National — Σ Numerator ÷ Σ Denominator,
   per indikator". Itu yang diterapkan di sini: baris per AP dikelompokkan per
   kode indikator, lalu

       baseline   = Σ Num_Base ÷ Σ Den_Base
       evaluation = Σ Num_LOP  ÷ Σ Den_LOP

   Kalau numerator/denominator tidak ada, modul jatuh ke rata-rata sederhana
   dari kolom persen dan MENANDAI hal itu di subtitle, supaya tidak ada yang
   mengira angkanya terboboti padahal tidak.
   ============================================================================= */

(function (w, d) {
  'use strict';

  var O = w.WVIOverview = w.WVIOverview || {};

  /* ===========================================================================
     1 · PEMETAAN KOLOM
     ---------------------------------------------------------------------------
     Nama di urutan pertama diambil dari skema yang tercantum di modal impor
     Anda sendiri, jadi ini bukan tebakan. Sisanya alternatif yang lazim.
     Kalau nama kolom Anda berbeda, ubah di SATU tempat ini saja.
  ========================================================================== */
  var F = O.FIELDS = {
    code      : ['Code', 'code', 'Kode', 'indicator_code'],
    name      : ['Indicator', 'indicator', 'Name', 'name', 'Nama'],
    outcome   : ['Outcome', 'outcome', 'OC'],
    ap        : ['AP', 'ap', 'AP_Name', 'Area_Program'],
    numBase   : ['Num_Base', 'num_base', 'Numerator_Base'],
    denBase   : ['Den_Base', 'den_base', 'Denominator_Base'],
    pctBase   : ['Pct_Base', 'pct_base', 'Baseline', 'baseline'],
    numLop    : ['Num_LOP', 'num_lop', 'Numerator_LOP', 'Num_Eval'],
    denLop    : ['Den_LOP', 'den_lop', 'Denominator_LOP', 'Den_Eval'],
    pctLop    : ['Pct_LOP', 'pct_lop', 'Evaluation', 'evaluation', 'Pct_Eval'],
    threshold : ['Threshold', 'threshold', 'TP_CESP', 'Ambang'],
    polarity  : ['polarity', 'direction', 'better', 'hib', 'higherIsBetter',
                 'Polarity', 'Direction']
  };

  /* Indikator lower-is-better, dipakai hanya kalau data tidak membawa
     metadata arah. Label chart Anda sudah menampilkan tanda panah untuk
     underweight, jadi kemungkinan besar metadata itu ADA dan tabel ini tidak
     akan pernah terpakai. */
  var LOWER = O.LOWER_IS_BETTER = {
    'OIOS 160': 1, 'OIOS 22': 1, 'OIOS 27': 1,
    '160': 1, '22': 1, '27': 1
  };

  function pick(obj, names) {
    for (var i = 0; i < names.length; i++) {
      if (obj[names[i]] !== undefined && obj[names[i]] !== null &&
          obj[names[i]] !== '') return obj[names[i]];
    }
    return null;
  }

  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isNaN(v) ? null : v;
    var s = String(v).replace(/\s/g, '').replace('%', '');
    if (s.indexOf(',') > -1 && s.indexOf('.') === -1) s = s.replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  /* null tetap null, 0 tetap 0, nilai <= 1 dianggap fraksi */
  function toPct(v) {
    var n = num(v);
    if (n === null) return null;
    if (n > 0 && n <= 1) n = n * 100;
    return Math.max(0, Math.min(100, n));
  }

  function normPol(v) {
    if (v === true)  return 'higher';
    if (v === false) return 'lower';
    if (v == null)   return null;
    var s = String(v).toLowerCase();
    if (/low|turun|kecil|desc|down|\u2193/.test(s)) return 'lower';
    if (/high|naik|besar|asc|up|\u2191/.test(s))    return 'higher';
    return null;
  }

  /* ===========================================================================
     2 · MEMBACA DATA
     ---------------------------------------------------------------------------
     Beberapa bentuk global dicoba. Yang pertama cocok dipakai. Kalau tidak ada
     yang cocok, render() menampilkan panel diagnosis alih-alih halaman kosong.
  ========================================================================== */
  function flatten(src) {
    if (!src) return null;

    if (Object.prototype.toString.call(src) === '[object Array]') {
      return (src.length && typeof src[0] === 'object') ? src : null;
    }
    if (src.rows && src.columns) {
      var out = [];
      for (var i = 0; i < src.rows.length; i++) {
        var o = {}, r = src.rows[i];
        for (var c = 0; c < src.columns.length; c++) o[src.columns[c]] = r[c];
        out.push(o);
      }
      return out;
    }
    if (src.data) return flatten(src.data);
    if (src.rows) return flatten(src.rows);
    return null;
  }

  function collectRaw() {
    var names = ['WVI_MASTER', 'WVI_INDICATORS', 'WVI_DATA', 'WVI_TARGET',
                 'WVI_PEMETAAN', 'INDICATORS', 'MASTER'];
    for (var i = 0; i < names.length; i++) {
      var f = flatten(w[names[i]]);
      if (f && f.length) return { rows: f, from: names[i] };
    }
    return null;
  }

  function globalsFound() {
    var g = [];
    for (var k in w) { if (/^WVI/.test(k)) g.push(k); }
    return g;
  }

  /* ===========================================================================
     3 · AGREGASI  Σ numerator ÷ Σ denominator per kode indikator
  ========================================================================== */
  O.aggregate = function (raw, filter) {
    filter = filter || {};
    var map = {}, order = [], weighted = true;

    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      var code = pick(r, F.code);
      if (code === null) continue;
      code = String(code).trim();

      var ap = pick(r, F.ap);
      var oc = pick(r, F.outcome);
      if (filter.ap && filter.ap !== 'all' && String(ap) !== filter.ap) continue;
      if (filter.oc && filter.oc !== 'all' && String(oc) !== filter.oc) continue;

      if (!map[code]) {
        order.push(code);
        map[code] = {
          code: code,
          name: String(pick(r, F.name) || ''),
          outcome: oc === null ? '' : String(oc),
          nb: 0, db: 0, nl: 0, dl: 0,
          pb: [], pl: [],
          th: null,
          pol: normPol(pick(r, F.polarity))
        };
      }
      var m = map[code];
      if (!m.pol) m.pol = normPol(pick(r, F.polarity));
      if (m.th === null) m.th = toPct(pick(r, F.threshold));

      var nb = num(pick(r, F.numBase)), db = num(pick(r, F.denBase));
      var nl = num(pick(r, F.numLop)),  dl = num(pick(r, F.denLop));
      if (nb !== null && db) { m.nb += nb; m.db += db; }
      if (nl !== null && dl) { m.nl += nl; m.dl += dl; }

      var pb = toPct(pick(r, F.pctBase)), pl = toPct(pick(r, F.pctLop));
      if (pb !== null) m.pb.push(pb);
      if (pl !== null) m.pl.push(pl);
    }

    var rows = [];
    for (var j = 0; j < order.length; j++) {
      var m2 = map[order[j]];
      var base, ev;

      /* Indikator yang sama sekali tidak punya angka (TBC murni) tidak boleh
         menurunkan status agregasi jadi "belum terboboti". Penanda itu hanya
         menyala kalau kita benar-benar jatuh ke kolom persen. */
      if (m2.db > 0)             { base = m2.nb / m2.db * 100; }
      else if (m2.pb.length)     { weighted = false; base = avg(m2.pb); }
      else                       { base = null; }

      if (m2.dl > 0)             { ev = m2.nl / m2.dl * 100; }
      else if (m2.pl.length)     { weighted = false; ev = avg(m2.pl); }
      else                       { ev = null; }

      rows.push({
        code: m2.code, name: m2.name, outcome: m2.outcome,
        baseline: base === null ? null : clamp(base),
        evaluation: ev === null ? null : clamp(ev),
        threshold: m2.th,
        polarity: m2.pol || (LOWER[m2.code] ? 'lower' : 'higher')
      });
    }
    return { rows: rows, weighted: weighted };
  };

  function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  /* Dibulatkan ke 4 desimal. Tanpa ini, 1680/2000*100 bisa keluar sebagai
     55.00000000000001 dan angka itu ikut masuk ke inline style --v. */
  function clamp(n) { return Math.round(Math.max(0, Math.min(100, n)) * 1e4) / 1e4; }

  /* ===========================================================================
     4 · KLASIFIKASI
     ---------------------------------------------------------------------------
     Gap dihitung terbalik untuk lower-is-better. Ambangnya memakai 5 status
     vocabulary yang sudah ada, bukan kosakata baru.
  ========================================================================== */
  function gapOf(r) {
    if (r.evaluation === null || r.threshold === null) return null;
    return r.polarity === 'lower' ? r.evaluation - r.threshold
                                  : r.threshold - r.evaluation;
  }
  function statusOf(g) {
    if (g === null) return 'reference';
    if (g <= 5)  return 'ready';
    if (g <= 15) return 'review';
    if (g <= 30) return 'monitor';
    return 'critical';
  }
  function fillOf(s) {
    return s === 'ready' ? 'wvo-ok' : (s === 'critical' ? 'wvo-bd' : 'wvo-wn');
  }
  function pillOf(s) {
    return s === 'ready' ? 'wvo-p-ok'
         : s === 'reference' ? 'wvo-p-na'
         : s === 'critical' ? 'wvo-p-bd' : 'wvo-p-wn';
  }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function f1(n) { return n.toFixed(1); }

  function labelHtml(r, sub) {
    var full = (r.code ? r.code + ' \u00B7 ' : '') + (r.name || '');
    var tip  = full + ' \u2014 ' +
      (r.polarity === 'lower' ? 'lebih rendah lebih baik' : 'lebih tinggi lebih baik');
    return '<div class="wvo-lab" tabindex="0" data-tip="' + esc(tip) + '">' + esc(full) +
           (sub ? '<div class="wvo-pol">' + esc(sub) + '</div>' : '') + '</div>';
  }

  /* ===========================================================================
     5 · RENDER
  ========================================================================== */
  O.render = function (target, opts) {
    opts = opts || {};
    var el = typeof target === 'string' ? d.getElementById(target) : target;
    if (!el) return;

    var raw = opts.rows ? { rows: opts.rows, from: 'opts.rows' } : collectRaw();
    if (!raw) {
      el.innerHTML =
        '<div class="wvo"><div class="wvo-fail">' +
        '<b>Data indikator tidak ditemukan.</b>' +
        '<p>Modul mencari <code>WVI_MASTER</code> <code>WVI_INDICATORS</code> ' +
        '<code>WVI_DATA</code> dan beberapa nama lain, dalam bentuk array objek ' +
        'maupun <code>{columns, rows}</code>. Tidak ada yang cocok.</p>' +
        '<p>Global berawalan WVI yang benar-benar ada: ' +
        (globalsFound().length
          ? '<code>' + globalsFound().join('</code> <code>') + '</code>'
          : '<i>tidak ada satu pun</i> \u2014 periksa tag &lt;script&gt; data di index.html') +
        '</p><p>Beri tahu saya nama yang muncul di daftar itu dan saya sesuaikan ' +
        '<code>WVIOverview.FIELDS</code>.</p></div></div>';
      return;
    }

    var agg = O.aggregate(raw.rows, opts.filter);
    var rows = agg.rows;

    /* daftar nilai untuk dropdown filter */
    var ocs = {}, aps = {};
    for (var i = 0; i < raw.rows.length; i++) {
      var o = pick(raw.rows[i], F.outcome), a = pick(raw.rows[i], F.ap);
      if (o !== null) ocs[String(o)] = 1;
      if (a !== null) aps[String(a)] = 1;
    }

    var withData = [], ready = 0, crit = 0, gaps = [];
    for (var j = 0; j < rows.length; j++) {
      var g = gapOf(rows[j]), s = statusOf(g);
      rows[j]._gap = g; rows[j]._st = s;
      if (g !== null) { withData.push(rows[j]); gaps.push(g); }
      if (s === 'ready') ready++;
      if (s === 'critical') crit++;
    }
    gaps.sort(function (x, y) { return x - y; });
    var med = gaps.length
      ? (gaps.length % 2 ? gaps[(gaps.length - 1) / 2]
                         : (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2)
      : null;

    var h = ['<div class="wvo" id="wvoRoot">'];

    /* --- filter --- */
    h.push('<div class="wvo-bar">');
    var st = ['all', 'ready', 'review', 'monitor', 'critical', 'reference'];
    var stLab = { all: 'Semua', ready: 'Ready', review: 'Review',
                  monitor: 'Monitor', critical: 'Critical', reference: 'Reference' };
    for (var k = 0; k < st.length; k++) {
      h.push('<button class="wvo-chip" data-f="' + st[k] + '" aria-pressed="' +
             (k === 0 ? 'true' : 'false') + '">' + stLab[st[k]] + '</button>');
    }
    h.push(selectHtml('wvoOc', 'Semua outcome', ocs, (opts.filter || {}).oc));
    h.push(selectHtml('wvoAp', 'Semua AP', aps, (opts.filter || {}).ap));
    h.push('<span class="wvo-count" id="wvoCount">' + rows.length + ' indikator</span>');
    h.push('</div>');

    /* --- KPI --- */
    h.push('<div class="wvo-strip">' +
      kpi('Indikator dipantau', rows.length) +
      kpi('Sudah di zona baik', ready) +
      kpi('Gap kritis', crit) +
      kpi('Median gap', med === null ? '\u2014' : f1(med)) +
    '</div>');

    var aggNote = agg.weighted
      ? '\u03A3 numerator \u00F7 \u03A3 denominator per indikator'
      : 'rata-rata sederhana kolom persen \u2014 numerator/denominator tidak lengkap, angka ini BELUM terboboti';

    /* --- bullet --- */
    h.push('<section class="wvo-card"><h3>Evaluation vs threshold</h3>' +
      '<p class="wvo-sub">' + aggNote + ' \u00B7 bayangan hijau menandai zona baik, ' +
      'garis tegak adalah ambang batas</p>' +
      '<div class="wvo-leg">' +
        '<span><i class="wvo-sw" style="background:var(--wvo-gbg);border:.5px solid #C0DD97"></i>zona baik</span>' +
        '<span><i class="wvo-sw wvo-ok"></i>gap \u2264 5</span>' +
        '<span><i class="wvo-sw wvo-wn"></i>5\u201330</span>' +
        '<span><i class="wvo-sw wvo-bd"></i>&gt; 30</span>' +
      '</div>');
    for (var b = 0; b < rows.length; b++) h.push(bulletRow(rows[b]));
    h.push('</section>');

    /* --- dumbbell --- */
    h.push('<section class="wvo-card"><h3>Baseline vs evaluation</h3>' +
      '<p class="wvo-sub">Glyph menunjukkan arah nilai, warna menunjukkan membaik atau memburuk</p>' +
      '<div class="wvo-leg">' +
        '<span><i class="wvo-rng"></i>baseline</span>' +
        '<span><i class="wvo-fil"></i>evaluasi</span>' +
        '<span><b class="wvo-up" style="font-weight:400">\u25BC\u25B2</b> membaik</span>' +
        '<span><b class="wvo-dn" style="font-weight:400">\u25B2</b> memburuk</span>' +
      '</div>');
    for (var c2 = 0; c2 < rows.length; c2++) h.push(dumbRow(rows[c2]));
    h.push('</section>');

    /* --- delta --- */
    h.push('<section class="wvo-card"><h3>Delta per indicator</h3>' +
      '<p class="wvo-sub">Perubahan dalam poin persentase, disandingkan dengan jarak sisa ke ambang batas</p>');
    for (var e2 = 0; e2 < rows.length; e2++) h.push(deltaRow(rows[e2]));
    h.push('</section>');

    /* --- Top / Lowest, satu metrik yang sama --- */
    var rank = withData.slice().sort(function (x, y) { return x._gap - y._gap; });
    h.push('<div class="wvo-pair">' +
      '<section class="wvo-card" style="margin:0"><h3>Top performing</h3>' +
      '<p class="wvo-sub">Jarak terkecil ke ambang batas</p>' + rankList(rank.slice(0, 4)) +
      '</section>' +
      '<section class="wvo-card" style="margin:0"><h3>Lowest performing</h3>' +
      '<p class="wvo-sub">Jarak terbesar ke ambang batas</p>' +
      rankList(rank.slice(-4).reverse()) +
      '</section></div>');

    h.push('</div>');
    el.innerHTML = h.join('');

    wire(el, raw, opts);
    animate(el);
  };

  function kpi(l, v) {
    return '<div class="wvo-kpi"><span>' + l + '</span><b>' + v + '</b></div>';
  }

  function selectHtml(id, allLabel, obj, cur) {
    var keys = [];
    for (var k in obj) keys.push(k);
    if (!keys.length) return '';
    keys.sort();
    var s = '<select class="wvo-sel" id="' + id + '"><option value="all">' + allLabel + '</option>';
    for (var i = 0; i < keys.length; i++) {
      s += '<option value="' + esc(keys[i]) + '"' +
           (cur === keys[i] ? ' selected' : '') + '>' + esc(keys[i]) + '</option>';
    }
    return s + '</select>';
  }

  function bulletRow(r) {
    var sign = r.polarity === 'lower' ? '\u2264' : '\u2265';
    var tStr = r.threshold === null ? '\u2026' : f1(r.threshold) + '%';
    var sub  = r.evaluation === null ? 'data belum tersedia'
             : (r.polarity === 'lower' ? 'lebih rendah lebih baik' : 'lebih tinggi lebih baik');

    var inner = '';
    if (r.threshold !== null) {
      inner += r.polarity === 'lower'
        ? '<div class="wvo-zn" style="left:0;width:' + r.threshold + '%"></div>'
        : '<div class="wvo-zn" style="left:' + r.threshold + '%;right:0"></div>';
    }
    var over = 0;
    if (r.evaluation === null) {
      inner += '<div class="wvo-na"></div>';
    } else {
      inner += '<div class="wvo-fill ' + fillOf(r._st) + '"></div>';
      if (r.polarity === 'lower' && r.threshold !== null && r.evaluation > r.threshold) {
        over = r.evaluation - r.threshold;
        inner += '<div class="wvo-ovr" style="left:' + r.threshold +
                 '%;background:repeating-linear-gradient(45deg,#854F0B 0 3px,transparent 3px 6px)"></div>';
      }
    }
    if (r.threshold !== null) {
      inner += '<div class="wvo-tk" style="left:' + r.threshold + '%' +
               (r.evaluation === null ? ';opacity:.35' : '') + '"></div>';
    }

    return '<div class="wvo-brow" data-s="' + r._st + '">' + labelHtml(r, sub) +
      '<div class="wvo-tr" style="--v:' + (r.evaluation === null ? 0 : r.evaluation) +
        '%;--ov:' + over + '%">' + inner + '</div>' +
      '<div class="wvo-num' + (r.evaluation === null ? ' wvo-dim' : '') + '">' +
        (r.evaluation === null ? '\u2014' : f1(r.evaluation) + '%') +
        ' / ' + sign + tStr + '</div></div>';
  }

  function dumbRow(r) {
    if (r.baseline === null || r.evaluation === null) {
      return '<div class="wvo-drow" data-s="reference">' + labelHtml(r, 'data belum tersedia') +
        '<div class="wvo-dtr"><div class="wvo-na" style="top:8px;bottom:8px"></div></div>' +
        '<div class="wvo-num wvo-dim">TBC</div><div class="wvo-dir wvo-fl">\u2013</div></div>';
    }
    var dl = r.evaluation - r.baseline;
    var flat = Math.abs(dl) < 0.05;
    var imp = r.polarity === 'lower' ? dl < 0 : dl > 0;
    var glyph = flat ? '\u2013' : (dl > 0 ? '\u25B2' : '\u25BC');
    var cls = flat ? 'wvo-fl' : (imp ? 'wvo-up' : 'wvo-dn');

    return '<div class="wvo-drow" data-s="' + r._st + '">' + labelHtml(r, '') +
      '<div class="wvo-dtr" style="--a:' + r.baseline + '%;--b:' + r.evaluation +
        '%;--lo:' + Math.min(r.baseline, r.evaluation) + '%;--w:' + Math.abs(dl) + '%">' +
        '<div class="wvo-rail"></div>' +
        '<div class="wvo-gtk" style="left:25%"></div>' +
        '<div class="wvo-gtk" style="left:50%"></div>' +
        '<div class="wvo-gtk" style="left:75%"></div>' +
        '<div class="wvo-conn"></div>' +
        '<div class="wvo-dot wvo-d1"></div><div class="wvo-dot wvo-d2"></div></div>' +
      '<div class="wvo-num">' + f1(r.baseline) + '% \u2192 ' + f1(r.evaluation) + '%</div>' +
      '<div class="wvo-dir ' + cls + '">' + glyph + '</div></div>';
  }

  function deltaRow(r) {
    if (r.baseline === null || r.evaluation === null) {
      return '<div class="wvo-erow" data-s="reference">' + labelHtml(r, '') +
        '<div class="wvo-num wvo-dim">\u2014 \u2192 \u2014</div>' +
        '<div class="wvo-et"><div class="wvo-na" style="border-radius:5px"></div></div>' +
        '<div class="wvo-num wvo-dim">\u2014</div>' +
        '<div><span class="wvo-pill wvo-p-na">TBC</span></div></div>';
    }
    var dl = r.evaluation - r.baseline;
    var imp = r.polarity === 'lower' ? dl < 0 : dl > 0;
    var span = r.threshold === null ? 100
             : (r.polarity === 'lower' ? Math.max(r.baseline, r.threshold) : r.threshold);
    var wdt = Math.max(2, Math.min(100, Math.abs(dl) / Math.max(1, span) * 100));
    var left = r._gap === null ? '\u2014' : 'sisa ' + f1(Math.max(0, r._gap));

    return '<div class="wvo-erow" data-s="' + r._st + '">' + labelHtml(r, '') +
      '<div class="wvo-num">' + f1(r.baseline) + ' \u2192 ' + f1(r.evaluation) + '</div>' +
      '<div class="wvo-et" style="--dw:' + wdt.toFixed(1) + '%">' +
        '<div class="wvo-ef" style="background:' +
          (imp ? 'var(--wvo-teal)' : 'var(--wvo-burnt)') + '"></div></div>' +
      '<div class="wvo-num">' + left + '</div>' +
      '<div><span class="wvo-pill ' + pillOf(r._st) + '">' +
        (dl > 0 ? '\u25B2 ' : '\u25BC ') + f1(Math.abs(dl)) + '</span></div></div>';
  }

  function rankList(arr) {
    var s = '';
    for (var i = 0; i < arr.length; i++) {
      var r = arr[i];
      s += '<div class="wvo-lrow"><span class="wvo-rk">' + (i + 1) + '</span>' +
           '<span style="flex:1">' + esc(r.code + ' \u00B7 ' + r.name) + '</span>' +
           '<span class="wvo-pill ' + pillOf(r._st) + '">' +
           (r._gap <= 0 ? 'tercapai' : f1(r._gap)) + '</span></div>';
    }
    return s;
  }

  /* ===========================================================================
     6 · INTERAKSI
  ========================================================================== */
  function wire(el, raw, opts) {
    var root = el.querySelector('#wvoRoot');
    if (!root) return;
    var chips = root.querySelectorAll('.wvo-chip');
    var count = root.querySelector('#wvoCount');
    var selOc = root.querySelector('#wvoOc');
    var selAp = root.querySelector('#wvoAp');

    function applyStatus(f) {
      var rws = root.querySelectorAll('[data-s]'), n = 0;
      for (var i = 0; i < rws.length; i++) {
        var ok = (f === 'all' || rws[i].getAttribute('data-s') === f);
        if (ok) rws[i].className = rws[i].className.replace(/\s*wvo-hid/g, '');
        else if (rws[i].className.indexOf('wvo-hid') === -1) rws[i].className += ' wvo-hid';
        if (ok && rws[i].className.indexOf('wvo-brow') > -1) n++;
      }
      if (count) count.textContent = n + ' indikator';
    }

    for (var i = 0; i < chips.length; i++) {
      chips[i].onclick = function () {
        for (var j = 0; j < chips.length; j++) chips[j].setAttribute('aria-pressed', 'false');
        this.setAttribute('aria-pressed', 'true');
        applyStatus(this.getAttribute('data-f'));
      };
    }

    /* Outcome dan AP mengubah agregasi, jadi harus render ulang. */
    function reRender() {
      O.render(el, {
        rows: raw.from === 'opts.rows' ? raw.rows : null,
        filter: {
          oc: selOc ? selOc.value : 'all',
          ap: selAp ? selAp.value : 'all'
        }
      });
    }
    if (selOc) selOc.onchange = reRender;
    if (selAp) selAp.onchange = reRender;
  }

  function animate(el) {
    var root = el.querySelector('#wvoRoot');
    if (!root) return;
    var go = function () { root.className += ' wvo-go'; };
    if (w.requestAnimationFrame) {
      w.requestAnimationFrame(function () { w.requestAnimationFrame(go); });
    } else { w.setTimeout(go, 32); }
  }

  O.gapOf = gapOf;
  O.statusOf = statusOf;

})(window, document);
