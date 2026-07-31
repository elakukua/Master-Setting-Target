/* ==========================================================================
   AIM+ TARGET SETTING — SUMMARY + ANALISIS AP
   Spesifikasi v2.0 · PEARL · Wahana Visi Indonesia
   --------------------------------------------------------------------------
   Halaman ini tidak menghitung target. Ia menampilkan apa yang dikirim AP dan
   menerapkan logika status yang sudah disetujui PEARL (§5.3), tanpa perubahan.

   T1 dan T2 tidak mungkin terjadi di sini: analisis dihitung baris demi baris
   dari tblIndicators memakai Row ID sebagai kunci, bukan dari tabel kedua yang
   panjangnya harus dijaga manual. Setiap baris baru langsung ikut dianalisis.
   ========================================================================== */
"use strict";

const CFG={}, S={ rows:[], asumsi:[], pemetaan:[], apz:{}, cat:[], local:false };
let AP_LIST=[], ZONALS=[], OUTCOMES=[], IND_LIST=[];

const isBlank = v => v===null||v===undefined||v==="";
/* KONVENSI PEARL: N() memperlakukan kosong sebagai 0, dan 0 sebagai belum ada data */
const N = v => { const f=parseFloat(v); return isFinite(f)?f:0; };
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ---------- kosakata status (§3) ---------- */
const ST_IND=[
 {v:"Baik",            ic:"●", cls:"s-baik",    desc:"Endline mencapai threshold DAN delta mencapai target"},
 {v:"Perlu ditinjau",  ic:"◆", cls:"s-tinjau",  desc:"Salah satu tercapai, satunya belum"},
 {v:"Perlu perhatian", ic:"▲", cls:"s-hati",    desc:"Keduanya belum tercapai"},
 {v:"Belum ada data",  ic:"◧", cls:"s-belum",   desc:"Baseline atau endline masih 0"}
];
const ST_THR=[
 {v:"Tercapai",       ic:"●", cls:"s-baik"},
 {v:"Tidak tercapai", ic:"▲", cls:"s-hati"},
 {v:"Belum ada data", ic:"◧", cls:"s-belum"}
];
const ST_TGT=[
 {v:"Capai target",        ic:"●", cls:"s-baik"},
 {v:"Meleset dari target", ic:"▲", cls:"s-hati"},
 {v:"Belum ada data",      ic:"◧", cls:"s-belum"}
];
const ICON={}; ST_IND.concat(ST_THR,ST_TGT).forEach(x=>{ICON[x.v]=x;});
function pill(v){const x=ICON[v]||{ic:"–",cls:"s-belum"};
  return '<span class="pill '+x.cls+'"><span class="ic">'+x.ic+'</span>'+esc(v)+'</span>';}

/* ---------- pemuatan ---------- */
function adopt(){
  const c=window.WVI_CONFIG;
  Object.assign(CFG,{cycle:c.cycle,version:c.version,data_date:c.data_date,owner:c.owner,
    code:c.access_code,target_delta:(window.WVI_ASUMSI||{}).target_delta_default||0.1});
  ZONALS=c.zonal.slice(); OUTCOMES=c.outcomes.slice();
  AP_LIST=c.ap.map(a=>({ap:a.ap,zonal:a.zonal}));
  S.apz={}; AP_LIST.forEach(a=>S.apz[a.ap]=a.zonal);
  S.cat=c.catalogue.map(x=>Object.assign({},x));
  IND_LIST=S.cat.map(x=>x.ind);

  const pack=window.WVI_INDICATORS, col=pack.columns;
  S.rows=pack.rows.map(r=>{const o={}; col.forEach((k,i)=>o[k]=r[i]); return o;});
  S.asumsi=(window.WVI_ASUMSI.rows||[]).map(a=>Object.assign({},a));
  S.pemetaan={aps:window.WVI_PEMETAAN.aps.slice(),
    rows:window.WVI_PEMETAAN.rows.map(p=>({code:p.code,ind:p.ind,v:p.v.slice()}))};
}

/* ---------- indeks bantu ---------- */
let AS_BY_IND={}, PEM_BY_IND={}, CAT_BY_IND={};
function reindex(){
  AS_BY_IND={}; S.asumsi.forEach(a=>{ AS_BY_IND[a.ind]=a; });
  PEM_BY_IND={}; S.pemetaan.rows.forEach(p=>{ PEM_BY_IND[p.ind]=p; });
  CAT_BY_IND={}; S.cat.forEach(c=>{ CAT_BY_IND[c.ind]=c; });
}
const arahOf  = ind => (AS_BY_IND[ind]||{}).arah || "Naik";
const targetOf= ind => { const a=AS_BY_IND[ind];
  return (a&&a.delta!==null&&a.delta!==undefined)?a.delta:CFG.target_delta; };
function berlakuOf(ind,ap){
  const p=PEM_BY_IND[ind]; if(!p) return "Yes";
  const i=S.pemetaan.aps.indexOf(ap); if(i<0) return "Yes";
  const v=p.v[i]; return (v&&String(v).trim().toLowerCase()==="no")?"No":"Yes";
}
const shortOf = ind => (CAT_BY_IND[ind]||{}).short || String(ind||"").slice(0,42);

/* ==========================================================================
   LOGIKA STATUS — persis §5.3, tidak diubah
   ========================================================================== */
function recompute(){
  reindex();
  const seen={}, dupKey={};
  S.rows.forEach(r=>{
    const k=r["Area Program"]+"|"+r.Indicator;
    dupKey[k]=(dupKey[k]||0)+1;
  });
  S.rows.forEach(r=>{
    const ind=r.Indicator, ap=r["Area Program"];
    const base=N(r.Pct_Base), end=N(r.Pct_LOP), thr=N(r.Threshold);
    const arah=arahOf(ind), tgt=targetOf(ind);

    r._arah=arah; r._target=tgt;
    /* EPS: perbandingan >= dan <= pada bilangan pecahan biner tidak stabil di ambang.
       Dua baris (IND-291, IND-296) delta-nya tepat sama dengan Target Delta; tanpa
       toleransi ini, hasilnya berubah hanya karena presisi penyimpanan angka.
       Aturannya "≥" dan "≤", jadi nilai yang sama persis dihitung TERCAPAI. */
    const EPS=1e-9;
    r._thr_status = end===0 ? "Belum ada data"
      : (arah==="Turun" ? (end<=thr+EPS?"Tercapai":"Tidak tercapai")
                        : (end>=thr-EPS?"Tercapai":"Tidak tercapai"));
    r._delta = (base===0||end===0) ? null : end-base;
    r._tgt_status = r._delta===null ? "Belum ada data"
      : (arah==="Turun" ? (r._delta<=tgt+EPS?"Capai target":"Meleset dari target")
                        : (r._delta>=tgt-EPS?"Capai target":"Meleset dari target"));
    r._status = (r._thr_status==="Belum ada data"||r._tgt_status==="Belum ada data") ? "Belum ada data"
      : (r._thr_status==="Tercapai"&&r._tgt_status==="Capai target") ? "Baik"
      : (r._thr_status==="Tercapai"||r._tgt_status==="Capai target") ? "Perlu ditinjau"
      : "Perlu perhatian";
    r._berlaku = berlakuOf(ind,ap);
    r._short = shortOf(ind);
    r._dupe = dupKey[ap+"|"+ind]>1;
    /* delta yang arahnya berlawanan dengan arah indikator (§5.8) */
    r._wrongway = r._delta!==null && ((arah==="Naik"&&r._delta<0)||(arah==="Turun"&&r._delta>0));
    const id=r.Row_ID; r._iddupe = seen[id]?true:false; seen[id]=1;
  });
}

/* ==========================================================================
   PEMERIKSAAN INTEGRITAS — ditampilkan di band header kedua halaman
   ========================================================================== */
function checks(){
  const n=S.rows.length;
  const idDupe=S.rows.filter(r=>r._iddupe).length;
  const comboDupe=uniq(S.rows.filter(r=>r._dupe).map(r=>r["Area Program"]+"|"+r.Indicator)).length;
  const dupeRows=S.rows.filter(r=>r._dupe).length;
  const total=ST_IND.reduce((a,s)=>a+S.rows.filter(r=>r._status===s.v).length,0);
  const unknownAsumsi=S.asumsi.filter(a=>IND_LIST.indexOf(a.ind)<0).length;
  const unknownAP=S.pemetaan.aps.filter(a=>!AP_LIST.some(x=>x.ap===a)).length;
  return {
    n:n,
    rowid: idDupe===0 ? "ROW ID OK" : "ROW ID GANDA ("+idDupe+")",
    sinkron: total===n ? "SINKRON" : "TIDAK SINKRON ("+total+" dari "+n+")",
    dupe: comboDupe===0 ? "TIDAK ADA DUPLIKAT" : comboDupe+" KOMBINASI AP × INDIKATOR GANDA",
    dupeRows:dupeRows, comboDupe:comboDupe,
    unknownAsumsi:unknownAsumsi, unknownAP:unknownAP,
    ok: idDupe===0 && total===n && comboDupe===0 && unknownAsumsi===0 && unknownAP===0
  };
}

/* ---------- format (§3) ---------- */
const uniq = a => Array.from(new Set(a));
const n0 = v => isBlank(v)?"—":Math.round(Number(v)).toLocaleString("id-ID");
/* 0 dan kosong sama-sama tampil sebagai — , sesuai konvensi PEARL */
const pctD = (v,d) => { const f=N(v); return f===0?"—":(f*100).toFixed(d===undefined?1:d)+"%"; };
const pctT = v => { const f=N(v); return f===0?"TBC":(f*100).toFixed(1)+"%"; };
const ppD = v => v===null||v===undefined?"—":((v>0?"+":"")+(v*100).toFixed(1)+"pp");
const med = a => { const b=a.filter(v=>v!=null&&isFinite(v)).sort((x,y)=>x-y);
  if(!b.length) return null; const m=b.length>>1;
  return b.length%2?b[m]:(b[m-1]+b[m])/2; };
const avg = a => { const b=a.filter(v=>v!=null&&isFinite(v)); 
  return b.length?b.reduce((x,y)=>x+y,0)/b.length:null; };

/* ---------- penyimpanan lokal ---------- */
const LS="wvi_aimplus_v2";
function saveLocal(){
  try{ localStorage.setItem(LS,JSON.stringify({
    saved:new Date().toISOString(), asumsi:S.asumsi, pemetaan:S.pemetaan,
    target_delta:CFG.target_delta, rows:S.rows.map(r=>{
      const o={}; window.WVI_INDICATORS.columns.forEach(k=>o[k]=r[k]); return o;})}));
    S.local=true; chip();
  }catch(e){ S.local=false; }
}
function loadLocal(){ try{ const s=localStorage.getItem(LS); return s?JSON.parse(s):null; }catch(e){ return null; } }
function clearLocal(){ try{ localStorage.removeItem(LS); }catch(e){} }
function localOK(){ try{ localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; }catch(e){ return false; } }
/* ==========================================================================
   GRAFIK — SVG sebaris, tanpa library. Judul ditulis di sel, bukan chart title.
   Warna seri persis §3.
   ========================================================================== */
const CLR={
  baik:"#155930", tinjau:"#E8A33C", hati:"#B10831", belum:"#D8D6D1",
  baseline:"#0C7993", threshold:"#D8D6D1", endline:"#FF5515",
  zonal:["#0C7993","#155930","#FF5515","#3F3D4C"], ref:"#3F3D4C"
};
const SER_IND=[["Baik",CLR.baik],["Perlu ditinjau",CLR.tinjau],
               ["Perlu perhatian",CLR.hati],["Belum ada data",CLR.belum]];
const SER_THR=[["Tercapai",CLR.baik],["Tidak tercapai",CLR.hati],["Belum ada data",CLR.belum]];
const SER_TGT=[["Capai target",CLR.baik],["Meleset dari target",CLR.hati],["Belum ada data",CLR.belum]];

function legend(series,extra){
  return '<div class="legend">'+series.map(s=>
    '<div><i style="background:'+s[1]+';border-color:'+(s[1]===CLR.belum||s[1]===CLR.threshold?CLR.ref:s[1])+'"></i>'+
    esc(s[0])+'</div>').join('')+(extra||'')+'</div>';
}

/* stacked bar horizontal. pct100=true → 100% stacked. items:[{label,vals:[]}] */
function chartStack(items,series,opt){
  opt=opt||{};
  const labW=opt.labW||150, W=700, BH=opt.bh||17, GAP=opt.gap||9;
  const PITCH=BH+GAP, H=Math.max(28,items.length*PITCH+10), PW=W-labW-52;
  const totals=items.map(it=>it.vals.reduce((a,b)=>a+b,0));
  const scale=opt.pct100?null:Math.max(1,...totals);
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  if(!items.length) s+='<text x="'+labW+'" y="18" font-size="11" fill="#8A8894">Tidak ada data pada filter ini</text>';
  items.forEach((it,i)=>{
    const y=i*PITCH+4, tot=totals[i];
    s+='<text x="'+(labW-8)+'" y="'+(y+BH/2+4)+'" text-anchor="end" font-size="10.5" font-weight="600" fill="#111222">'+
       esc(it.label)+'</text>';
    if(!tot){
      s+='<rect x="'+labW+'" y="'+y+'" width="'+PW+'" height="'+BH+'" fill="#F7F6F4" stroke="#EDEBE6"/>'+
         '<text x="'+(labW+6)+'" y="'+(y+BH/2+4)+'" font-size="9" fill="#A9A6B0">tidak ada baris</text>';
      return;
    }
    let x=labW;
    it.vals.forEach((v,k)=>{
      if(!v) return;
      const w=opt.pct100 ? PW*v/tot : PW*v/scale;
      const col=series[k][1];
      s+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+BH+'" fill="'+col+'"'+
         (col===CLR.belum?' stroke="#C9C6CE" stroke-width=".6"':'')+'/>';
      if(w>22) s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y+BH/2+3.5)+'" text-anchor="middle" font-size="9" font-weight="700" fill="'+
        (col===CLR.belum||col===CLR.tinjau?"#3F3D4C":"#FFFFFF")+'">'+
        (opt.pct100?Math.round(v/tot*100)+"%":v)+'</text>';
      x+=w;
    });
    s+='<text x="'+(labW+PW+8)+'" y="'+(y+BH/2+4)+'" font-size="9.5" fill="#8A8894">'+tot+'</text>';
  });
  return s+'</svg>';
}

/* bar horizontal seri tunggal. items:[{label,v,hl}] */
function chartBar(items,color,opt){
  opt=opt||{};
  const labW=opt.labW||150, W=700, BH=opt.bh||19, PITCH=BH+11;
  const H=Math.max(28,items.length*PITCH+8), PW=W-labW-56;
  const max=Math.max(1,...items.map(i=>i.v));
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  items.forEach((it,i)=>{
    const y=i*PITCH+4, w=PW*it.v/max;
    s+='<text x="'+(labW-8)+'" y="'+(y+BH-5)+'" text-anchor="end" font-size="10.5" font-weight="600" fill="#111222">'+esc(it.label)+'</text>'+
       '<rect x="'+labW+'" y="'+y+'" width="'+Math.max(0,w).toFixed(1)+'" height="'+BH+'" fill="'+(it.hl||color)+'"/>'+
       '<text x="'+(labW+w+7).toFixed(1)+'" y="'+(y+BH-5)+'" font-size="10.5" font-weight="700" fill="'+(it.hl||color)+'">'+n0(it.v)+'</text>';
  });
  return s+'</svg>';
}

/* clustered bar 2 seri, skala 0–100%. items:[{label,a,b}] */
function chartPair(items,s1,s2,opt){
  opt=opt||{};
  const labW=opt.labW||210, W=700, BH=9, OV=2, PITCH=BH*2+OV+13;
  const H=Math.max(30,items.length*PITCH+14), PW=W-labW-58;
  const max=Math.max(0.0001,...items.map(i=>Math.max(i.a||0,i.b||0)));
  const sc=Math.min(1,Math.max(0.2,Math.ceil(max*10)/10));
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  for(let g=0;g<=4;g++){const x=labW+PW*g/4;
    s+='<line x1="'+x+'" y1="8" x2="'+x+'" y2="'+(H-10)+'" stroke="#EDEBE6"/>'+
       '<text x="'+x+'" y="'+(H-2)+'" text-anchor="middle" font-size="8" fill="#A9A6B0">'+Math.round(sc*100*g/4)+'%</text>';}
  items.forEach((it,i)=>{
    const y=i*PITCH+10;
    s+='<text x="'+(labW-8)+'" y="'+(y+BH+2)+'" text-anchor="end" font-size="9.5" font-weight="600" fill="#111222">'+esc(it.label)+'</text>';
    const wa=PW*Math.min(1,(it.a||0)/sc), wb=PW*Math.min(1,(it.b||0)/sc);
    s+='<rect x="'+labW+'" y="'+y+'" width="'+wa.toFixed(1)+'" height="'+BH+'" fill="'+s1[1]+'"/>'+
       '<rect x="'+labW+'" y="'+(y+BH+OV)+'" width="'+wb.toFixed(1)+'" height="'+BH+'" fill="'+s2[1]+'" stroke="'+CLR.ref+'" stroke-width=".6"/>'+
       '<text x="'+(labW+Math.max(wa,wb)+7).toFixed(1)+'" y="'+(y+BH+2)+'" font-size="8.5" fill="#3F3D4C">'+
       (it.a?(it.a*100).toFixed(1)+"%":"—")+' / '+(it.b?(it.b*100).toFixed(1)+"%":"TBC")+'</text>';
  });
  return s+'</svg>';
}

/* bar menyimpang dari nol, dengan penanda target. items:[{label,v,target}] */
function chartDiverge(items,opt){
  opt=opt||{};
  const labW=opt.labW||210, W=700, BH=13, PITCH=BH+11;
  const H=Math.max(34,items.length*PITCH+22), PW=W-labW-70;
  const vals=items.flatMap(i=>[i.v||0,i.target||0]);
  const m=Math.max(0.05,...vals.map(Math.abs)), sc=Math.ceil(m*20)/20;
  const zero=labW+PW/2, half=PW/2;
  const x=v=>zero+half*Math.max(-1,Math.min(1,(v||0)/sc));
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  s+='<line x1="'+zero+'" y1="12" x2="'+zero+'" y2="'+(H-12)+'" stroke="#3F3D4C" stroke-width="1.2"/>'+
     '<text x="'+zero+'" y="8" text-anchor="middle" font-size="8" fill="#3F3D4C">0</text>'+
     '<text x="'+(labW)+'" y="8" text-anchor="start" font-size="8" fill="#A9A6B0">−'+(sc*100).toFixed(0)+'pp</text>'+
     '<text x="'+(labW+PW)+'" y="8" text-anchor="end" font-size="8" fill="#A9A6B0">+'+(sc*100).toFixed(0)+'pp</text>';
  items.forEach((it,i)=>{
    const y=i*PITCH+14, xv=x(it.v), xt=x(it.target);
    s+='<text x="'+(labW-8)+'" y="'+(y+BH-3)+'" text-anchor="end" font-size="9.5" font-weight="600" fill="#111222">'+esc(it.label)+'</text>';
    s+='<rect x="'+Math.min(zero,xv).toFixed(1)+'" y="'+y+'" width="'+Math.abs(xv-zero).toFixed(1)+
       '" height="'+BH+'" fill="'+CLR.endline+'"/>';
    s+='<line x1="'+xt.toFixed(1)+'" y1="'+(y-3)+'" x2="'+xt.toFixed(1)+'" y2="'+(y+BH+3)+
       '" stroke="'+CLR.ref+'" stroke-width="2"/>';
    s+='<text x="'+(labW+PW+8)+'" y="'+(y+BH-3)+'" font-size="8.5" fill="#3F3D4C">'+
       (it.v==null?"—":(it.v>0?"+":"")+(it.v*100).toFixed(1))+' / '+
       (it.target>0?"+":"")+(it.target*100).toFixed(0)+'</text>';
  });
  return s+'</svg>';
}
/* ==========================================================================
   KERANGKA HALAMAN + BAND FILTER
   ========================================================================== */
const F={ zonal:[], ap:[], outcome:[], status:[], berlaku:"Yes", sort:null, sortDir:1, showAll:false };

const SHEETS=[
 {id:"SUMMARY", tab:"SUMMARY", c:"#FF5515",
  title:"SUMMARY — SEMUA INDIKATOR", render:renderSummary},
 {id:"ANALISIS", tab:"ANALISIS AP", c:"#111222",
  title:"ANALISIS AP — BASELINE vs ENDLINE (LOP)", render:renderAnalisis},
 {id:"ASUMSI", tab:"Asumsi Indikator", c:"#3F3D4C", cfg:true,
  title:"ASUMSI INDIKATOR", render:renderAsumsi},
 {id:"PEMETAAN", tab:"Pemetaan Indikator", c:"#3F3D4C", cfg:true,
  title:"PEMETAAN INDIKATOR", render:renderPemetaan}
];
let CUR="SUMMARY";

function buildFrames(){
  document.getElementById("sheets").innerHTML=SHEETS.map(sh=>
   '<section class="sheet" id="sh_'+sh.id+'">'+
    '<div class="hdr"><div class="hdr-top">'+
      '<h1 class="title">'+esc(sh.title)+'</h1>'+
      (sh.cfg?'<span class="cfgflag">SHEET KONFIGURASI — bukan halaman laporan. Diisi oleh PEARL.</span>':'')+
      '<div class="hdr-right"><div class="cycle">'+esc(CFG.cycle)+'</div>'+
      '<div class="stagebar" data-ver>'+esc(CFG.version)+'</div></div>'+
    '</div><div class="crumb" data-crumb></div></div>'+
    '<div class="rule4"></div>'+
    '<div class="pad" data-body></div>'+
    '<div class="ftr"><div class="ftr-l">PEARL · Wahana Visi Indonesia · Draft — tidak untuk sirkulasi eksternal'+
      ' &nbsp;·&nbsp; Data per '+esc(CFG.data_date)+'</div>'+
      '<div class="ftr-r"><span>Halaman:</span>'+SHEETS.filter(x=>x.id!==sh.id).map(x=>
        '<a href="#" data-go="'+x.id+'">'+esc(x.tab)+'</a>').join('')+'</div></div>'+
   '</section>').join('');
  document.getElementById("tabbar").innerHTML=SHEETS.map(sh=>
    '<button class="tab" data-tab="'+sh.id+'"><span class="dot" style="background:'+sh.c+'"></span>'+
    esc(sh.tab)+'</button>').join('');
}
function crumbLine(){
  const c=checks();
  const chipOf=(txt,ok)=>'<span class="ichip '+(ok?"ok":"no")+'">'+(ok?"● ":"▲ ")+esc(txt)+'</span>';
  return 'Data per <b>'+esc(CFG.data_date)+'</b> &nbsp;·&nbsp; <b>'+n0(c.n)+'</b> baris &nbsp;·&nbsp; <b>'+
    AP_LIST.length+'</b> AP &nbsp;·&nbsp; <b>'+ZONALS.length+'</b> Zonal &nbsp;·&nbsp; '+
    chipOf(c.rowid,c.rowid==="ROW ID OK")+chipOf(c.sinkron,c.sinkron==="SINKRON")+
    chipOf(c.dupe,c.comboDupe===0);
}
function go(id){
  if(!SHEETS.some(s=>s.id===id))return;
  CUR=id;
  SHEETS.forEach(s=>document.getElementById("sh_"+s.id).classList.toggle("on",s.id===id));
  document.querySelectorAll(".tab[data-tab]").forEach(b=>b.classList.toggle("on",b.dataset.tab===id));
  paint(id); window.scrollTo({top:0,behavior:"instant"});
}
function paint(id){
  const sh=SHEETS.find(s=>s.id===id); if(!sh)return;
  const el=document.getElementById("sh_"+id);
  el.querySelector("[data-crumb]").innerHTML=crumbLine();
  el.querySelector("[data-ver]").textContent=CFG.version;
  el.querySelector("[data-body]").innerHTML=sh.render();
  wire(id,el);
}
function repaint(){ paint(CUR); }
function card(lab,val,sub,cls){
  return '<div class="card '+(cls||"neutral")+'"><div class="lab">'+lab+'</div>'+
    '<div><div class="val">'+val+'</div><div class="sub">'+(sub||"&nbsp;")+'</div></div></div>';
}

/* ---------- filter ---------- */
function filtered(){
  return S.rows.filter(r=>
    (!F.zonal.length   || F.zonal.indexOf(r.Zonal)>=0) &&
    (!F.ap.length      || F.ap.indexOf(r["Area Program"])>=0) &&
    (!F.outcome.length || F.outcome.indexOf(r.Outcome)>=0) &&
    (!F.status.length  || F.status.indexOf(r._status)>=0) &&
    (F.berlaku==="(Semua)" || r._berlaku===F.berlaku));
}
function slicerBox(name,field,items,multi){
  const sel=multi?F[field]:[F[field]];
  return '<div class="slicer"><div class="sh"><span>'+esc(name)+'</span>'+
    (multi?'<button data-clear="'+field+'" title="Bersihkan">⌧</button>':'')+'</div><div class="items">'+
    items.map(it=>'<button data-slice="'+field+'" data-val="'+esc(it.v)+'" class="'+
      (sel.indexOf(it.v)>=0?"sel":"")+(it.n===0?" nodata":"")+'">'+esc(it.v)+
      (it.n!==undefined?' <span class="dim">'+it.n+'</span>':'')+'</button>').join('')+'</div></div>';
}
function filterBand(withStatus){
  const all=S.rows;
  const hidden=all.length-all.filter(r=>F.berlaku==="(Semua)"||r._berlaku===F.berlaku).length;
  return '<div class="fband"><div class="frow">'+
    slicerBox("Zonal","zonal",ZONALS.map(z=>({v:z,n:all.filter(r=>r.Zonal===z).length})),true)+
    slicerBox("Area Program","ap",AP_LIST.map(a=>({v:a.ap,n:all.filter(r=>r["Area Program"]===a.ap).length})),true)+
    slicerBox("Outcome","outcome",OUTCOMES.map(o=>({v:o,n:all.filter(r=>r.Outcome===o).length})),true)+
    (withStatus?slicerBox("Status Indikator","status",
      ST_IND.map(s=>({v:s.v,n:all.filter(r=>r._status===s.v).length})),true):'')+
    slicerBox("Berlaku","berlaku",["Yes","No","(Semua)"].map(v=>({v:v,
      n:v==="(Semua)"?all.length:all.filter(r=>r._berlaku===v).length})),false)+
    '</div><div class="fnote">'+
      'Filter di sini memfilter <b>tabel dan seluruh grafik sekaligus</b> — berbeda dari slicer Excel, '+
      'yang hanya memfilter tabel. '+
      (hidden>0?'<b>'+n0(hidden)+' baris</b> sedang disembunyikan oleh filter Berlaku = '+esc(F.berlaku)+'. ':'')+
      'Klik ⌧ untuk membersihkan satu filter.'+
    '</div></div>';
}
function activeLine(){
  const b=[];
  if(F.zonal.length) b.push(F.zonal.join(", "));
  if(F.ap.length) b.push(F.ap.length+" AP");
  if(F.outcome.length) b.push(F.outcome.join(", "));
  if(F.status.length) b.push(F.status.join(", "));
  if(F.berlaku!=="(Semua)") b.push("Berlaku "+F.berlaku);
  return b.length?' <span class="hint">'+esc(b.join(" · "))+'</span>':' <span class="hint">tanpa filter</span>';
}
function sortRows(rows,cols){
  if(!F.sort) return rows;
  const k=F.sort;
  return rows.slice().sort((a,b)=>{
    let x=a[k], y=b[k];
    const nx=typeof x==="number", ny=typeof y==="number";
    if(nx&&ny) return (x-y)*F.sortDir;
    return String(x==null?"":x).localeCompare(String(y==null?"":y))*F.sortDir;
  });
}
const th = (label,key,cls) => '<th class="'+(cls||"")+(F.sort===key?" sorted":"")+'" data-sort="'+key+'">'+
  label+(F.sort===key?(F.sortDir>0?' ▲':' ▼'):'')+'</th>';

/* ==========================================================================
   HALAMAN 1 — SUMMARY
   ========================================================================== */
function renderSummary(){
  const rows=filtered(), n=rows.length;
  const aps=uniq(rows.map(r=>r["Area Program"]));
  const inds=uniq(rows.map(r=>r.Indicator));
  const ada=rows.filter(r=>N(r.Pct_Base)>0).length;
  const belum=n-ada;
  const setT=rows.filter(r=>r.AP_vs_Threshold==="Set target").length;
  const mon=rows.filter(r=>r.AP_vs_Threshold==="Monitor Indicator").length;
  const kosong=n-setT-mon;

  /* G1 · kelengkapan baseline per AP */
  const g1=aps.map(ap=>{
    const rs=rows.filter(r=>r["Area Program"]===ap);
    const a=rs.filter(r=>N(r.Pct_Base)>0).length;
    return {label:ap, vals:[a, rs.length-a], pct:rs.length?a/rs.length:0};
  }).sort((a,b)=>b.pct-a.pct);

  /* G2 · komposisi indikator per outcome × zonal */
  const g2=OUTCOMES.map(o=>({label:o,
    vals:ZONALS.map(z=>rows.filter(r=>r.Outcome===o&&r.Zonal===z).length)}));

  /* G3 · keputusan AP */
  const g3=[{label:"Set target",v:setT},{label:"Monitor Indicator",v:mon},
            {label:"Belum diisi",v:kosong,hl:CLR.hati}];

  /* G4 · rata-rata baseline vs threshold per indikator */
  const g4=S.cat.map(c=>{
    const rs=rows.filter(r=>r.Indicator===c.ind);
    return {label:c.short,
      a:avg(rs.map(r=>N(r.Pct_Base)).filter(v=>v>0)),
      b:avg(rs.map(r=>N(r.Threshold)).filter(v=>v>0))};
  }).filter(x=>x.a!=null||x.b!=null);

  const COLS=[["Zonal","Zonal"],["Area Program","Area Program"],["Outcome","Outcome"],["Code","Code"],
    ["Indicator","Indikator"],["Num_Base","Num Base"],["Den_Base","Den Base"],["Pct_Base","% Baseline"],
    ["Num_LOP","Num LOP"],["Den_LOP","Den LOP"],["Pct_LOP","% LOP"],["Delta","Delta"],
    ["AP_Decision","AP Decision"],["Threshold","Threshold"],["AP_vs_Threshold","AP ≥ Threshold?"],
    ["Delta_LOP_Base","Delta LOP−Base"],["Row_ID","Row ID"]];
  const view=sortRows(rows);
  const cap=F.showAll?view.length:Math.min(view.length,150);

  return filterBand(false)+

  '<div class="slabel">Ringkasan nasional'+activeLine()+'</div>'+
  '<div class="cards">'+
    card("Baris<br>indikator",n0(n),(n!==S.rows.length?"dari "+n0(S.rows.length)+" baris":"seluruh submission"),"accent")+
    card("Area<br>Program",aps.length,"dari "+AP_LIST.length+" terdaftar","teal")+
    card("Indikator<br>unik",inds.length,"dari "+S.cat.length+" di pemetaan","neutral")+
    card("Ada<br>baseline",n0(ada),(n?(ada/n*100).toFixed(1)+"%":"—"),"ready")+
    card("Belum ada<br>baseline",n0(belum),(n?(belum/n*100).toFixed(1)+"%":"—"),"belum")+
    card("Set<br>target",n0(setT),"","review")+
    card("Monitor<br>Indicator",n0(mon),n0(kosong)+" belum diisi","monitor")+
  '</div>'+

  '<div class="grid2" style="margin-top:22px">'+
    '<div><div class="slabel" style="margin-top:0">G1 · Kelengkapan baseline per Area Program</div>'+
      '<div class="chartbox">'+chartStack(g1,[["Ada baseline",CLR.baik],["Belum ada baseline",CLR.belum]],
        {pct100:true,labW:138})+legend([["Ada baseline",CLR.baik],["Belum ada baseline",CLR.belum]])+'</div></div>'+
    '<div><div class="slabel" style="margin-top:0">G2 · Komposisi indikator per Outcome</div>'+
      '<div class="chartbox">'+chartStack(g2,ZONALS.map((z,i)=>[z,CLR.zonal[i%4]]),{labW:70,bh:22,gap:12})+
        legend(ZONALS.map((z,i)=>[z,CLR.zonal[i%4]]))+'</div></div>'+
  '</div>'+

  '<div class="grid2" style="margin-top:20px">'+
    '<div><div class="slabel" style="margin-top:0">G3 · Keputusan AP</div>'+
      '<div class="chartbox">'+chartBar(g3,CLR.baseline,{labW:150,bh:24})+'</div></div>'+
    '<div><div class="slabel" style="margin-top:0">G4 · Baseline vs Threshold per indikator</div>'+
      '<div class="chartbox">'+chartPair(g4,["Baseline",CLR.baseline],["Threshold",CLR.threshold],{labW:250})+
        legend([["Rata-rata Baseline",CLR.baseline],["Threshold",CLR.threshold]])+
        '<p class="chartnote">Rata-rata antar Area Program, hanya baris dengan nilai &gt; 0. '+
        'Bersifat indikatif, bukan angka nasional resmi.</p></div></div>'+
  '</div>'+

  '<div class="slabel">Tabel lengkap semua indikator '+
    '<span class="hint">'+n0(view.length)+' baris'+(cap<view.length?' · menampilkan '+cap:'')+
    ' · klik judul kolom untuk mengurutkan</span></div>'+
  '<div class="tscroll"><table class="gt tight"><thead><tr>'+
    COLS.map(c=>th(c[1],c[0],(["Num_Base","Den_Base","Pct_Base","Num_LOP","Den_LOP","Pct_LOP",
      "Delta","Threshold","Delta_LOP_Base"].indexOf(c[0])>=0)?"r":"")).join('')+
    '</tr></thead><tbody>'+
    view.slice(0,cap).map(r=>{
      const dec=r.AP_vs_Threshold;
      return '<tr'+(r._berlaku==="No"?' class="oos"':'')+'>'+
      '<td class="dim">'+esc(r.Zonal)+'</td><td>'+esc(r["Area Program"])+'</td>'+
      '<td class="c dim">'+esc(r.Outcome)+'</td>'+
      '<td class="code'+(isBlank(r.Code)?' miss':'')+'">'+(isBlank(r.Code)?'—':esc(r.Code))+'</td>'+
      '<td class="ind" title="'+esc(r.Indicator)+'">'+esc(r._short)+'</td>'+
      '<td class="r dim">'+n0(r.Num_Base)+'</td><td class="r dim">'+n0(r.Den_Base)+'</td>'+
      '<td class="'+(N(r.Pct_Base)===0?"miss":"r")+'">'+pctD(r.Pct_Base)+'</td>'+
      '<td class="r dim">'+n0(r.Num_LOP)+'</td><td class="r dim">'+n0(r.Den_LOP)+'</td>'+
      '<td class="'+(N(r.Pct_LOP)===0?"belumcell":"r")+'">'+pctD(r.Pct_LOP)+'</td>'+
      '<td class="r '+(N(r.Delta)>0?"up":N(r.Delta)<0?"down":"dim")+'">'+
        (N(r.Delta)===0?"—":(N(r.Delta)>0?"+":"")+(N(r.Delta)*100).toFixed(1)+"pp")+'</td>'+
      '<td class="r dim">'+(isBlank(r.AP_Decision)?"—":(typeof r.AP_Decision==="number"?(r.AP_Decision*100).toFixed(0)+"pp":esc(r.AP_Decision)))+'</td>'+
      '<td class="'+(N(r.Threshold)===0?"miss":"r")+'">'+pctT(r.Threshold)+'</td>'+
      '<td class="'+(dec==="Monitor Indicator"?"moncell":(isBlank(dec)||dec==="0"||dec===0)?"miss":"")+'">'+
        ((isBlank(dec)||dec==="0"||dec===0)?"belum diisi":esc(dec))+'</td>'+
      '<td class="r '+(N(r.Delta_LOP_Base)>0?"up":N(r.Delta_LOP_Base)<0?"down":"dim")+'">'+
        (N(r.Delta_LOP_Base)===0?"—":(N(r.Delta_LOP_Base)*100).toFixed(1)+"pp")+'</td>'+
      '<td class="code dim'+(r._iddupe?' miss':'')+'">'+esc(r.Row_ID)+'</td></tr>';
    }).join('')+
    '</tbody></table></div>'+
  (cap<view.length?'<div class="morebar"><button class="ghost" data-act="showAll">Tampilkan seluruh '+
    n0(view.length)+' baris</button></div>':'')+
  '<p class="tcap">Sel merah pada % Baseline dan Threshold menandai nilai <b>0</b>, yang menurut konvensi PEARL '+
   'berarti <b>belum ada data</b> — bukan nol sebenarnya. Baris abu-abu miring adalah baris dengan '+
   '<b>Berlaku = No</b> pada pemetaan.</p>';
}
/* ==========================================================================
   HALAMAN 2 — ANALISIS AP
   ========================================================================== */
function renderAnalisis(){
  const rows=filtered(), n=rows.length;
  const cnt=(k,v)=>rows.filter(r=>r[k]===v).length;
  const aps=uniq(rows.map(r=>r["Area Program"]));

  /* G5 · status indikator per AP */
  const g5=aps.map(ap=>{
    const rs=rows.filter(r=>r["Area Program"]===ap);
    return {label:ap, vals:ST_IND.map(s=>rs.filter(r=>r._status===s.v).length),
      score:rs.filter(r=>r._status==="Baik"||r._status==="Perlu ditinjau").length/(rs.length||1)};
  }).sort((a,b)=>b.score-a.score);

  /* G6 · endline vs threshold per AP — urutan sama dengan G5 supaya bisa dibaca berpasangan */
  const g6=g5.map(x=>{
    const rs=rows.filter(r=>r["Area Program"]===x.label);
    return {label:x.label, vals:ST_THR.map(s=>rs.filter(r=>r._thr_status===s.v).length)};
  });

  /* G7 · delta vs target per indikator */
  const g7=S.cat.map(c=>{
    const rs=rows.filter(r=>r.Indicator===c.ind);
    return {label:c.short, vals:ST_TGT.map(s=>rs.filter(r=>r._tgt_status===s.v).length),
      tot:rs.length};
  }).filter(x=>x.tot>0);

  /* G8 · delta rata-rata vs target delta per indikator */
  const g8=S.cat.map(c=>{
    const rs=rows.filter(r=>r.Indicator===c.ind);
    const d=avg(rs.map(r=>r._delta).filter(v=>v!==null));
    return {label:c.short, v:d, target:targetOf(c.ind), tot:rs.length};
  }).filter(x=>x.tot>0);

  const COLS=[["Zonal","Zonal"],["Area Program","Area Program"],["Outcome","Outcome"],["Code","Code"],
    ["Indicator","Indikator"],["Pct_Base","% Baseline"],["Pct_LOP","% Endline"],["Threshold","Threshold"],
    ["_thr_status","Endline vs Threshold"],["_delta","Delta"],["_tgt_status","Delta vs Target"],
    ["_arah","Arah"],["_target","Target Delta"],["_status","Status Indikator"],["_berlaku","Berlaku"]];
  const view=sortRows(rows);
  const cap=F.showAll?view.length:Math.min(view.length,150);
  const c=checks();

  return filterBand(true)+

  '<div class="slabel">Ringkasan status'+activeLine()+'</div>'+
  '<div class="cards">'+
    card("Baik",cnt("_status","Baik"),"threshold ✓ dan target ✓","ready")+
    card("Perlu<br>ditinjau",cnt("_status","Perlu ditinjau"),"salah satu tercapai","review")+
    card("Perlu<br>perhatian",cnt("_status","Perlu perhatian"),"keduanya belum","critical")+
    card("Belum<br>ada data",cnt("_status","Belum ada data"),(n?(cnt("_status","Belum ada data")/n*100).toFixed(1)+"% dari baris":""),"belum")+
    card("Tercapai<br>threshold",cnt("_thr_status","Tercapai"),cnt("_thr_status","Tidak tercapai")+" tidak tercapai","teal")+
    card("Capai<br>target",cnt("_tgt_status","Capai target"),cnt("_tgt_status","Meleset dari target")+" meleset","accent")+
  '</div>'+
  '<div class="legendrow"><span class="lbl">Legend</span>'+
    ST_IND.map(s=>'<span class="pill '+s.cls+'"><span class="ic">'+s.ic+'</span>'+s.v+'</span> '+
      '<span class="ldesc">'+esc(s.desc)+'</span>').join('')+
    '<span class="ldesc" style="margin-left:auto">Target Delta default <b>'+
      (CFG.target_delta*100).toFixed(0)+'pp</b></span></div>'+

  '<div class="grid2" style="margin-top:22px">'+
    '<div><div class="slabel" style="margin-top:0">G5 · Status indikator per Area Program</div>'+
      '<div class="chartbox">'+chartStack(g5,SER_IND,{pct100:true,labW:138})+legend(SER_IND)+'</div></div>'+
    '<div><div class="slabel" style="margin-top:0">G6 · Endline vs Threshold per Area Program</div>'+
      '<div class="chartbox">'+chartStack(g6,SER_THR,{pct100:true,labW:138})+legend(SER_THR)+
      '<p class="chartnote">Urutan baris sama dengan G5, jadi kedua grafik bisa dibaca berpasangan.</p></div></div>'+
  '</div>'+

  '<div class="grid2" style="margin-top:20px">'+
    '<div><div class="slabel" style="margin-top:0">G7 · Delta vs Target per indikator</div>'+
      '<div class="chartbox">'+chartStack(g7,SER_TGT,{pct100:true,labW:250,bh:12,gap:6})+legend(SER_TGT)+'</div></div>'+
    '<div><div class="slabel" style="margin-top:0">G8 · Delta rata-rata vs Target Delta</div>'+
      '<div class="chartbox">'+chartDiverge(g8,{labW:250})+
        legend([["Delta rata-rata",CLR.endline]],'<div><i style="background:'+CLR.ref+';width:3px"></i>Target Delta</div>')+
        '<p class="chartnote">Delta rata-rata hanya dari baris yang punya baseline dan endline. '+
        'Indikator berarah Turun bernilai negatif — target tercapai bila Delta ≤ Target Delta.</p></div></div>'+
  '</div>'+

  '<div class="slabel">Tabel analisis '+
    '<span class="hint">'+n0(view.length)+' baris'+(cap<view.length?' · menampilkan '+cap:'')+'</span></div>'+
  '<div class="tscroll"><table class="gt tight"><thead><tr>'+
    COLS.map(x=>th(x[1],x[0],(["Pct_Base","Pct_LOP","Threshold","_delta","_target"].indexOf(x[0])>=0)?"r":"")).join('')+
    '</tr></thead><tbody>'+
    view.slice(0,cap).map(r=>'<tr'+(r._berlaku==="No"?' class="oos"':'')+'>'+
      '<td class="dim">'+esc(r.Zonal)+'</td><td>'+esc(r["Area Program"])+'</td>'+
      '<td class="c dim">'+esc(r.Outcome)+'</td>'+
      '<td class="code'+(isBlank(r.Code)?' miss':'')+'">'+(isBlank(r.Code)?'—':esc(r.Code))+'</td>'+
      '<td class="ind" title="'+esc(r.Indicator)+'">'+esc(r._short)+'</td>'+
      '<td class="'+(N(r.Pct_Base)===0?"miss":"r")+'">'+pctD(r.Pct_Base)+'</td>'+
      '<td class="'+(N(r.Pct_LOP)===0?"belumcell":"r")+'">'+pctD(r.Pct_LOP)+'</td>'+
      '<td class="'+(N(r.Threshold)===0?"miss":"r")+'">'+pctT(r.Threshold)+'</td>'+
      '<td>'+pill(r._thr_status)+'</td>'+
      '<td class="r '+(r._wrongway?"wrongway":(r._delta>0?"up":r._delta<0?"down":"dim"))+'"'+
        (r._wrongway?' title="Delta bergerak berlawanan dengan arah indikator"':'')+'>'+ppD(r._delta)+'</td>'+
      '<td>'+pill(r._tgt_status)+'</td>'+
      '<td class="c '+(r._arah==="Turun"?"turun":"naik")+'">'+esc(r._arah)+'</td>'+
      '<td class="r dim">'+(r._target>0?"+":"")+(r._target*100).toFixed(0)+'pp</td>'+
      '<td>'+pill(r._status)+'</td>'+
      '<td class="c '+(r._berlaku==="No"?"nocell":"dim")+'">'+esc(r._berlaku)+'</td></tr>').join('')+
    '</tbody></table></div>'+
  (cap<view.length?'<div class="morebar"><button class="ghost" data-act="showAll">Tampilkan seluruh '+
    n0(view.length)+' baris</button></div>':'')+
  '<p class="tcap">Delta yang ditandai <span class="wrongway">merah tebal</span> bergerak '+
   '<b>berlawanan</b> dengan arah indikator — kasus yang paling mudah terlewat saat membaca cepat. '+
   'Arah dan Target Delta diambil dari <a href="#" data-go="ASUMSI">Asumsi Indikator</a>; '+
   'Berlaku dari <a href="#" data-go="PEMETAAN">Pemetaan Indikator</a>.</p>'+

  (c.comboDupe>0?
  '<div class="slabel">Duplikat AP × indikator <span class="hint">tidak tertangkap oleh cek Row ID</span></div>'+
  '<div class="warnbox"><b>'+c.comboDupe+' kombinasi</b> Area Program × indikator muncul lebih dari satu kali, '+
   'mencakup <b>'+n0(c.dupeRows)+' baris</b>. Row ID-nya unik, jadi cek ROW ID tetap lolos — tapi setiap '+
   'hitungan per AP dan setiap rata-rata per indikator menghitungnya dua kali.</div>'+
  '<div class="tscroll"><table class="gt tight"><thead><tr><th>Area Program</th><th>Indikator</th>'+
    '<th class="r">Muncul</th><th>Row ID</th><th class="r">% Baseline</th><th class="r">% Endline</th>'+
    '<th class="r">Threshold</th></tr></thead><tbody>'+
    (()=>{const g={}; S.rows.filter(r=>r._dupe).forEach(r=>{
        const k=r["Area Program"]+"|"+r.Indicator; (g[k]=g[k]||[]).push(r);});
      return Object.keys(g).slice(0,40).map(k=>{const v=g[k];
        return v.map((r,i)=>'<tr'+(i?'':' class="grp"')+'>'+
          (i?'<td></td><td></td><td></td>':'<td><b>'+esc(r["Area Program"])+'</b></td>'+
            '<td class="ind" title="'+esc(r.Indicator)+'">'+esc(r._short)+'</td>'+
            '<td class="r crit" rowspan="'+v.length+'">'+v.length+'×</td>')+
          '<td class="code">'+esc(r.Row_ID)+'</td>'+
          '<td class="'+(N(r.Pct_Base)===0?"miss":"r")+'">'+pctD(r.Pct_Base)+'</td>'+
          '<td class="'+(N(r.Pct_LOP)===0?"belumcell":"r")+'">'+pctD(r.Pct_LOP)+'</td>'+
          '<td class="'+(N(r.Threshold)===0?"miss":"r")+'">'+pctT(r.Threshold)+'</td></tr>').join('');
      }).join('');})()+
    '</tbody></table></div>':'');
}

/* ==========================================================================
   SHEET KONFIGURASI 1 — Asumsi Indikator
   ========================================================================== */
function renderAsumsi(){
  const rows=S.asumsi;
  return '<div class="notice">Indikator yang <b>tidak</b> terdaftar di sini otomatis dianggap '+
    '<b>Arah = Naik</b> dengan <b>Target Delta = '+(CFG.target_delta*100).toFixed(0)+'pp</b>. '+
    'Asumsi default itu tidak disembunyikan: ia tertulis di sini supaya terlihat.</div>'+

  '<div class="fgrid" style="margin-top:16px;max-width:420px">'+
    '<div class="fg"><label>Target Delta default</label>'+
      '<input type="number" step="1" data-cfg="target_delta" value="'+(CFG.target_delta*100).toFixed(0)+'">'+
      '<div class="hlp">Dalam poin persentase. Dipakai untuk semua indikator yang tidak ada di tabel di bawah.</div></div>'+
  '</div>'+

  '<div class="slabel">tblAsumsi <span class="hint">'+rows.length+' indikator diatur khusus</span></div>'+
  '<div class="tscroll"><table class="gt ed"><thead><tr><th>Indikator</th><th class="c">Arah</th>'+
    '<th class="r">Target Delta (pp)</th><th>Cek nama</th><th></th></tr></thead><tbody>'+
    rows.map((a,i)=>{
      const known=IND_LIST.indexOf(a.ind)>=0;
      const used=S.rows.filter(r=>r.Indicator===a.ind).length;
      return '<tr><td><select class="cell wide" data-as="'+i+'" data-k="ind">'+
        IND_LIST.map(x=>'<option'+(x===a.ind?" selected":"")+' value="'+esc(x)+'">'+esc(shortOf(x))+'</option>').join('')+
        (known?'':'<option selected value="'+esc(a.ind)+'">'+esc(a.ind)+'</option>')+'</select></td>'+
        '<td class="c"><select class="cell" data-as="'+i+'" data-k="arah">'+
          ["Naik","Turun"].map(x=>'<option'+(x===a.arah?" selected":"")+'>'+x+'</option>').join('')+'</select></td>'+
        '<td class="r"><input class="cell r" size="6" type="number" step="1" data-as="'+i+
          '" data-k="delta" value="'+(a.delta*100).toFixed(0)+'"></td>'+
        '<td>'+(known?'<span class="ichip ok">● OK · '+used+' baris</span>'
                     :'<span class="ichip no">▲ NAMA TIDAK DIKENAL</span>')+'</td>'+
        '<td><button class="tiny warn" data-act="delAsumsi" data-i="'+i+'">hapus</button></td></tr>';
    }).join('')+'</tbody></table></div>'+
  '<div class="addbar"><span>Tambah asumsi</span>'+
    '<select id="newAsInd" style="max-width:420px">'+
      IND_LIST.filter(x=>!S.asumsi.some(a=>a.ind===x)).map(x=>
        '<option value="'+esc(x)+'">'+esc(shortOf(x))+'</option>').join('')+'</select>'+
    '<select id="newAsArah"><option>Turun</option><option>Naik</option></select>'+
    '<input id="newAsDelta" type="number" step="1" value="-10" size="5" title="poin persentase">'+
    '<button class="ghost" data-act="addAsumsi">Tambahkan</button></div>'+

  '<div class="slabel">Akibatnya pada analisis</div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Arah</th><th class="r">Indikator</th>'+
    '<th class="r">Baris</th><th class="r">Capai target</th><th class="r">Meleset</th>'+
    '<th class="r">Belum ada data</th></tr></thead><tbody>'+
    ["Naik","Turun"].map(ar=>{
      const rs=S.rows.filter(r=>r._arah===ar);
      return '<tr><td><b class="'+(ar==="Turun"?"turun":"naik")+'">'+ar+'</b></td>'+
        '<td class="r">'+uniq(rs.map(r=>r.Indicator)).length+'</td><td class="r">'+rs.length+'</td>'+
        '<td class="r">'+rs.filter(r=>r._tgt_status==="Capai target").length+'</td>'+
        '<td class="r">'+rs.filter(r=>r._tgt_status==="Meleset dari target").length+'</td>'+
        '<td class="r dim">'+rs.filter(r=>r._tgt_status==="Belum ada data").length+'</td></tr>';
    }).join('')+'</tbody></table></div>'+
  '<p class="tcap">Mengubah Arah membalik seluruh logika status untuk indikator itu: '+
   'pada arah <b>Turun</b> endline dinilai tercapai bila <b>≤</b> threshold, dan delta tercapai bila <b>≤</b> Target Delta.</p>';
}

/* ==========================================================================
   SHEET KONFIGURASI 2 — Pemetaan Indikator
   ========================================================================== */
function renderPemetaan(){
  const P=S.pemetaan;
  const unknown=P.aps.filter(a=>!AP_LIST.some(x=>x.ap===a));
  const yes=P.rows.reduce((n,p)=>n+p.v.filter(v=>String(v).toLowerCase()!=="no").length,0);
  const tot=P.rows.length*P.aps.length;

  return '<div class="notice">Matriks Yes/No: apakah indikator itu <b>berlaku</b> untuk AP tersebut. '+
    'Kombinasi yang di-set <b>No</b> tetap ada di data, tapi bisa disembunyikan lewat filter '+
    '<b>Berlaku</b> di kedua halaman laporan. Nama kolom AP harus persis sama dengan '+
    '<span class="keyprev">Area Program</span> di data.</div>'+

  '<div class="health" style="margin-top:14px">'+
    '<div class="m">Indikator<b>'+P.rows.length+'</b></div>'+
    '<div class="m">Area Program<b>'+P.aps.length+'</b></div>'+
    '<div class="m">Berlaku (Yes)<b style="color:var(--green)">'+n0(yes)+'</b></div>'+
    '<div class="m">Tidak berlaku (No)<b style="color:var(--grey)">'+n0(tot-yes)+'</b></div>'+
    '<div class="m">Cek nama AP<b>'+(unknown.length
      ?'<span class="ichip no">▲ '+esc(unknown.join(", "))+'</span>'
      :'<span class="ichip ok">● semua dikenal</span>')+'</b></div>'+
  '</div>'+

  '<div class="tscroll" style="margin-top:12px"><table class="gt ed matrix"><thead><tr>'+
    '<th class="sticky">Indikator</th><th class="c">Code</th>'+
    P.aps.map(a=>'<th class="c vert"><span>'+esc(a)+'</span></th>').join('')+
    '<th class="r">Yes</th></tr></thead><tbody>'+
    P.rows.map((p,i)=>{
      const y=p.v.filter(v=>String(v).toLowerCase()!=="no").length;
      return '<tr><td class="sticky ind" title="'+esc(p.ind)+'">'+esc(shortOf(p.ind))+'</td>'+
        '<td class="c code dim">'+(isBlank(p.code)?"—":esc(p.code))+'</td>'+
        p.v.map((v,k)=>{
          const on=String(v).toLowerCase()!=="no";
          return '<td class="c"><button class="yn '+(on?"y":"n")+'" data-pem="'+i+'" data-k="'+k+
            '" title="'+esc(P.aps[k])+'">'+(on?"Yes":"No")+'</button></td>';
        }).join('')+
        '<td class="r">'+y+'</td></tr>';
    }).join('')+
    '</tbody><tfoot><tr><td class="sticky">Berlaku per AP</td><td></td>'+
      P.aps.map((a,k)=>'<td class="c">'+P.rows.filter(p=>String(p.v[k]).toLowerCase()!=="no").length+'</td>').join('')+
      '<td class="r">'+n0(yes)+'</td></tr></tfoot></table></div>'+
  '<p class="tcap">Klik satu sel untuk membaliknya. Perubahan langsung menghitung ulang kolom '+
   '<b>Berlaku</b> di kedua halaman laporan. Untuk menyimpannya permanen, unduh '+
   '<span class="keyprev">pemetaan.js</span> dari tombol Simpan di atas dan commit ke repository.</p>';
}

/* ==========================================================================
   WIRING
   ========================================================================== */
function wire(id,el){
  el.querySelectorAll("[data-go]").forEach(a=>a.onclick=ev=>{ev.preventDefault();go(a.dataset.go);});
  el.querySelectorAll("[data-sort]").forEach(t=>t.onclick=()=>{
    const k=t.dataset.sort;
    if(F.sort===k) F.sortDir=-F.sortDir; else {F.sort=k;F.sortDir=1;}
    paint(id);
  });
  el.querySelectorAll("[data-slice]").forEach(b=>b.onclick=()=>{
    const f=b.dataset.slice, v=b.dataset.val;
    if(f==="berlaku") F.berlaku=v;
    else { const i=F[f].indexOf(v); i>=0?F[f].splice(i,1):F[f].push(v); }
    F.showAll=false; paint(id);
  });
  el.querySelectorAll("[data-clear]").forEach(b=>b.onclick=()=>{F[b.dataset.clear]=[];paint(id);});
  el.querySelectorAll("[data-cfg]").forEach(c=>c.onchange=()=>{
    CFG.target_delta=(parseFloat(c.value)||0)/100; recompute(); saveLocal(); paint(id);
    toast('Target Delta default sekarang <b>'+(CFG.target_delta*100).toFixed(0)+'pp</b>. Seluruh analisis dihitung ulang.');
  });
  el.querySelectorAll("[data-as]").forEach(c=>c.onchange=()=>{
    const a=S.asumsi[+c.dataset.as], k=c.dataset.k;
    a[k] = k==="delta" ? (parseFloat(c.value)||0)/100 : c.value;
    recompute(); saveLocal(); paint(id);
  });
  el.querySelectorAll("[data-pem]").forEach(b=>b.onclick=()=>{
    const p=S.pemetaan.rows[+b.dataset.pem], k=+b.dataset.k;
    p.v[k] = String(p.v[k]).toLowerCase()==="no" ? "Yes" : "No";
    recompute(); saveLocal(); paint(id);
  });
  el.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>act(b,id));
}
function act(b,id){
  const a=b.dataset.act;
  if(a==="showAll"){ F.showAll=true; paint(id); return; }
  if(a==="delAsumsi"){
    const g=S.asumsi.splice(+b.dataset.i,1)[0];
    recompute(); saveLocal(); paint(id);
    toast('Asumsi dihapus. <b>'+esc(shortOf(g.ind))+'</b> sekarang dianggap Naik dengan target default.');
    return;
  }
  if(a==="addAsumsi"){
    const ind=document.getElementById("newAsInd").value;
    if(!ind){ toast('▲ Pilih indikatornya dulu.'); return; }
    if(S.asumsi.some(x=>x.ind===ind)){ toast('▲ Indikator itu sudah ada di tabel asumsi.'); return; }
    S.asumsi.push({ind:ind, arah:document.getElementById("newAsArah").value,
      delta:(parseFloat(document.getElementById("newAsDelta").value)||0)/100});
    recompute(); saveLocal(); paint(id);
    toast('Asumsi ditambahkan untuk <b>'+esc(shortOf(ind))+'</b>.');
    return;
  }
  if(a==="dlAsumsi")   return dl("asumsi.js",fileAsumsi(),"text/javascript");
  if(a==="dlPemetaan") return dl("pemetaan.js",filePemetaan(),"text/javascript");
  if(a==="dlIndicators") return dl("indicators.js",fileIndicators(),"text/javascript");
  if(a==="dlCsv")      return dlCsv();
  if(a==="reset"){ clearLocal(); location.reload(); }
}

/* ---------- unduhan ---------- */
function dl(name,text,mime){
  const b=new Blob([text],{type:(mime||"text/plain")+";charset=utf-8;"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b); a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
const jv=v=>v===null||v===undefined||v===""?"null":(typeof v==="number"?String(v):JSON.stringify(v));
const head=(t,note)=>"/* "+"=".repeat(74)+"\n   "+t+"\n   "+"-".repeat(74)+"\n   "+
  note.split("\n").join("\n   ")+"\n   Ditulis dari halaman pada "+new Date().toISOString().slice(0,10)+
  " · "+CFG.version+"\n   "+"=".repeat(74)+" */\n";
function fileAsumsi(){
  return head("tblAsumsi  —  data/asumsi.js",
    "Arah dan Target Delta per indikator. Yang tidak terdaftar dianggap Naik\n"+
    "dengan Target Delta = target_delta_default.")+
    "window.WVI_ASUMSI = {\n  target_delta_default: "+CFG.target_delta+",\n  rows: [\n"+
    S.asumsi.map(a=>'  {ind:'+JSON.stringify(a.ind)+', arah:'+JSON.stringify(a.arah)+
      ', delta:'+a.delta+'}').join(",\n")+"\n  ]\n};\n";
}
function filePemetaan(){
  return head("tblPemetaan  —  data/pemetaan.js",
    "Matriks Yes/No indikator × Area Program.")+
    "window.WVI_PEMETAAN = {\n  aps: "+JSON.stringify(S.pemetaan.aps)+",\n  rows: [\n"+
    S.pemetaan.rows.map(p=>'  {code:'+jv(p.code)+', ind:'+JSON.stringify(p.ind)+
      ', v:'+JSON.stringify(p.v)+'}').join(",\n")+"\n  ]\n};\n";
}
function fileIndicators(){
  const cols=window.WVI_INDICATORS.columns;
  return head("tblIndicators  —  data/indicators.js   ("+S.rows.length+" baris)",
    "17 kolom, urutan tidak diubah. KONVENSI PEARL: nilai 0 pada % Baseline atau\n"+
    "% LOP berarti belum ada data. Row ID wajib unik.\n"+cols.join(", "))+
    "window.WVI_INDICATORS = {\n  columns: "+JSON.stringify(cols)+",\n  rows: [\n"+
    S.rows.map(r=>"  ["+cols.map(k=>jv(r[k])).join(",")+"]").join(",\n")+"\n  ]\n};\n";
}
function dlCsv(){
  const cols=window.WVI_INDICATORS.columns.concat(
    ["_arah","_target","_thr_status","_delta","_tgt_status","_status","_berlaku"]);
  const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const csv=[cols.map(q).join(",")].concat(
    filtered().map(r=>cols.map(k=>q(r[k])).join(","))).join("\r\n");
  dl("analisis_ap.csv","\ufeff"+csv,"text/csv");
}

/* ---------- toast ---------- */
let tT=null;
function toast(html){
  const t=document.getElementById("toast");
  t.innerHTML=html; t.classList.add("on");
  clearTimeout(tT); tT=setTimeout(()=>t.classList.remove("on"),4200);
}
function chip(){
  const c=document.getElementById("dataChip"); if(!c)return;
  c.textContent=S.local?"perubahan lokal · belum di-commit":CFG.version;
  c.className=S.local?"chip local":"chip";
}
function loadLogo(){
  const img=document.getElementById("wvLogo"); if(!img)return;
  const tries=["assets/logo.svg","assets/logo.png","logo.svg","logo.png"]; let i=0;
  const t=()=>{ if(i>=tries.length){img.remove();return;}
    img.onload=()=>{img.hidden=false;}; img.onerror=()=>{i++;t();}; img.src=tries[i]; };
  t();
}

/* ==========================================================================
   KODE AKSES — pagar sopan, bukan pengamanan
   ========================================================================== */
const GK="wvi_aimplus_gate_v2";
const gateOK=()=>{try{return sessionStorage.getItem(GK)==="1";}catch(e){return false;}};
function showGate(next){
  const st=document.createElement("style");
  st.textContent="#gate{position:fixed;inset:0;z-index:200;background:#111222;display:flex;align-items:center;"+
   "justify-content:center;padding:24px;font-family:'Inter',-apple-system,'Segoe UI',Calibri,sans-serif}"+
   "#gate .box{width:100%;max-width:430px}"+
   "#gate .eyebrow{font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#FF8B5C}"+
   "#gate h1{margin:10px 0 0;font-size:23px;line-height:1.2;font-weight:700;color:#fff}"+
   "#gate .cyc{margin-top:7px;font-size:12px;color:#9C99A6}"+
   "#gate .rule{height:2px;width:54px;background:#FF5515;margin:20px 0 22px}"+
   "#gate label{display:block;font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9C99A6;margin-bottom:7px}"+
   "#gate .row{display:flex;gap:9px}"+
   "#gate input{flex:1;background:#1B1C2E;border:1px solid #3A3947;color:#fff;padding:11px 13px;font-size:14px;border-radius:2px;letter-spacing:.14em}"+
   "#gate input:focus{outline:none;border-color:#FF5515}"+
   "#gate button{background:#FF5515;border:none;color:#fff;font-weight:700;font-size:13px;padding:11px 20px;border-radius:2px;cursor:pointer}"+
   "#gate .err{min-height:18px;margin-top:11px;font-size:11.5px;font-weight:600;color:#FF8B7A}"+
   "#gate .note{margin-top:26px;padding-top:16px;border-top:1px solid #2A2937;font-size:10.5px;line-height:1.65;color:#6F6D7A}"+
   "#gate .note b{color:#9C99A6}";
  document.head.appendChild(st);
  const g=document.createElement("div"); g.id="gate";
  g.innerHTML='<div class="box"><div class="eyebrow">PEARL · Wahana Visi Indonesia</div>'+
    '<h1>AIM+ Target Setting</h1><div class="cyc">'+esc(CFG.cycle)+' · '+esc(CFG.version)+'</div>'+
    '<div class="rule"></div><label for="gi">Kode akses</label>'+
    '<div class="row"><input id="gi" type="password" placeholder="••••••••" autocomplete="off" spellcheck="false">'+
    '<button id="gb">Buka</button></div><div class="err" id="ge"></div>'+
    '<div class="note">File kerja internal. Baseline dan endline <b>masih bergerak</b> — '+
    'belum ada angka yang final, dan tidak untuk diedarkan di luar WVI.</div></div>';
  document.body.appendChild(g);
  const inp=g.querySelector("#gi"), err=g.querySelector("#ge");
  const submit=()=>{
    if(String(inp.value||"").trim().toLowerCase()===String(CFG.code).toLowerCase()){
      try{sessionStorage.setItem(GK,"1");}catch(e){}
      g.remove(); next(); return;
    }
    err.textContent="Kode itu tidak membuka halaman ini."; inp.value=""; inp.focus();
  };
  g.querySelector("#gb").onclick=submit;
  inp.onkeydown=ev=>{ if(ev.key==="Enter") submit(); };
  setTimeout(()=>inp.focus(),40);
}

/* ==========================================================================
   BOOT
   ========================================================================== */
function boot(){
  if(!window.WVI_CONFIG||!window.WVI_INDICATORS||!window.WVI_ASUMSI||!window.WVI_PEMETAAN){
    document.getElementById("sheets").innerHTML=
      '<div class="sheet on" style="padding:38px 26px"><h1 class="title">File data tidak termuat</h1>'+
      '<p style="margin-top:14px">Halaman ini membutuhkan empat file di sebelahnya:</p>'+
      '<div class="colspec">data/config.js\ndata/indicators.js\ndata/asumsi.js\ndata/pemetaan.js</div>'+
      '<p>Pastikan keempatnya ter-commit dan namanya tidak berubah.</p></div>';
    return;
  }
  adopt(); recompute();
  const sv=loadLocal();
  if(sv&&sv.rows&&sv.rows.length){
    try{
      if(sv.asumsi) S.asumsi=sv.asumsi;
      if(sv.pemetaan) S.pemetaan=sv.pemetaan;
      if(sv.target_delta!=null) CFG.target_delta=sv.target_delta;
      const col=window.WVI_INDICATORS.columns;
      S.rows=sv.rows.map(o=>{const r={}; col.forEach(k=>r[k]=o[k]); return r;});
      S.local=true; recompute();
    }catch(e){ S.local=false; }
  }
  if(gateOK()) open2(); else showGate(open2);
}
function open2(){
  buildFrames(); chip(); loadLogo();
  document.getElementById("tabbar").onclick=ev=>{
    const t=ev.target.closest(".tab"); if(t) go(t.dataset.tab);
  };
  const on=(id,fn)=>{const e=document.getElementById(id); if(e) e.onclick=fn;};
  on("btnPrint",()=>window.print());
  on("btnSave",()=>{
    dl("asumsi.js",fileAsumsi(),"text/javascript");
    setTimeout(()=>dl("pemetaan.js",filePemetaan(),"text/javascript"),350);
    setTimeout(()=>dl("indicators.js",fileIndicators(),"text/javascript"),700);
    toast('Tiga file data diunduh. Commit ke folder <b>data/</b> dengan nama yang sama.');
  });
  on("btnCsv",dlCsv);
  on("btnReset",()=>{clearLocal();location.reload();});
  go("SUMMARY");
}
document.addEventListener("DOMContentLoaded",boot);
