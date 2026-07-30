/* ==================================================================
   AIM+ AP TARGET SETTING — DECISION WORKBOOK
   Static site build · PEARL · Wahana Visi Indonesia
   --------------------------------------------------------------------
   Data lives in /data/*.js and is loaded before this file. Nothing here
   calculates a target: every formula is presentation- or validation-layer.
   ================================================================== */
"use strict";

/* ---------- SETTINGS (§2.8) · overridable on 00_MASTER ---------- */
const CFG = {
  Cycle:"Target Setting FY27–FY30",
  Stage:"Discussion",
  Version:"v1.0",
  ImportDate:"31 Jul 2026",
  Owner:"PEARL — Technical Support",
  ReadinessTarget:0.90,
  Sel_AP:"", Sel_Outcome:"OC 3",
  Footer:"PEARL · WVI · Draft — not for external circulation"
};

/* ---------- status vocabulary (§1.2) — five values, no sixth ---------- */
const STATUS = [
  {s:"READY",        sort:1, ic:"●", cls:"p-READY",       desc:"Baseline, threshold and proposal present; no flags; decision approved"},
  {s:"NEEDS REVIEW", sort:2, ic:"◆", cls:"p-NEEDSREVIEW", desc:"Complete but flagged for workshop discussion"},
  {s:"MONITOR",      sort:3, ic:"◧", cls:"p-MONITOR",     desc:"AP submission states Monitor Indicator"},
  {s:"CRITICAL",     sort:4, ic:"▲", cls:"p-CRITICAL",    desc:"Blocking data issue — cannot be discussed as-is"},
  {s:"REFERENCE",    sort:5, ic:"–", cls:"p-REFERENCE",   desc:"Outcome is not in this AP's scope — informational only"}
];
const ST = {}; STATUS.forEach(x=>ST[x.s]=x);

const STAGES = [
  {n:1,name:"Baseline",        owner:"AP DMEAL",             desc:"Row imported with baseline fields"},
  {n:2,name:"Threshold",       owner:"PEARL",                desc:"Threshold present and non-TBC"},
  {n:3,name:"Target Proposal", owner:"AP Manager",           desc:"AP proposal present"},
  {n:4,name:"Discussion",      owner:"Facilitator / AP team",desc:"A decision row exists with Status = Discussed"},
  {n:5,name:"Technical Review",owner:"Sector lead",          desc:"Decision Status = Reviewed"},
  {n:6,name:"Revision",        owner:"AP DMEAL",             desc:"Decision Status = Revision Requested"},
  {n:7,name:"Approval",        owner:"PEARL Lead",           desc:"Decision Status = Approved and Approval Date present"}
];
const OUTCOMES = ["Goal","OC 1","OC 2","OC 3","OC 4"];
const OUTCOME_LABEL = {
  "Goal":"Goal — Child well-being",
  "OC 1":"OC 1 — Health, nutrition & WASH",
  "OC 2":"OC 2 — Education & literacy",
  "OC 3":"OC 3 — Protection & participation",
  "OC 4":"OC 4 — Resilience & livelihoods"
};

/* ---------- picklists (§2.7) ---------- */
const DECISION_LIST = [
  {d:"Approve",                req:"No"},
  {d:"Approve with condition",  req:"Yes"},
  {d:"Revise target",           req:"Yes"},
  {d:"Revise data",             req:"Yes"},
  {d:"Monitor only",            req:"No"},
  {d:"Defer",                   req:"Yes"}
];
const REASONS = [
  ["Baseline missing","Data"],["Denominator missing or zero","Data"],
  ["Population figure under revision","Data"],["Data source not yet confirmed","Data"],
  ["Threshold not on record","Threshold"],["Threshold conflicts with baseline","Threshold"],
  ["Proposal below threshold","Target"],["Proposal above feasible ceiling","Target"],
  ["Reduction indicator read as increase","Target"],["Awaiting sector technical advice","Process"],
  ["Indicator not applicable to AP context","Scope"],["Monitor only — no target this cycle","Scope"]
];
const ROLES = [
  ["Bre","PEARL Lead","Kalbar"],["Rina Situmorang","PEARL Lead","National"],
  ["Andreas Latumahina","Zonal Manager","Kalbar"],["Yohana Bete","Zonal Manager","NTT"],
  ["Marthen Wenda","Zonal Manager","Papua"],["Dewi Anggraeni","Zonal Manager","Sambawa"],
  ["Fransiskus Tanjung","DMEAL Officer","Kalbar"],["Novita Amalo","DMEAL Officer","NTT"],
  ["Sonya Kogoya","DMEAL Officer","Papua"],["Ilham Pratama","DMEAL Officer","Sambawa"],
  ["Ratna Kusuma","Health & Nutrition Specialist","National"],["Bayu Setiawan","Education Specialist","National"],
  ["Maria Sanam","Child Protection Specialist","National"],["Hendra Wijaya","Livelihood Specialist","National"],
  ["Gita Lestari","WASH Specialist","National"],["Petrus Making","AP Manager","NTT"],
  ["Sri Handayani","AP Manager","Kalbar"],["Julius Mahuze","AP Manager","Papua"],
  ["Tanty Rachman","Grants & Compliance","National"],["Eko Nugroho","AP Manager","Sambawa"]
];
const REVIEWER_ROLES = ["PEARL Lead","Health & Nutrition Specialist","Education Specialist",
  "Child Protection Specialist","Livelihood Specialist","WASH Specialist","Zonal Manager"];
const STATUS_LIST = ["Not started","Discussed","Reviewed","Revision Requested","Approved","Deferred"];

/* ==================================================================
   DATA LAYER — repo files in, working state out
   ================================================================== */
const S = { master:[], dec:[], demo:true, local:false };
let REGISTER=[], INDICATORS=[], IND={}, AP_LIST=[], ZONALS=[];

function indexReference(){
  IND={}; INDICATORS.forEach(i=>IND[i.code]=i);
  AP_LIST = REGISTER.map(r=>({z:r.zonal, ap:r.ap, id:r.ap_id,
    strategic:r.strategic, outcomes:r.outcomes.slice()}));
  const seen=[]; ZONALS=[];
  AP_LIST.forEach(a=>{
    let z=ZONALS.find(x=>x.z===a.z);
    if(!z){z={z:a.z,aps:[]};ZONALS.push(z);seen.push(a.z);}
    z.aps.push([a.ap,a.id]);
  });
  if(!CFG.Sel_AP||!AP_LIST.some(a=>a.ap===CFG.Sel_AP)) CFG.Sel_AP=AP_LIST.length?AP_LIST[0].ap:"";
}
/* the outcome map — the master switch behind every view */
function apOutcomes(ap){const a=AP_LIST.find(x=>x.ap===ap);return a?a.outcomes:OUTCOMES.slice();}
function outcomeActive(ap,oc){ if(!oc) return false; return apOutcomes(ap).indexOf(oc)>=0; }

function expandMaster(pack){
  const c=pack.columns;
  return pack.rows.map(row=>{
    const r={}; c.forEach((k,i)=>r[k]=row[i]);
    const meta=IND[r.Code]||{};
    r.Indicator = meta.ind || r.Code;
    r.Indicator_Short = meta.short || r.Code;
    return r;
  });
}
function expandDecisions(pack){
  const c=pack.columns;
  return pack.rows.map(row=>{
    const d={}; c.forEach((k,i)=>d[k]=row[i]===null?"":row[i]);
    d.Row_ID=d.Zonal+"|"+d.AP+"|"+d.Code;
    return d;
  });
}
function packMaster(){
  const cols=["Zonal","AP","AP_ID","Outcome","Code","Num_Base","Den_Base","Pct_Base",
    "Num_LOP","Den_LOP","Pct_LOP","Delta","AP_Proposal","Threshold","AP_vs_Threshold"];
  return {columns:cols, rows:S.master.map(r=>cols.map(k=>{
    const v=r[k]; return (v===undefined||v==="")?null:v;}))};
}
function packDecisions(){
  const cols=["Timestamp","Zonal","AP","Code","Revision","Decision","Reason","Comment",
    "Reviewer","Owner","Due_Date","Status","Approval_Date"];
  return {columns:cols, rows:S.dec.map(d=>cols.map(k=>{
    const v=d[k]; return (v===undefined||v==="")?null:v;}))};
}

/* ---------- local edits: kept in the browser, never on a server ---------- */
const LS_KEY="wvi_aimplus_fy27_30_v1";
function saveLocal(){
  try{
    localStorage.setItem(LS_KEY,JSON.stringify({
      saved:new Date().toISOString(), cfg:CFG, register:REGISTER,
      indicators:INDICATORS, master:packMaster(), decisions:packDecisions()}));
    S.local=true; chip();
  }catch(e){ S.local=false; }
}
function loadLocal(){
  try{ const s=localStorage.getItem(LS_KEY); return s?JSON.parse(s):null; }catch(e){ return null; }
}
function clearLocal(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} }
function localAvailable(){
  try{ localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; }catch(e){ return false; }
}

/* ==================================================================
   ENGINE — every derived column of §2.1 rebuilt in one pass.
   Nothing here calculates a target. It reads submitted fields and
   renders them, exactly as the specification requires.
   ================================================================== */
function rowId(r){return r.Zonal+"|"+r.AP+"|"+r.Code;}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
const isBlank = v => v===null||v===undefined||v==="";

function recompute(){
  const m=S.master;
  /* --- sequence keys (§2.1 #19–22) --- */
  const cAP={},cOC={},dupe={};
  m.forEach(r=>{
    r.Row_ID=rowId(r);
    dupe[r.Row_ID]=(dupe[r.Row_ID]||0)+1;
    r.Seq_In_AP=(cAP[r.AP]=(cAP[r.AP]||0)+1);
    r.Seq_In_Outcome=(cOC[r.Outcome]=(cOC[r.Outcome]||0)+1);
    r.Key_AP_Seq=r.AP+"|"+r.Seq_In_AP;
    r.Key_OC_Seq=r.Outcome+"|"+r.Seq_In_Outcome;
  });
  /* --- latest decision per Row_ID (§2.4) --- */
  const latest={},count={};
  S.dec.forEach(d=>{
    if(!d.Row_ID)return;
    count[d.Row_ID]=(count[d.Row_ID]||0)+1;
    const prev=latest[d.Row_ID];
    if(!prev||(d.Revision||0)>=(prev.Revision||0)) latest[d.Row_ID]=d;
  });
  /* --- checks, flags, status, stage (§2.2 §2.3 §2.5) --- */
  m.forEach(r=>{
    r.Chk_Baseline    = (isBlank(r.Pct_Base)||isBlank(r.Num_Base))?1:0;
    r.Chk_Denominator = (isBlank(r.Den_Base)||Number(r.Den_Base)===0)?1:0;
    r.Chk_Threshold   = isBlank(r.Threshold)?1:0;
    r.Chk_Proposal    = (isBlank(r.AP_Proposal)&&isBlank(r.Pct_LOP))?1:0;
    r.Chk_Range       = ((+r.Pct_Base||0)<0||(+r.Pct_Base||0)>1||(+r.Pct_LOP||0)<0||(+r.Pct_LOP||0)>1)?1:0;
    r.Chk_Duplicate   = dupe[r.Row_ID]>1?1:0;
    r.Flag_Count      = r.Chk_Baseline+r.Chk_Denominator+r.Chk_Threshold+r.Chk_Proposal+r.Chk_Range+r.Chk_Duplicate;

    const d=latest[r.Row_ID];
    r.Latest_Rev  = count[r.Row_ID]||0;
    r.Dec_Status  = d?d.Status:"";
    r.Dec_Decision= d?d.Decision:"";
    r.Dec_Reason  = d?d.Reason:"";
    r.Dec_Reviewer= d?d.Reviewer:"";
    r.Dec_Owner   = d?d.Owner:"";
    r.Dec_Due     = d?d.Due_Date:"";
    r.Dec_Approved= d?d.Approval_Date:"";
    r.Dec_Comment = d?d.Comment:"";

    /* the outcome map decides scope: an outcome the AP does not work on is REFERENCE */
    r.Outcome_Active = outcomeActive(r.AP,r.Outcome)?1:0;
    r.In_Scope = (!isBlank(r.Outcome)&&r.Outcome_Active)?1:0;

    r.Row_Status = !r.In_Scope ? "REFERENCE"
      : r.Flag_Count>0 ? "CRITICAL"
      : r.AP_vs_Threshold==="Monitor Indicator" ? "MONITOR"
      : r.Dec_Status==="Approved" ? "READY"
      : "NEEDS REVIEW";

    r.Stage = r.Dec_Status==="Approved"?7 : r.Dec_Status==="Revision Requested"?6
      : r.Dec_Status==="Reviewed"?5 : r.Dec_Status==="Discussed"?4
      : r.Chk_Proposal===0?3 : r.Chk_Threshold===0?2 : 1;
    r.Stage_Name = STAGES[r.Stage-1].name;
  });
}

/* ---------- aggregation helpers ---------- */
const countIf = (pred)=>S.master.reduce((n,r)=>n+(pred(r)?1:0),0);
function statusMix(rows){
  const o={READY:0,"NEEDS REVIEW":0,MONITOR:0,CRITICAL:0,REFERENCE:0};
  rows.forEach(r=>o[r.Row_Status]++); return o;
}
const uniq = a => Array.from(new Set(a));
const byAP = ap => S.master.filter(r=>r.AP===ap);
const byZ  = z  => S.master.filter(r=>r.Zonal===z);
const apsOf = z => AP_LIST.filter(a=>a.z===z).map(a=>a.ap);
const zoneOfAP = ap => (AP_LIST.find(a=>a.ap===ap)||{}).z||"";
const idOfAP   = ap => (AP_LIST.find(a=>a.ap===ap)||{}).id||"";

const FLAGS=[
  ["Chk_Baseline","Missing baseline","MISSING<br>BASELINE"],
  ["Chk_Denominator","Missing denominator","MISSING<br>DENOMIN."],
  ["Chk_Threshold","Missing threshold","MISSING<br>THRESH."],
  ["Chk_Proposal","No proposal recorded","MISSING<br>PROPOSAL"],
  ["Chk_Duplicate","Duplicate keys","DUPLICATE<br>KEYS"],
  ["Chk_Range","Proportion out of range","RANGE<br>ERROR"]
];
const flagSum = k => S.master.reduce((n,r)=>n+r[k],0);
function importGate(){
  if(S.master.length===0) return "NO DATA IMPORTED";
  if(flagSum("Chk_Duplicate")>0) return "DUPLICATE KEYS — DO NOT DISTRIBUTE";
  return "IMPORT OK";
}
const inScope = () => S.master.filter(r=>r.In_Scope);
function progress(){const s=inScope();return s.length?s.filter(r=>r.Stage===7).length/s.length:0;}

/* ---------- formatters (§7.6) ---------- */
const pct  = (v,d)=> isBlank(v)?"—":(v*100).toFixed(d===undefined?1:d)+"%";
const pctT = v => isBlank(v)?"TBC":(v*100).toFixed(1)+"%";
const n0   = v => isBlank(v)?"—":Number(v).toLocaleString("en-US");
const sign = v => isBlank(v)?"—":(v>0?"+":"")+Number(v).toFixed(2);
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dmy(s){if(!s)return"—";const p=String(s).slice(0,10).split("-");
  if(p.length<3)return s;return p[2]+" "+MON[+p[1]-1]+" "+p[0];}
const TODAY="2026-07-31";
function pill(st){const x=ST[st]||ST.REFERENCE;
  return '<span class="pill '+x.cls+'"><span class="ic">'+x.ic+'</span>'+st+'</span>';}
function bar(v,red){const p=Math.max(0,Math.min(1,v||0));
  return '<div class="bar'+(red?' red':'')+'"><i style="width:'+(p*100).toFixed(1)+'%"></i>'+
         '<span>'+(p*100).toFixed(0)+'%</span></div>';}

/* ==================================================================
   CHARTS — inline SVG. No library, no chart object to break.
   ================================================================== */
const SERIES=[["READY","#E8F1EC","#155930"],["NEEDS REVIEW","#FFF4CE","#6B4E00"],
  ["MONITOR","#FFE9E0","#A33000"],["CRITICAL","#FDE7EB","#B10831"],
  ["REFERENCE","#F3F2F0","#3F3D4C"]];

/* 100% stacked horizontal bar — §6.2 ·7 */
function chartStacked(items,labW){
  labW=labW||118;
  const W=700,BH=21,GAP=13,PITCH=BH+GAP,H=items.length*PITCH+8,PW=W-labW-46;
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  items.forEach((it,i)=>{
    const y=i*PITCH+2, tot=Object.values(it.mix).reduce((a,b)=>a+b,0);
    s+='<text x="'+(labW-9)+'" y="'+(y+BH/2+4)+'" text-anchor="end" font-size="11" font-weight="600" fill="#111222">'+esc(it.label)+'</text>';
    let x=labW;
    if(!tot){s+='<rect x="'+x+'" y="'+y+'" width="'+PW+'" height="'+BH+'" fill="#F3F2F0" stroke="#D8D6D1"/>';}
    SERIES.forEach(sr=>{
      const v=it.mix[sr[0]]||0; if(!v)return;
      const w=PW*v/tot;
      s+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+BH+'" fill="'+sr[1]+'" stroke="'+sr[2]+'" stroke-width=".7"/>';
      if(w>26) s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y+BH/2+4)+'" text-anchor="middle" font-size="9.5" font-weight="700" fill="'+sr[2]+'">'+Math.round(v/tot*100)+'%</text>';
      x+=w;
    });
    s+='<text x="'+(labW+PW+8)+'" y="'+(y+BH/2+4)+'" font-size="10" fill="#8A8894">'+tot+'</text>';
  });
  return s+'</svg>';
}
function legendStatus(){
  return '<div class="legend">'+SERIES.map(s=>
    '<div><i style="background:'+s[1]+';border-color:'+s[2]+'"></i>'+s[0]+'</div>').join('')+'</div>';
}

/* clustered column — §6.2 ·7, Stage 7 point recoloured */
function chartColumn(items){
  const W=700,H=190,L=34,B=42,PW=W-L-12,PH=H-B-16;
  const max=Math.max(1,...items.map(i=>i.v));
  const cw=PW/items.length, bw=cw*0.56;
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  for(let g=0;g<=2;g++){const y=16+PH-PH*g/2;
    s+='<line x1="'+L+'" y1="'+y+'" x2="'+(L+PW)+'" y2="'+y+'" stroke="#EDEBE6"/>'+
       '<text x="'+(L-6)+'" y="'+(y+3)+'" text-anchor="end" font-size="9" fill="#8A8894">'+Math.round(max*g/2)+'</text>';}
  items.forEach((it,i)=>{
    const h=PH*it.v/max, x=L+i*cw+(cw-bw)/2, y=16+PH-h;
    s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,h).toFixed(1)+'" fill="'+(it.hl?"#155930":"#0C7993")+'"/>'+
       '<text x="'+(x+bw/2).toFixed(1)+'" y="'+(y-5).toFixed(1)+'" text-anchor="middle" font-size="10" font-weight="700" fill="#111222">'+it.v+'</text>'+
       '<text x="'+(x+bw/2).toFixed(1)+'" y="'+(16+PH+13)+'" text-anchor="middle" font-size="9" fill="#3F3D4C">'+esc(it.label)+'</text>'+
       '<text x="'+(x+bw/2).toFixed(1)+'" y="'+(16+PH+25)+'" text-anchor="middle" font-size="8.5" fill="#A9A6B0">stage '+it.n+'</text>';
  });
  s+='<line x1="'+L+'" y1="'+(16+PH)+'" x2="'+(L+PW)+'" y2="'+(16+PH)+'" stroke="#3F3D4C"/>';
  return s+'</svg>';
}

/* clustered bar, baseline vs threshold — §6.5 ·7 */
function chartPair(items){
  const W=700,LW=182,PITCH=42,H=items.length*PITCH+14,PW=W-LW-58;
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  items.forEach((it,i)=>{
    const y=i*PITCH+6,bh=13,ov=2;
    s+='<text x="'+(LW-9)+'" y="'+(y+16)+'" text-anchor="end" font-size="10.5" font-weight="600" fill="#111222">'+esc(it.label)+'</text>';
    const w1=it.base==null?0:PW*Math.min(1,it.base), w2=it.thr==null?0:PW*Math.min(1,it.thr);
    s+='<rect x="'+LW+'" y="'+y+'" width="'+w1.toFixed(1)+'" height="'+bh+'" fill="#0C7993"/>';
    if(it.base==null) s+='<text x="'+(LW+4)+'" y="'+(y+10)+'" font-size="9" fill="#B10831" font-weight="700">no baseline</text>';
    else s+='<text x="'+(LW+w1+5).toFixed(1)+'" y="'+(y+10)+'" font-size="9" fill="#0C7993" font-weight="700">'+(it.base*100).toFixed(1)+'%</text>';
    s+='<rect x="'+LW+'" y="'+(y+bh+ov)+'" width="'+w2.toFixed(1)+'" height="'+bh+'" fill="#D8D6D1" stroke="#3F3D4C" stroke-width=".7"/>';
    if(it.thr==null) s+='<text x="'+(LW+4)+'" y="'+(y+bh+ov+10)+'" font-size="9" fill="#B10831" font-weight="700">TBC</text>';
    else s+='<text x="'+(LW+w2+5).toFixed(1)+'" y="'+(y+bh+ov+10)+'" font-size="9" fill="#3F3D4C" font-weight="700">'+(it.thr*100).toFixed(1)+'%</text>';
  });
  return s+'</svg>';
}

/* single-series bar, flag totals — §6.8 ·7 */
function chartFlags(items){
  const W=700,LW=176,PITCH=27,H=items.length*PITCH+8,PW=W-LW-56;
  const max=Math.max(1,...items.map(i=>i.v));
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  items.forEach((it,i)=>{
    const y=i*PITCH+4,bh=17,w=PW*it.v/max;
    s+='<text x="'+(LW-9)+'" y="'+(y+bh-4)+'" text-anchor="end" font-size="10.5" fill="#111222" font-weight="600">'+esc(it.label)+'</text>'+
       '<rect x="'+LW+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+bh+'" fill="#B10831"/>'+
       '<text x="'+(LW+w+7).toFixed(1)+'" y="'+(y+bh-4)+'" font-size="10.5" font-weight="700" fill="#B10831">'+it.v+'</text>';
  });
  return s+'</svg>';
}

/* ---------- toast ---------- */
let toastT=null;
function toast(html){
  const t=document.getElementById("toast");
  t.innerHTML=html; t.classList.add("on");
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("on"),4200);
}

/* ==================================================================
   SHEET REGISTRY + STANDARD PAGE FRAME (§1.1 §1.4 §3)
   ================================================================== */
const F = { zonal:"Kalbar", outcome:"(All)", status:[], ind:"OIOS 22", decStatus:"(All)", decOwner:"(All)" };

const SHEETS=[
 {id:"HOME",          tab:"HOME",         c:"#FF5515", title:"AIM+ AREA PROGRAMME TARGET SETTING — DECISION WORKBOOK",
  crumb:()=>"Home", rel:[], render:renderHome},
 {id:"00_MASTER",     tab:"00_MASTER",    c:"#0C7993", title:"MASTER SETUP", write:true,
  crumb:()=>"Home ▸ Master setup", rel:["HOME","06_DECISIONS","07_DATAQUALITY"], render:renderMaster},
 {id:"01_NATIONAL",   tab:"01_NATIONAL",  c:"#111222", title:"NATIONAL OVERVIEW",
  crumb:()=>"Home ▸ National Overview", rel:["02_ZONAL","07_DATAQUALITY"], render:renderNational},
 {id:"02_ZONAL",      tab:"02_ZONAL",     c:"#111222", title:"ZONAL REVIEW",
  crumb:()=>"Home ▸ National ▸ Zonal Review ▸ <b>"+esc(F.zonal)+"</b>", rel:["01_NATIONAL","03_AP","06_DECISIONS"], render:renderZonal},
 {id:"03_AP",         tab:"03_AP",        c:"#111222", title:"AREA PROGRAMME REVIEW",
  crumb:()=>"Home ▸ Zonal ▸ Area Programme Review ▸ <b>"+esc(CFG.Sel_AP)+"</b>", rel:["02_ZONAL","06_DECISIONS","05_INDICATOR"], render:renderAP},
 {id:"04_OUTCOME",    tab:"04_OUTCOME",   c:"#111222", title:"OUTCOME REVIEW",
  crumb:()=>"Home ▸ Outcome Review ▸ <b>"+esc(CFG.Sel_Outcome)+"</b>", rel:["05_INDICATOR","06_DECISIONS"], render:renderOutcome},
 {id:"05_INDICATOR",  tab:"05_INDICATOR", c:"#111222", title:"INDICATOR REVIEW",
  crumb:()=>"Home ▸ Indicator Review ▸ <b>"+esc(F.zonal)+"</b> ▸ <b>"+esc(CFG.Sel_AP)+"</b> ▸ <b>"+esc(F.ind)+"</b>", rel:["04_OUTCOME","06_DECISIONS","08_REFERENCE"], render:renderIndicator},
 {id:"06_DECISIONS",  tab:"06_DECISIONS", c:"#155930", title:"DECISION TRACKER", write:true,
  crumb:()=>"Home ▸ Decision Tracker", rel:["03_AP","02_ZONAL","07_DATAQUALITY"], render:renderDecisions},
 {id:"07_DATAQUALITY",tab:"07_DATAQUALITY",c:"#B10831", title:"DATA QUALITY",
  crumb:()=>"Home ▸ Data Quality", rel:["05_INDICATOR","06_DECISIONS"], render:renderDQ},
 {id:"08_REFERENCE",  tab:"08_REFERENCE", c:"#3F3D4C", title:"REFERENCE",
  crumb:()=>"Home ▸ Reference", rel:["HOME"], render:renderReference}
];
const HIDDEN=["DATA_Master","DATA_Ref","SETTINGS"];
let CUR="HOME";

function stageLine(){
  const n=(STAGES.find(s=>s.name===CFG.Stage)||STAGES[3]).n;
  return "Stage "+n+" of 7 · "+CFG.Stage+" · "+CFG.Version;
}
function buildFrames(){
  document.getElementById("sheets").innerHTML = SHEETS.map(sh=>
   '<section class="sheet" id="sh_'+sh.id+'">'+
    '<div class="hdr"><div class="hdr-top">'+
      (sh.id==="HOME"?'':'<a class="homelink" href="#" data-go="HOME">◀&nbsp; HOME</a>')+
      '<h1 class="title">'+esc(sh.title)+'</h1>'+
      (sh.write?'<span class="writeflag">✎ THIS SHEET ACCEPTS INPUT</span>':'')+
      '<div class="hdr-right"><div class="cycle">'+esc(CFG.Cycle)+'</div>'+
      '<div class="stagebar" data-stageline>'+stageLine()+'</div></div>'+
    '</div><div class="crumb" data-crumb></div></div>'+
    '<div class="rule4"></div>'+
    '<div class="pad" data-body></div>'+
    '<div class="ftr"><div class="ftr-l">'+esc(CFG.Footer)+' &nbsp;·&nbsp; Imported '+esc(CFG.ImportDate)+'</div>'+
    '<div class="ftr-r">'+(sh.rel.length?'<span>Related:</span>'+sh.rel.map(r=>
      '<a href="#" data-go="'+r+'">'+r.replace(/_/g," ")+'</a>').join(''):'')+'</div></div>'+
   '</section>').join('');

  document.getElementById("tabbar").innerHTML =
    SHEETS.map(sh=>'<button class="tab" data-tab="'+sh.id+'"><span class="dot" style="background:'+sh.c+'"></span>'+
      sh.tab.replace(/_/g,"&nbsp;")+'<span class="bdg'+(sh.id==="06_DECISIONS"?' g':'')+'" data-bdg="'+sh.id+'" hidden></span></button>').join('')
    + HIDDEN.map(h=>'<button class="tab locked" data-locked="'+h+'">🔒 '+h+'</button>').join('');
}
function go(id){
  if(!SHEETS.some(s=>s.id===id))return;
  CUR=id;
  SHEETS.forEach(s=>document.getElementById("sh_"+s.id).classList.toggle("on",s.id===id));
  document.querySelectorAll(".tab[data-tab]").forEach(b=>b.classList.toggle("on",b.dataset.tab===id));
  paint(id);
  window.scrollTo({top:0,behavior:"instant"});
}
function paint(id){
  const sh=SHEETS.find(s=>s.id===id); if(!sh)return;
  const el=document.getElementById("sh_"+id);
  el.querySelector("[data-crumb]").innerHTML=sh.crumb().replace(/▸/g,'<span class="sep">▸</span>');
  el.querySelector("[data-stageline]").textContent=stageLine();
  el.querySelector("[data-body]").innerHTML=sh.render();
  wire(id,el);
}
function paintAll(){
  SHEETS.forEach(s=>{ if(document.getElementById("sh_"+s.id).classList.contains("on")) paint(s.id); });
  badges();
}
function badges(){
  const crit=countIf(r=>r.Row_Status==="CRITICAL");
  const setB=(id,v,show)=>{const b=document.querySelector('[data-bdg="'+id+'"]');
    if(!b)return; b.textContent=v; b.hidden=!show;};
  setB("07_DATAQUALITY",crit,crit>0);
  setB("06_DECISIONS",S.dec.length,S.dec.length>0);
}
function card(lab,val,sub,cls){
  return '<div class="card '+(cls||"neutral")+'"><div class="lab">'+lab+'</div>'+
    '<div><div class="val">'+val+'</div><div class="sub">'+(sub||"&nbsp;")+'</div></div></div>';
}

/* ==================================================================
   HOME  (§6.1)
   ================================================================== */
function renderHome(){
  const n=S.master.length, mix=statusMix(S.master), gate=importGate(), pr=progress();
  const nAP=uniq(S.master.map(r=>r.AP)).length;
  const p=v=>n?Math.round(v/n*100)+"%":"0%";
  const nav=[
    ["00_MASTER","00","Master Setup","PEARL · DMEAL",true],
    ["01_NATIONAL","01","National Overview","National Office SLT"],
    ["02_ZONAL","02","Zonal Review","Zonal Manager"],
    ["03_AP","03","Area Programme Review","AP Manager · facilitator"],
    ["04_OUTCOME","04","Outcome Review","Sector / technical lead"],
    ["05_INDICATOR","05","Indicator Review","DMEAL · PEARL"],
    ["06_DECISIONS","06","Decision Tracker","Facilitator",true],
    ["07_DATAQUALITY","07","Data Quality","DMEAL"],
    ["08_REFERENCE","08","Reference","All users"]
  ];
  return '<div class="slabel">Workbook status</div>'+
  '<div class="cards">'+
    card("Area<br>programmes",nAP,"of "+AP_LIST.length+" on the register","neutral")+
    card("Indicator<br>rows",n0(n),"one row per AP × indicator","neutral")+
    card("Ready",mix.READY,p(mix.READY)+" of all rows","ready")+
    card("Needs<br>review",mix["NEEDS REVIEW"],p(mix["NEEDS REVIEW"])+" of all rows","review")+
    card("Critical<br>issue",mix.CRITICAL,p(mix.CRITICAL)+" of all rows","critical")+
  '</div>'+

  '<div class="progwrap"><div class="top"><span class="lab">Approval progress — rows at stage 7</span>'+
    '<span class="pct">'+(pr*100).toFixed(0)+'%</span></div>'+
    '<div class="sub" style="font-size:10px;color:#8A8894;margin:-4px 0 8px">'+
      countIf(r=>r.Stage===7)+' of '+inScope().length+' rows in scope · '+
      countIf(r=>r.Row_Status==="REFERENCE")+' rows are out of scope and are not counted</div>'+
    '<div class="track"><i style="width:'+(pr*100).toFixed(1)+'%"></i>'+
      '<span class="tgt" style="left:'+(CFG.ReadinessTarget*100)+'%"></span>'+
      '<span class="tgtlab" style="left:'+(CFG.ReadinessTarget*100)+'%">target '+(CFG.ReadinessTarget*100)+'%</span></div>'+
    '<div class="gates"><span>Last import: <b>'+esc(CFG.ImportDate)+'</b></span>'+
      '<span>Import check: <span class="pill '+(gate==="IMPORT OK"?"p-READY":"p-CRITICAL")+'">'+
        '<span class="ic">'+(gate==="IMPORT OK"?"●":"▲")+'</span>'+gate+'</span></span>'+
      '<span>Cycle owner: <b>'+esc(CFG.Owner)+'</b></span></div>'+
    (gate!=="IMPORT OK"?'<p class="tcap" style="color:var(--red);margin-top:14px">The import gate is doing its job: '+
      'this file is not cleared for distribution until it reads IMPORT OK. '+
      '<a href="#" data-go="07_DATAQUALITY">Open 07 Data Quality</a> to see which rows are blocking it.</p>':'')+
    '</div>'+

  '<div class="grid2" style="margin-top:26px">'+
    '<div><div class="slabel" style="margin-top:0">Where do I go?</div><div class="navlist">'+
      nav.map(x=>'<a class="nv" href="#" data-go="'+x[0]+'"><span class="no">'+x[1]+'</span>'+
        '<span class="nm">'+x[2]+(x[4]?'<span class="wr">✎ WRITE</span>':'')+'</span>'+
        '<span class="ro">'+x[3]+'</span></a>').join('')+'</div></div>'+
    '<div><div class="slabel" style="margin-top:0">How this workbook works</div>'+
      '<div class="legendbox">'+STAGES.map(s=>{
        const here=s.name===CFG.Stage, done=s.n<(STAGES.find(x=>x.name===CFG.Stage)||{n:4}).n;
        return '<div class="stagerow'+(here?' here':done?' done':'')+'"><div class="n">'+s.n+'</div>'+
          '<div><b>'+s.name+'</b> — '+esc(s.desc)+'<br><span class="dim">'+
          (s.n<=3?'imported from the AP submission':'recorded on sheet 06')+' · owner '+esc(s.owner)+'</span></div></div>';
      }).join('')+'</div>'+
      '<p class="tcap">Only sheet 06 accepts typing. Sheets 01–05, 07 and 08 read the same data model, so a decision logged once appears everywhere.</p></div>'+
  '</div>';
}

/* ==================================================================
   01_NATIONAL  (§6.2)
   ================================================================== */
function renderNational(){
  const n=S.master.length,mix=statusMix(S.master),pr=progress();
  const p=v=>n?Math.round(v/n*100)+"%":"0%";
  const zrows=ZONALS.map(z=>{
    const rows=byZ(z.z),m=statusMix(rows),s7=rows.filter(r=>r.Stage===7).length;
    return {z:z.z,aps:apsOf(z.z).length,n:rows.length,m:m,s7:s7,prog:rows.length?s7/rows.length:0};
  });
  const tot={aps:AP_LIST.length,n:n,m:mix,s7:countIf(r=>r.Stage===7),prog:pr};
  const stat=pr=>pr>=CFG.ReadinessTarget?"READY":pr>0?"NEEDS REVIEW":"CRITICAL";

  const noAppr=zrows.filter(r=>r.s7===0).length;
  const lo=zrows.reduce((a,b)=>b.prog<a.prog?b:a), hi=zrows.reduce((a,b)=>b.prog>a.prog?b:a);
  const fl=FLAGS.map(f=>({name:f[1],v:flagSum(f[0])})).sort((a,b)=>b.v-a.v)[0];
  const need=Math.max(0,Math.round(CFG.ReadinessTarget*inScope().length)-tot.s7);

  return '<div class="slabel">Target setting readiness</div>'+
  '<div class="cards">'+
    card("Total<br>APs",tot.aps,"4 zonal offices","neutral")+
    card("Indicator<br>rows",n0(n),uniq(S.master.map(r=>r.Code)).length+" indicators","neutral")+
    card("Ready",mix.READY,p(mix.READY),"ready")+
    card("Needs<br>review",mix["NEEDS REVIEW"],p(mix["NEEDS REVIEW"]),"review")+
    card("Monitor",mix.MONITOR,p(mix.MONITOR),"monitor")+
    card("Critical<br>issue",mix.CRITICAL,p(mix.CRITICAL),"critical")+
    card("Not<br>applicable",mix.REFERENCE,"outside AP scope","neutral")+
    card("Approval<br>progress",(pr*100).toFixed(0)+"%","of "+inScope().length+" in scope","accent")+
  '</div>'+

  '<div class="grid2" style="margin-top:24px">'+
    '<div><div class="slabel" style="margin-top:0">Readiness by zonal office</div>'+
      '<div class="chartbox">'+chartStacked(zrows.map(r=>({label:r.z,mix:r.m})),96)+legendStatus()+'</div></div>'+
    '<div><div class="slabel" style="margin-top:0">Readiness by outcome</div>'+
      '<div class="chartbox">'+chartStacked(OUTCOMES.map(o=>({label:o,mix:statusMix(S.master.filter(r=>r.Outcome===o))})),74)+legendStatus()+'</div></div>'+
  '</div>'+

  '<div class="slabel">Stage distribution <span class="hint">where the national submission sits in the process</span></div>'+
  '<div class="chartbox">'+chartColumn(STAGES.map(s=>({label:s.name,n:s.n,v:countIf(r=>r.Stage===s.n),hl:s.n===7})))+'</div>'+

  '<div class="slabel">Approval progress by zonal <span class="hint">click a zonal name to open sheet 02</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr>'+
    '<th>Zonal</th><th class="r">APs</th><th class="r">Rows</th><th class="r">Ready</th><th class="r">Review</th>'+
    '<th class="r">Monitor</th><th class="r">Critical</th><th class="r">Stage 7</th><th>Progress</th><th>Status</th>'+
  '</tr></thead><tbody>'+
    zrows.map(r=>'<tr><td><a href="#" data-go="02_ZONAL" data-zonal="'+esc(r.z)+'"><b>'+esc(r.z)+'</b></a></td>'+
      '<td class="r">'+r.aps+'</td><td class="r">'+r.n+'</td>'+
      '<td class="r'+(r.m.READY===0?" zero":"")+'">'+r.m.READY+'</td>'+
      '<td class="r">'+r.m["NEEDS REVIEW"]+'</td><td class="r">'+r.m.MONITOR+'</td>'+
      '<td class="r'+(r.m.CRITICAL>0?" crit":"")+'">'+r.m.CRITICAL+'</td>'+
      '<td class="r">'+r.s7+'</td><td>'+bar(r.prog)+'</td><td>'+pill(stat(r.prog))+'</td></tr>').join('')+
  '</tbody><tfoot><tr><td>NATIONAL</td><td class="r">'+tot.aps+'</td><td class="r">'+tot.n+'</td>'+
    '<td class="r">'+mix.READY+'</td><td class="r">'+mix["NEEDS REVIEW"]+'</td><td class="r">'+mix.MONITOR+'</td>'+
    '<td class="r" style="color:var(--red)">'+mix.CRITICAL+'</td><td class="r">'+tot.s7+'</td>'+
    '<td>'+bar(tot.prog)+'</td><td>'+pill(stat(tot.prog))+'</td></tr></tfoot></table></div>'+

  '<div class="slabel">National insights <span class="hint">formula-driven — never stale</span></div>'+
  '<div class="insights">'+
    '<p><span class="mk">▸</span><span><b>'+noAppr+' of 4</b> zonal offices have no rows at Approval stage.</span></p>'+
    '<p><span class="mk">▸</span><span><b>'+esc(lo.z)+'</b> has the lowest readiness at <span class="bad">'+(lo.prog*100).toFixed(0)+
      '%</span>. <b>'+esc(hi.z)+'</b> has the highest at <b>'+(hi.prog*100).toFixed(0)+'%</b>.</span></p>'+
    '<p><span class="mk">▸</span><span>Largest single blocker: <b>'+esc(fl.name.toLowerCase())+'</b> ('+n0(fl.v)+' rows).</span></p>'+
    '<p><span class="mk">▸</span><span>'+(CFG.ReadinessTarget*100)+'% readiness target requires <b>'+n0(need)+
      '</b> further rows to reach Approval.</span></p>'+
  '</div>'+
  '<p class="tcap">No slicers on this sheet by design (§Appendix B): the national view is deliberately unfilterable, so a screenshot of it is always the whole country.</p>';
}

/* ==================================================================
   02_ZONAL  (§6.3)
   ================================================================== */
function slicer(name,field,items,sel,multi){
  return '<div class="slicer" data-slicer="'+field+'"><div class="sh"><span>'+name+'</span>'+
    (multi?'<button data-clear="'+field+'" title="Clear filter">⌧</button>':'')+'</div><div class="items">'+
    items.map(it=>{
      const on=multi?sel.indexOf(it.v)>=0:sel===it.v;
      return '<button data-slice="'+field+'" data-val="'+esc(it.v)+'"'+
        ' class="'+(on?"sel":"")+(it.n===0?" nodata":"")+'">'+esc(it.v)+(it.n!==undefined?' <span class="dim">'+it.n+'</span>':'')+'</button>';
    }).join('')+'</div></div>';
}
function zonalRows(){
  let rows=byZ(F.zonal);
  if(F.outcome!=="(All)") rows=rows.filter(r=>r.Outcome===F.outcome);
  if(F.status.length) rows=rows.filter(r=>F.status.indexOf(r.Row_Status)>=0);
  return rows;
}
function renderZonal(){
  const all=byZ(F.zonal), rows=zonalRows(), mix=statusMix(rows);
  const aps=apsOf(F.zonal);
  const s7=rows.filter(r=>r.Stage===7).length;
  const apRows=aps.map(ap=>{
    let rs=rows.filter(r=>r.AP===ap); const m=statusMix(rs);
    const a7=rs.filter(r=>r.Stage===7).length;
    return {ap:ap,n:rs.length,m:m,s7:a7,prog:rs.length?a7/rs.length:0};
  });
  /* indicators needing support — top 10 critical, descending */
  const crit={};
  rows.filter(r=>r.Row_Status==="CRITICAL").forEach(r=>{crit[r.Code]=(crit[r.Code]||0)+1;});
  const support=Object.keys(crit).map(c=>({c:c,v:crit[c]})).sort((a,b)=>b.v-a.v).slice(0,10);
  /* discussion & approval status */
  const dstat=STATUS_LIST;
  /* action list from tblDecision */
  const act=S.dec.filter(d=>d.Zonal===F.zonal&&d.Status!=="Approved")
    .sort((a,b)=>String(a.Due_Date).localeCompare(String(b.Due_Date))).slice(0,14);

  return '<div class="fband"><div class="frow">'+
      '<div class="fcell"><label>Report filter · Zonal</label><select data-rf="zonal">'+
        ZONALS.map(z=>'<option'+(z.z===F.zonal?" selected":"")+'>'+z.z+'</option>').join('')+'</select></div>'+
      '<div class="fcell"><label>Report filter · Outcome</label><select data-rf="outcome">'+
        ["(All)"].concat(OUTCOMES).map(o=>'<option'+(o===F.outcome?" selected":"")+'>'+o+'</option>').join('')+'</select></div>'+
      slicer("Slicer · Zonal","zonal",ZONALS.map(z=>({v:z.z,n:byZ(z.z).length})),F.zonal,false)+
      slicer("Slicer · Row status","status",STATUS.map(s=>({v:s.s,n:all.filter(r=>r.Row_Status===s.s).length})),F.status,true)+
    '</div><div class="fnote">The report-filter cells and the slicers drive the same pivot fields, so they always agree — and the breadcrumb reads the filter cell (§3.3).</div></div>'+

  '<div class="slabel">Zonal summary — '+esc(F.zonal)+(F.outcome!=="(All)"?' · '+esc(F.outcome):'')+
    (F.status.length?' <span class="hint">status filter active: '+esc(F.status.join(", "))+'</span>':'')+'</div>'+
  '<div class="cards">'+
    card("Area<br>programmes",aps.length,"in this zonal","neutral")+
    card("Rows",rows.length,(rows.length!==all.length?"of "+all.length+" unfiltered":"all rows"),"neutral")+
    card("Ready",mix.READY,"","ready")+
    card("Needs<br>review",mix["NEEDS REVIEW"],"","review")+
    card("Critical",mix.CRITICAL,"","critical")+
    card("At<br>approval",(rows.length?Math.round(s7/rows.length*100):0)+"%",s7+" rows at stage 7","accent")+
  '</div>'+

  '<div class="grid2u" style="margin-top:24px">'+
   '<div><div class="slabel" style="margin-top:0">AP readiness <span class="hint">pvtZonAP</span></div>'+
    '<div class="tscroll"><table class="gt"><thead><tr><th>Area programme</th><th class="r">Rows</th>'+
      '<th class="r">Ready</th><th class="r">Rev</th><th class="r">Mon</th><th class="r">Crit</th>'+
      '<th>Progress</th><th></th></tr></thead><tbody>'+
      apRows.map(r=>'<tr'+(r.ap===CFG.Sel_AP?' class="hl"':'')+'><td><b>'+esc(r.ap)+'</b></td><td class="r">'+r.n+'</td>'+
        '<td class="r'+(r.m.READY===0?" zero":"")+'">'+r.m.READY+'</td><td class="r">'+r.m["NEEDS REVIEW"]+'</td>'+
        '<td class="r">'+r.m.MONITOR+'</td><td class="r'+(r.m.CRITICAL>0?" crit":"")+'">'+r.m.CRITICAL+'</td>'+
        '<td>'+bar(r.prog)+'</td><td><a href="#" data-openap="'+esc(r.ap)+'">open →</a></td></tr>').join('')+
      '</tbody></table></div>'+
    '<div class="slabel">Discussion &amp; approval status <span class="hint">pvtZonStage · count of rows by latest decision status</span></div>'+
    '<div class="tscroll"><table class="gt"><thead><tr><th>Area programme</th>'+
      dstat.map(s=>'<th class="r">'+s.replace(" Requested","<br>Req.")+'</th>').join('')+'</tr></thead><tbody>'+
      aps.map(ap=>{
        const rs=rows.filter(r=>r.AP===ap);
        return '<tr><td><b>'+esc(ap)+'</b></td>'+dstat.map(s=>{
          const v=rs.filter(r=>(r.Dec_Status||"Not started")===s).length;
          return '<td class="r'+(v===0?' dim':'')+'">'+v+'</td>';}).join('')+'</tr>';
      }).join('')+'</tbody></table></div></div>'+

   '<div><div class="slabel" style="margin-top:0">Indicators needing support <span class="hint">top 10 critical</span></div>'+
    '<div class="tscroll"><table class="gt"><thead><tr><th>Code</th><th>Indicator</th><th class="r">Crit</th></tr></thead><tbody>'+
      (support.length?support.map(s=>'<tr><td class="code">'+esc(s.c)+'</td><td>'+esc(IND[s.c]?IND[s.c].short:"")+
        '</td><td class="r crit">'+s.v+'</td></tr>').join('')
        :'<tr><td colspan="3" class="dim">No critical rows under the current filter. Nothing to escalate.</td></tr>')+
      '</tbody></table></div>'+
    '<div class="slabel">Action list <span class="hint">open items, earliest due first</span></div>'+
    '<div class="tscroll"><table class="gt"><thead><tr><th>AP</th><th>Code</th><th>Decision</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>'+
      (act.length?act.map(d=>{
        const late=d.Due_Date<TODAY, soon=!late&&d.Due_Date<=addDays(TODAY,7);
        return '<tr><td>'+esc(d.AP)+'</td><td class="code">'+esc(d.Code)+'</td><td>'+esc(d.Decision)+'</td>'+
        '<td>'+esc(d.Owner)+'</td><td class="nowrap'+(late?' miss':'')+'" style="text-align:left'+(soon?';background:var(--f-review)':'')+'">'+
        dmy(d.Due_Date)+(late?' <b>overdue</b>':'')+'</td><td>'+esc(d.Status)+'</td></tr>';}).join('')
        :'<tr><td colspan="6" class="dim">No open items logged for this zonal yet. Log the first one on sheet 06.</td></tr>')+
      '</tbody></table></div>'+
    '<p class="tcap">Overdue is shaded '+'<span style="background:var(--f-critical);color:var(--red);padding:1px 4px">red</span>'+
      ', due within 7 days <span style="background:var(--f-review);color:var(--amber);padding:1px 4px">amber</span> (§6.3 ·10).</p></div>'+
  '</div>';
}
function addDays(iso,n){const d=new Date(iso);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}

/* ==================================================================
   03_AP  (§6.4) — the workshop handout. Fixed 30-row dossier.
   ================================================================== */
function renderAP(){
  const ap=CFG.Sel_AP, rows=byAP(ap), meta=AP_LIST.find(a=>a.ap===ap)||{};
  const mix=statusMix(rows);
  const missBase=rows.filter(r=>r.Chk_Baseline).length;
  const missThr=rows.filter(r=>r.Chk_Threshold).length;
  const s7=rows.filter(r=>r.Stage===7).length;
  const DOSSIER=30;
  let body="";
  for(let i=0;i<DOSSIER;i++){
    const r=rows[i];
    if(!r){body+='<tr class="blankrow"><td>'+(i+1)+'</td><td colspan="10"></td></tr>';continue;}
    body+='<tr><td class="dim">'+(i+1)+'</td><td class="code">'+esc(r.Code)+'</td>'+
      '<td>'+esc(r.Indicator_Short)+'</td><td class="c dim">'+(r.Outcome?esc(r.Outcome):"—")+'</td>'+
      '<td class="'+(r.Chk_Baseline?"miss":"r")+'">'+pct(r.Pct_Base)+'</td>'+
      '<td class="'+(r.Chk_Threshold?"miss":"r")+'">'+(r.Chk_Threshold?"TBC":pct(r.Threshold))+'</td>'+
      '<td class="r">'+pct(r.Pct_LOP)+'</td><td class="r">'+sign(r.AP_Proposal)+'</td>'+
      '<td>'+pill(r.Row_Status)+'</td><td>'+(r.Dec_Decision?esc(r.Dec_Decision):'<span class="dim">—</span>')+'</td>'+
      '<td><a href="#" data-openind="'+esc(r.Code)+'" title="Open in 05_INDICATOR">◧</a></td></tr>';
  }
  const comments=S.dec.filter(d=>d.AP===ap).sort((a,b)=>String(b.Timestamp).localeCompare(String(a.Timestamp))).slice(0,10);

  return '<div class="fband"><div class="frow">'+
      '<div class="fcell"><label>Area programme <span class="dim">— the only unlocked cell outside sheet 06</span></label>'+
      '<select data-rf="ap" style="min-width:230px">'+
        ZONALS.map(z=>'<optgroup label="'+z.z+'">'+z.aps.map(a=>
          '<option'+(a[0]===ap?" selected":"")+'>'+a[0]+'</option>').join('')+'</optgroup>').join('')+'</select></div>'+
      '<div class="fcell"><label>AP ID</label><div class="keyprev" style="padding:6px 9px">'+esc(meta.id||"—")+'</div></div>'+
      '<div class="fcell"><label>Zonal</label><div class="keyprev" style="padding:6px 9px">'+esc(meta.z||"—")+'</div></div>'+
      '<div class="fcell"><label>Strategic status</label><div class="keyprev" style="padding:6px 9px">'+esc(meta.strategic||"—")+'</div></div>'+
      '<div class="fcell"><label>Rows expected · imported</label><div class="keyprev" style="padding:6px 9px">'+
        (meta.expected||"—")+' · '+rows.length+'</div></div>'+
    '</div></div>'+

  '<div class="ocscope"><span class="lbl">Outcomes in scope</span>'+
    OUTCOMES.map(o=>{
      const on=apOutcomes(ap).indexOf(o)>=0, k=rows.filter(r=>r.Outcome===o).length;
      return '<span class="ocpill '+(on?"on":"off")+'" title="'+k+' rows">'+(on?"●":"○")+' '+o+
        ' <b>'+k+'</b></span>';}).join('')+
    '<a href="#" data-go="00_MASTER" class="chg">change the outcome map →</a></div>'+
  '<div class="cards" style="margin-top:16px">'+
    card("Rows",rows.length,"indicators in this AP","neutral")+
    card("Ready",mix.READY,"","ready")+
    card("Needs<br>review",mix["NEEDS REVIEW"],"","review")+
    card("Monitor",mix.MONITOR,"","monitor")+
    card("Critical<br>issue",mix.CRITICAL,"","critical")+
    card("Missing<br>baseline",missBase,missThr+" missing threshold","teal")+
  '</div>'+

  '<div class="slabel">Indicator dossier — '+esc(ap)+
    ' <span class="hint">fixed 30-row block, so the printed handout is always one page and the same shape</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>#</th><th>Code</th><th>Indicator</th><th class="c">OC</th>'+
    '<th class="r">Baseline</th><th class="r">Threshold</th><th class="r">Target LOP</th><th class="r">Proposal</th>'+
    '<th>Status</th><th>Latest decision</th><th></th></tr></thead><tbody>'+body+'</tbody></table></div>'+

  '<div class="slabel">What needs attention in this AP</div>'+
  '<div class="insights">'+
    '<p><span class="mk">▸</span><span><b>'+mix.CRITICAL+'</b> indicator'+(mix.CRITICAL===1?"":"s")+
      ' cannot be discussed until the data is corrected.</span></p>'+
    '<p><span class="mk">▸</span><span><b>'+missBase+'</b> have no baseline. <b>'+missThr+'</b> have no threshold on record.</span></p>'+
    '<p><span class="mk">▸</span><span><b>'+mix.MONITOR+'</b> are flagged <i>Monitor Indicator</i> by the AP submission — no target is set this cycle.</span></p>'+
    '<p><span class="mk">▸</span><span><b>'+s7+' of '+rows.length+'</b> indicators are at Approval stage'+
      (rows.length?' ('+Math.round(s7/rows.length*100)+'%)':'')+'.</span></p>'+
  '</div>'+

  '<div class="slabel">Review comments on record <span class="hint">latest first · read-only, written on sheet 06</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Code</th><th>Rev</th><th>Reviewer</th><th>Logged</th>'+
    '<th>Decision</th><th>Reason</th><th>Comment</th></tr></thead><tbody>'+
    (comments.length?comments.map(d=>'<tr><td class="code">'+esc(d.Code)+'</td><td class="c">'+d.Revision+'</td>'+
      '<td>'+esc(d.Reviewer)+'</td><td class="nowrap">'+dmy(d.Timestamp)+'</td><td>'+esc(d.Decision)+'</td>'+
      '<td>'+esc(d.Reason)+'</td><td>'+(d.Comment?esc(d.Comment):'<span class="dim">—</span>')+'</td></tr>').join('')
      :'<tr><td colspan="7" class="dim">Nothing logged for this AP yet. Open sheet 06 and record the first decision — it will appear here immediately.</td></tr>')+
    '</tbody></table></div>'+
  '<p class="tcap">Closing loop: read the Status column, switch to <a href="#" data-go="06_DECISIONS">06 Decision Tracker</a>, log the decision, come back. The row updates without a refresh.</p>';
}

/* ==================================================================
   04_OUTCOME  (§6.5)
   ================================================================== */
function median(a){if(!a.length)return null;const b=a.slice().sort((x,y)=>x-y),m=b.length>>1;
  return b.length%2?b[m]:(b[m-1]+b[m])/2;}
function renderOutcome(){
  const oc=CFG.Sel_Outcome;
  let rows=S.master.filter(r=>r.Outcome===oc);
  if(F.zonal!=="(All)"&&F.ocZonalOn) rows=rows.filter(r=>r.Zonal===F.zonal);
  if(F.status.length) rows=rows.filter(r=>F.status.indexOf(r.Row_Status)>=0);
  const codes=uniq(rows.map(r=>r.Code)).sort();
  const mix=statusMix(rows);

  const summary=codes.map(c=>{
    const rs=rows.filter(r=>r.Code===c), m=statusMix(rs);
    const base=median(rs.map(r=>r.Pct_Base).filter(v=>!isBlank(v)).map(Number));
    const thrs=rs.map(r=>r.Threshold).filter(v=>!isBlank(v)).map(Number);
    const rec = m.CRITICAL>0?"Correct data" : m["NEEDS REVIEW"]>0?"Discuss" : "Ready to approve";
    return {c:c,short:IND[c]?IND[c].short:c,aps:uniq(rs.map(r=>r.AP)).length,base:base,
      thr:thrs.length?Math.max.apply(null,thrs):null,m:m,rec:rec,n:rs.length};
  });
  const recCls={"Correct data":'style="background:var(--f-critical);color:var(--red);font-weight:700"',
    "Discuss":'style="background:var(--f-review);color:var(--amber);font-weight:700"',
    "Ready to approve":'style="background:var(--f-ready);color:var(--green);font-weight:700"'};
  const detail=rows.slice().sort((a,b)=>a.AP.localeCompare(b.AP)||a.Code.localeCompare(b.Code)).slice(0,120);

  return '<div class="fband"><div class="frow">'+
      '<div class="fcell"><label>Report filter · Outcome <span class="dim">— select multiple is off, so the breadcrumb can never read (Multiple Items)</span></label>'+
      '<select data-rf="oc" style="min-width:260px">'+OUTCOMES.map(o=>'<option value="'+o+'"'+(o===oc?" selected":"")+'>'+
        esc(OUTCOME_LABEL[o])+'</option>').join('')+'</select></div>'+
      slicer("Slicer · Zonal","oczonal",[{v:"(All)",n:S.master.filter(r=>r.Outcome===oc).length}]
        .concat(ZONALS.map(z=>({v:z.z,n:S.master.filter(r=>r.Outcome===oc&&r.Zonal===z.z).length}))),
        F.ocZonalOn?F.zonal:"(All)",false)+
      slicer("Slicer · Row status","status",STATUS.map(s=>({v:s.s,
        n:S.master.filter(r=>r.Outcome===oc&&r.Row_Status===s.s).length})),F.status,true)+
    '</div></div>'+

  '<div class="cards" style="margin-top:16px">'+
    card("Indicators",codes.length,"in this outcome","neutral")+
    card("AP rows",rows.length,"across "+uniq(rows.map(r=>r.AP)).length+" APs","neutral")+
    card("Ready",mix.READY,"","ready")+
    card("Needs<br>review",mix["NEEDS REVIEW"],"","review")+
    card("Monitor",mix.MONITOR,"","monitor")+
    card("Critical",mix.CRITICAL,"","critical")+
  '</div>'+

  '<div class="slabel">Indicator summary for this outcome <span class="hint">pvtOutInd · Recommend is a worksheet formula beside the pivot</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Code</th><th>Indicator</th><th class="r">APs</th>'+
    '<th class="r">Base (med)</th><th class="r">Threshold</th><th class="r">Ready</th><th class="r">Rev</th>'+
    '<th class="r">Mon</th><th class="r">Crit</th><th>Recommend</th></tr></thead><tbody>'+
    (summary.length?summary.map(s=>'<tr><td class="code">'+esc(s.c)+'</td><td>'+esc(s.short)+'</td>'+
      '<td class="r">'+s.aps+'</td>'+
      '<td class="'+(s.base==null?"miss":"r")+'">'+pct(s.base)+'</td>'+
      '<td class="'+(s.thr==null?"miss":"r")+'">'+(s.thr==null?"TBC":pct(s.thr))+'</td>'+
      '<td class="r'+(s.m.READY===0?" zero":"")+'">'+s.m.READY+'</td><td class="r">'+s.m["NEEDS REVIEW"]+'</td>'+
      '<td class="r">'+s.m.MONITOR+'</td><td class="r'+(s.m.CRITICAL>0?" crit":"")+'">'+s.m.CRITICAL+'</td>'+
      '<td '+recCls[s.rec]+'>'+s.rec+'</td></tr>').join('')
      :'<tr><td colspan="10" class="dim">No rows match the current slicers. Clear the status slicer to see the whole outcome.</td></tr>')+
    '</tbody></table></div>'+
  '<p class="tcap">Median needs the Data Model in Excel; where it is unavailable the column becomes <b>Base (avg)</b> and the label changes with it — never silently (§6.5 ·6).</p>'+

  '<div class="slabel">Baseline against threshold, by indicator <span class="hint">the mandated Baseline → Threshold → Target sequence</span></div>'+
  '<div class="chartbox">'+chartPair(summary.map(s=>({label:s.short,base:s.base,thr:s.thr})))+
    '<div class="legend"><div><i style="background:#0C7993;border-color:#0C7993"></i>Baseline (median across APs)</div>'+
    '<div><i style="background:#D8D6D1;border-color:#3F3D4C"></i>Threshold</div>'+
    '<div><i style="background:#FDE7EB;border-color:#B10831"></i>No value on record</div></div></div>'+

  '<div class="slabel">AP detail for the selected outcome <span class="hint">pvtOutAP'+
    (rows.length>120?' · first 120 of '+rows.length+' rows':'')+'</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Area programme</th><th>Code</th><th class="r">Baseline</th>'+
    '<th class="r">Threshold</th><th class="r">Target LOP</th><th>Status</th><th>Decision</th><th>Reviewer</th></tr></thead><tbody>'+
    detail.map(r=>'<tr><td>'+esc(r.AP)+'</td><td class="code">'+esc(r.Code)+'</td>'+
      '<td class="'+(r.Chk_Baseline?"miss":"r")+'">'+pct(r.Pct_Base)+'</td>'+
      '<td class="'+(r.Chk_Threshold?"miss":"r")+'">'+(r.Chk_Threshold?"TBC":pct(r.Threshold))+'</td>'+
      '<td class="r">'+pct(r.Pct_LOP)+'</td><td>'+pill(r.Row_Status)+'</td>'+
      '<td>'+(r.Dec_Decision?esc(r.Dec_Decision):'<span class="dim">—</span>')+'</td>'+
      '<td>'+(r.Dec_Reviewer?esc(r.Dec_Reviewer):'<span class="dim">—</span>')+'</td></tr>').join('')+
    '</tbody></table></div>';
}

/* ==================================================================
   05_INDICATOR  (§6.6) — forensic view, one row at a time
   ================================================================== */
function renderIndicator(){
  const zn=F.zonal, ap=CFG.Sel_AP, code=F.ind;
  const apOptions=apsOf(zn);
  if(apOptions.indexOf(ap)<0) CFG.Sel_AP=apOptions[0];
  const row=S.master.find(r=>r.Zonal===zn&&r.AP===CFG.Sel_AP&&r.Code===code);
  const meta=IND[code]||{};
  const codesHere=uniq(byAP(CFG.Sel_AP).map(r=>r.Code));
  const allCodes=INDICATORS.map(i=>i.code);

  const filters='<div class="fband"><div class="frow">'+
    '<div class="fcell"><label>Zonal</label><select data-rf="zonal">'+
      ZONALS.map(z=>'<option'+(z.z===zn?" selected":"")+'>'+z.z+'</option>').join('')+'</select></div>'+
    '<div class="fcell"><label>Area programme</label><select data-rf="ap">'+
      apOptions.map(a=>'<option'+(a===CFG.Sel_AP?" selected":"")+'>'+a+'</option>').join('')+'</select></div>'+
    '<div class="fcell"><label>Outcome <span class="dim">— follows the indicator</span></label>'+
      '<div class="keyprev" style="padding:6px 9px;min-width:150px">'+esc(meta.oc||"—")+' · '+esc(OUTCOME_LABEL[meta.oc]||"")+'</div></div>'+
    '<div class="fcell"><label>Indicator</label><select data-rf="ind" style="min-width:290px">'+
      allCodes.map(c=>'<option value="'+c+'"'+(c===code?" selected":"")+(codesHere.indexOf(c)<0?' data-nd="1"':'')+'>'+
        c+' — '+esc(IND[c].short)+(codesHere.indexOf(c)<0?"  (not in this AP)":"")+'</option>').join('')+'</select></div>'+
    '</div><div class="fnote">Five filters means users will reach empty states. When no single row matches, the panel is replaced by guidance rather than blanks (§6.6 ·15).</div></div>';

  if(!row) return filters+'<div class="slabel">Measurement</div>'+
    '<div class="guard">No single row matches the current filters. '+esc(code)+' is not part of '+esc(CFG.Sel_AP)+
    '\u2019s submission. Choose another indicator, or another AP.</div>';

  const chk=[["Baseline present",!row.Chk_Baseline],["Denominator &gt; 0",!row.Chk_Denominator],
    ["Threshold present",!row.Chk_Threshold],["Proposal recorded",!row.Chk_Proposal],
    ["Range 0–100%",!row.Chk_Range],["Unique key",!row.Chk_Duplicate]];
  const others=S.master.filter(r=>r.Code===code).sort((a,b)=>a.Zonal.localeCompare(b.Zonal)||a.AP.localeCompare(b.AP));
  const kv=(k,v,cls)=>'<div class="k">'+k+'</div><div class="v '+(cls||"")+'">'+v+'</div>';

  return filters+
  '<div class="grid2" style="margin-top:20px">'+
   '<div class="panel"><h4>Measurement — as submitted</h4><div class="kv">'+
     kv("Numerator (baseline)",n0(row.Num_Base),row.Chk_Baseline?"na":"")+
     kv("Denominator (baseline)",n0(row.Den_Base),row.Chk_Denominator?"na":"")+
     kv("Baseline",pct(row.Pct_Base),(row.Chk_Baseline||row.Chk_Range?"na ":"")+"em")+
     kv("Numerator (LOP)",n0(row.Num_LOP))+
     kv("Denominator (LOP)",n0(row.Den_LOP))+
     kv("Target (LOP)",pct(row.Pct_LOP),"em")+
     kv("AP proposal (delta)",sign(row.AP_Proposal))+
     kv("Threshold",row.Chk_Threshold?"TBC":pct(row.Threshold),row.Chk_Threshold?"na":"")+
     kv("AP vs threshold",esc(row.AP_vs_Threshold))+
     kv("Direction",(meta.dir===-1?"Reduction — lower is better":"Increase — higher is better"))+
     kv("Row status",pill(row.Row_Status))+
   '</div></div>'+
   '<div class="panel"><h4>Decision record — latest revision</h4><div class="kv">'+
     kv("Latest decision",row.Dec_Decision?esc(row.Dec_Decision):'<span class="dim">not yet discussed</span>')+
     kv("Reason",row.Dec_Reason?esc(row.Dec_Reason):"—")+
     kv("Reviewer",row.Dec_Reviewer?esc(row.Dec_Reviewer):"—")+
     kv("Owner",row.Dec_Owner?esc(row.Dec_Owner):"—")+
     kv("Due date",row.Dec_Due?dmy(row.Dec_Due):"—",row.Dec_Due&&row.Dec_Due<TODAY&&row.Dec_Status!=="Approved"?"na":"")+
     kv("Status",row.Dec_Status?esc(row.Dec_Status):"Not started")+
     kv("Revision number",row.Latest_Rev||0)+
     kv("Approval date",row.Dec_Approved?dmy(row.Dec_Approved):"—")+
     kv("Stage",row.Stage+" of 7 · "+row.Stage_Name)+
     kv("Row_ID",'<span class="keyprev">'+esc(row.Row_ID)+'</span>')+
     kv("Comment",row.Dec_Comment?esc(row.Dec_Comment):'<span class="dim">—</span>')+
   '</div></div>'+
  '</div>'+

  '<div class="slabel">Data checks on this row</div><div class="checks">'+
    chk.map(c=>'<div class="chk '+(c[1]?"ok":"no")+'"><span class="ic">'+(c[1]?"●":"▲")+'</span>'+c[0]+'</div>').join('')+
  '</div>'+

  '<div class="slabel">Supporting notes <span class="hint">tblIndicator · tblThreshold</span></div>'+
  '<div class="notes"><dl style="margin:0">'+
    '<dt>Indicator, in full</dt><dd>'+esc(meta.ind||"Not on record")+'</dd>'+
    '<dt>Numerator</dt><dd'+(meta.numdef?'':' class="unset"')+'>'+esc(meta.numdef||"Not on record")+'</dd>'+
    '<dt>Denominator</dt><dd'+(meta.dendef?'':' class="unset"')+'>'+esc(meta.dendef||"Not on record")+'</dd>'+
    '<dt>Source</dt><dd>'+esc(meta.src||"Not on record")+'</dd>'+
    '<dt>Threshold source</dt><dd'+(meta.thrsrc?'':' class="unset"')+'>'+esc(meta.thrsrc||"Not on record")+
      (meta.thr==null?' <span style="color:var(--red)">· no value in the threshold register (TBC)</span>':' · register value '+pct(meta.thr))+'</dd>'+
  '</dl><p class="tcap" style="margin-top:12px">A blank is never left where a definition is absent — <b>Not on record</b> is written instead, so a reviewer can tell an empty cell from an undocumented indicator (§6.6 ·12).</p></div>'+

  '<div class="slabel">All AP values for this indicator <span class="hint">pvtIndAll · the AP under discussion carries an orange edge</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Area programme</th><th>Zonal</th><th class="r">Num</th>'+
    '<th class="r">Den</th><th class="r">Baseline</th><th class="r">Threshold</th><th class="r">Target</th>'+
    '<th>Status</th><th>Decision</th></tr></thead><tbody>'+
    others.map(r=>'<tr'+(r.AP===CFG.Sel_AP&&r.Zonal===zn?' class="apmark hl"':'')+'><td><b>'+esc(r.AP)+'</b></td>'+
      '<td class="dim">'+esc(r.Zonal)+'</td><td class="r">'+n0(r.Num_Base)+'</td>'+
      '<td class="'+(r.Chk_Denominator?"miss":"r")+'">'+n0(r.Den_Base)+'</td>'+
      '<td class="'+(r.Chk_Baseline?"miss":"r")+'">'+pct(r.Pct_Base)+'</td>'+
      '<td class="'+(r.Chk_Threshold?"miss":"r")+'">'+(r.Chk_Threshold?"TBC":pct(r.Threshold))+'</td>'+
      '<td class="r">'+pct(r.Pct_LOP)+'</td><td>'+pill(r.Row_Status)+'</td>'+
      '<td>'+(r.Dec_Decision?esc(r.Dec_Decision):'<span class="dim">—</span>')+'</td></tr>').join('')+
    '</tbody></table></div>';
}

/* ==================================================================
   06_DECISIONS  (§6.7) — the only writable surface
   ================================================================== */
const DRAFT={Zonal:"",AP:"",Code:"",Decision:"",Reason:"",Comment:"",
  Reviewer:"",Owner:"",Due_Date:addDays(TODAY,10),Status:"Discussed",Approval_Date:""};
let VERR={};

function decFiltered(){
  return S.dec.filter(d=>
    (F.decZonal==="(All)"||!F.decZonal||d.Zonal===F.decZonal) &&
    (F.decStatus==="(All)"||d.Status===F.decStatus) &&
    (F.decOwner==="(All)"||d.Owner===F.decOwner));
}
function renderDecisions(){
  const total=S.dec.length;
  const open=S.dec.filter(d=>d.Status!=="Approved").length;
  const overdue=S.dec.filter(d=>d.Status!=="Approved"&&d.Due_Date&&d.Due_Date<TODAY).length;
  const appr=S.dec.filter(d=>d.Status==="Approved").length;
  const withDec={}; S.dec.forEach(d=>withDec[d.Row_ID]=1);
  const noDec=S.master.filter(r=>!withDec[r.Row_ID]).length;

  const reqComment=(DECISION_LIST.find(d=>d.d===DRAFT.Decision)||{}).req==="Yes";
  const apOpts=apsOf(DRAFT.Zonal);
  const codeOpts=DRAFT.AP?uniq(byAP(DRAFT.AP).map(r=>r.Code)).sort():[];
  const rid=(DRAFT.Zonal&&DRAFT.AP&&DRAFT.Code)?DRAFT.Zonal+"|"+DRAFT.AP+"|"+DRAFT.Code:"";
  const rev=rid?S.dec.filter(d=>d.Row_ID===rid).length+1:1;
  const exists=rid?S.master.some(r=>r.Row_ID===rid):true;
  const e=k=>VERR[k]?" bad":"";
  const log=decFiltered().slice().reverse();

  return '<div class="cards" style="margin-top:16px">'+
    card("Decisions<br>logged",total,"append-only, all revisions","neutral")+
    card("Open",open,"not yet approved","review")+
    card("Overdue",overdue,"past due date","critical")+
    card("Approved",appr,"stage 7","ready")+
    card("Rows with<br>no decision",noDec,"of "+S.master.length+" rows","teal")+
  '</div>'+

  '<div class="fband"><div class="frow">'+
    slicer("Slicer · Zonal","decZonal",[{v:"(All)",n:S.dec.length}].concat(
      ZONALS.map(z=>({v:z.z,n:S.dec.filter(d=>d.Zonal===z.z).length}))),F.decZonal||"(All)",false)+
    slicer("Slicer · Status","decStatus",[{v:"(All)",n:S.dec.length}].concat(
      STATUS_LIST.map(s=>({v:s,n:S.dec.filter(d=>d.Status===s).length}))),F.decStatus,false)+
    slicer("Slicer · Owner","decOwner",[{v:"(All)",n:S.dec.length}].concat(
      uniq(S.dec.map(d=>d.Owner)).sort().map(o=>({v:o,n:S.dec.filter(d=>d.Owner===o).length}))),F.decOwner,false)+
  '</div><div class="fnote">In the Excel build the slicers filter the summary cards; the log itself is filtered with the column arrows. '+
   'Here they do both — but the rule that matters is unchanged: <b>a revision is a new row, never an edit to an old one.</b></div></div>'+

  '<div class="slabel">Log a decision <span class="hint">the closing loop — this is the only place the workbook accepts typing</span></div>'+
  '<div class="form"><div class="fgrid">'+
    fg("Zonal","zonal-sel",'<select data-d="Zonal">'+ZONALS.map(z=>'<option'+(z.z===DRAFT.Zonal?" selected":"")+'>'+z.z+'</option>').join('')+'</select>',"Drives the AP list",false)+
    fg("Area programme","ap-sel",'<select data-d="AP"'+(apOpts.length?"":" disabled")+'><option value="">— select —</option>'+
      apOpts.map(a=>'<option'+(a===DRAFT.AP?" selected":"")+'>'+a+'</option>').join('')+'</select>',"Dependent on Zonal",true,e("AP"))+
    fg("Indicator code","code-sel",'<select data-d="Code"'+(codeOpts.length?"":" disabled")+'><option value="">'+
      (DRAFT.AP?"— select —":"Select Zonal and AP first")+'</option>'+
      codeOpts.map(c=>'<option'+(c===DRAFT.Code?" selected":"")+'>'+c+' — '+esc(IND[c]?IND[c].short:"")+'</option>').join('')+'</select>',
      "Dependent on AP",true,e("Code"))+
    fg("Decision","dec-sel",'<select data-d="Decision"><option value="">— select —</option>'+
      DECISION_LIST.map(d=>'<option'+(d.d===DRAFT.Decision?" selected":"")+'>'+d.d+'</option>').join('')+'</select>',
      "Error alert: Stop",true,e("Decision"))+
    fg("Reason","rsn-sel",'<select data-d="Reason"><option value="">— select —</option>'+
      REASONS.map(r=>'<option'+(r[0]===DRAFT.Reason?" selected":"")+'>'+r[0]+'</option>').join('')+'</select>',
      "Standard reason codes",true,e("Reason"))+
    fg("Reviewer","rev-sel",'<select data-d="Reviewer"><option value="">— select —</option>'+
      ROLES.filter(r=>REVIEWER_ROLES.indexOf(r[1])>=0).map(r=>'<option'+(r[0]===DRAFT.Reviewer?" selected":"")+'>'+
        r[0]+' · '+r[1]+'</option>').join('')+'</select>',"lstReviewer",true,e("Reviewer"))+
    fg("Owner","own-sel",'<select data-d="Owner"><option value="">— select —</option>'+
      ROLES.map(r=>'<option'+(r[0]===DRAFT.Owner?" selected":"")+'>'+r[0]+' · '+r[1]+'</option>').join('')+'</select>',
      "Who does the follow-up",true,e("Owner"))+
    fg("Due date","due-in",'<input type="date" data-d="Due_Date" value="'+esc(DRAFT.Due_Date)+'">',
      "Warning if in the past",true,e("Due_Date"))+
    fg("Status","st-sel",'<select data-d="Status">'+STATUS_LIST.map(s=>'<option'+(s===DRAFT.Status?" selected":"")+'>'+s+'</option>').join('')+'</select>',
      "Approved sets stage 7",true)+
    fg("Approval date","apd-in",'<input type="date" data-d="Approval_Date" value="'+esc(DRAFT.Approval_Date)+'"'+
      (DRAFT.Status==="Approved"?"":" disabled")+'>',
      DRAFT.Status==="Approved"?"Required when approved":"Only when status is Approved",DRAFT.Status==="Approved",e("Approval_Date"))+
    '<div class="fg wide'+e("Comment")+'"><label>Comment '+(reqComment?'<span class="req">*</span>':'')+
      '</label><textarea data-d="Comment" rows="2" maxlength="255" placeholder="'+
      (reqComment?esc(DRAFT.Decision)+' requires a comment: say what has to change, and by when.':'Optional for this decision type.')+
      '">'+esc(DRAFT.Comment)+'</textarea><div class="hlp">255 characters. '+
      (reqComment?'<b style="color:var(--red)">Required for '+esc(DRAFT.Decision)+'</b>':'Not required for this decision')+'</div></div>'+
  '</div>'+
  '<div class="formfoot">'+
    '<button class="gobtn" id="btnLog">Log decision</button>'+
    '<span class="keyprev">Row_ID '+(rid?esc(rid):'—')+' &nbsp;·&nbsp; Revision '+rev+' &nbsp;·&nbsp; Dec_Key '+(rid?esc(rid)+"|"+rev:'—')+'</span>'+
    (rid&&!exists?'<span class="vmsg">▲ This key is not in tblMaster — it would vanish from every report</span>':'')+
    (VERR.msg?'<span class="vmsg">▲ '+esc(VERR.msg)+'</span>':'')+
    '<span class="appendonly">Revision '+rev+' supersedes earlier revisions in the reports and keeps them in the log.</span>'+
  '</div></div>'+

  '<div class="slabel">tblDecision <span class="hint">'+log.length+' of '+total+
    ' rows shown · newest first · nothing can be deleted</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Dec_ID</th><th>Logged</th><th>Zonal</th><th>AP</th>'+
    '<th>Code</th><th class="c">Rev</th><th>Decision</th><th>Reason</th><th>Reviewer</th><th>Owner</th>'+
    '<th>Due</th><th>Status</th><th>Approved</th><th>Comment</th></tr></thead><tbody>'+
    (log.length?log.map(d=>{
      const i=S.dec.indexOf(d), late=d.Status!=="Approved"&&d.Due_Date&&d.Due_Date<TODAY;
      const stc=d.Status==="Approved"?'style="background:var(--f-ready);color:var(--green);font-weight:700"':
        d.Status==="Revision Requested"?'style="background:var(--f-review);color:var(--amber);font-weight:700"':
        d.Status==="Deferred"?'style="background:var(--f-reference)"':'';
      const dupWarn=!S.master.some(r=>r.Row_ID===d.Row_ID);
      return '<tr><td class="code">D-'+String(i+1).padStart(4,"0")+'</td><td class="nowrap dim">'+dmy(d.Timestamp)+'</td>'+
        '<td>'+esc(d.Zonal)+'</td><td>'+esc(d.AP)+'</td>'+
        '<td class="code'+(dupWarn?' miss':'')+'" style="text-align:left">'+esc(d.Code)+(dupWarn?' ▲':'')+'</td>'+
        '<td class="c">'+d.Revision+'</td><td>'+esc(d.Decision)+'</td><td class="dim">'+esc(d.Reason)+'</td>'+
        '<td>'+esc(d.Reviewer)+'</td><td>'+esc(d.Owner)+'</td>'+
        '<td class="nowrap'+(late?' miss':'')+'" style="text-align:left">'+dmy(d.Due_Date)+'</td>'+
        '<td '+stc+'>'+esc(d.Status)+'</td><td class="nowrap dim">'+(d.Approval_Date?dmy(d.Approval_Date):"—")+'</td>'+
        '<td>'+(d.Comment?esc(d.Comment):'<span class="dim">—</span>')+'</td></tr>';
    }).join('')
    :'<tr><td colspan="14" class="dim">The log is empty under this filter. Clear the slicers, or record the first decision above.</td></tr>')+
    '</tbody></table></div>'+
  '<p class="tcap">A code shaded <span style="background:var(--f-critical);color:var(--red);padding:1px 4px">red ▲</span> '+
   'is a decision logged against a row that is not in the submission — the one error that would otherwise vanish silently (§6.7 ·10).</p>';
}
function fg(label,id,ctrl,help,req,bad){
  return '<div class="fg'+(bad||"")+'"><label>'+label+(req?' <span class="req">*</span>':'')+'</label>'+
    ctrl+'<div class="hlp">'+help+'</div></div>';
}

/* ==================================================================
   00_MASTER  —  the manual editing space
   Everything on this sheet writes to the working state, recomputes the
   whole model, and can be downloaded back out as a data file to commit.
   ================================================================== */
const pin  = v => isBlank(v)?"":(Math.round(v*1000)/10);          /* fraction → 23.5 */
const pout = v => (v===""||v===null)?null:(parseFloat(v)/100);    /* 23.5 → fraction */
const nin  = v => isBlank(v)?"":v;

function scopeCounts(){
  const out={inScope:0,outScope:0};
  S.master.forEach(r=>{ r.In_Scope?out.inScope++:out.outScope++; });
  return out;
}
function renderMaster(){
  const sc=scopeCounts();
  const jump=[["m_cycle","Cycle settings"],["m_outcome","Outcome map per AP"],["m_ind","Indicator catalogue"],
    ["m_data","Submission data"],["m_dec","Decision log"],["m_save","Save & publish"]];

  /* ---------- B · outcome map ---------- */
  const ocHead=OUTCOMES.map(o=>{
    const on=AP_LIST.filter(a=>a.outcomes.indexOf(o)>=0).length, all=AP_LIST.length;
    const mark=on===all?"●":on===0?"○":"◐";
    const tip=on===all?"On for every AP — click to switch it off everywhere"
      :on===0?"Off everywhere — click to switch it on everywhere"
      :"On for "+on+" of "+all+" APs — click to switch it on everywhere";
    return '<th class="c"><button class="ocall '+(on===all?"all":on===0?"none":"mix")+
      '" data-act="ocAll" data-oc="'+o+'" title="'+tip+'">'+mark+' '+o+'</button></th>';
  }).join('');
  const regRows=AP_LIST.map((a,i)=>{
    const rows=S.master.filter(r=>r.AP===a.ap);
    const off=rows.filter(r=>!r.In_Scope).length;
    return '<tr><td class="dim">'+esc(a.z)+'</td><td><b>'+esc(a.ap)+'</b></td>'+
      '<td><input class="cell" size="7" data-edit="reg" data-i="'+i+'" data-k="ap_id" value="'+esc(a.id)+'"></td>'+
      '<td><select class="cell" data-edit="reg" data-i="'+i+'" data-k="strategic">'+
        ["Full AP","Transitioning","New design","Closing"].map(s=>'<option'+(s===a.strategic?" selected":"")+'>'+s+'</option>').join('')+
      '</select></td>'+
      OUTCOMES.map(o=>{
        const on=a.outcomes.indexOf(o)>=0, n=rows.filter(r=>r.Outcome===o).length;
        return '<td class="c"><button class="oc '+(on?"on":"off")+'" data-act="ocToggle" data-i="'+i+
          '" data-oc="'+o+'" title="'+n+' rows carry this outcome">'+(on?"●":"○")+'<span>'+n+'</span></button></td>';
      }).join('')+
      '<td class="r">'+rows.length+'</td>'+
      '<td class="r'+(off?' crit':' dim')+'">'+off+'</td>'+
      '<td>'+(rows.length?'<span class="dim" title="Remove the rows first">'+rows.length+' rows</span>'
        :'<button class="tiny" data-act="delAP" data-i="'+i+'">remove</button>')+'</td></tr>';
  }).join('');

  /* ---------- C · indicator catalogue ---------- */
  const indRows=INDICATORS.map((it,i)=>{
    const used=S.master.filter(r=>r.Code===it.code).length;
    return '<tr><td><input class="cell" size="9" data-edit="ind" data-i="'+i+'" data-k="code" value="'+esc(it.code)+'"></td>'+
      '<td><select class="cell" data-edit="ind" data-i="'+i+'" data-k="oc">'+
        OUTCOMES.map(o=>'<option'+(o===it.oc?" selected":"")+'>'+o+'</option>').join('')+'</select></td>'+
      '<td><input class="cell" style="width:100%" data-edit="ind" data-i="'+i+'" data-k="short" value="'+esc(it.short)+'"></td>'+
      '<td class="r"><input class="cell r" size="6" type="number" step="0.1" placeholder="TBC" data-edit="indpct" data-i="'+i+
        '" data-k="thr" value="'+pin(it.thr)+'"></td>'+
      '<td class="c"><select class="cell" data-edit="ind" data-i="'+i+'" data-k="dir">'+
        '<option value="1"'+(it.dir===1?" selected":"")+'>↑ higher better</option>'+
        '<option value="-1"'+(it.dir===-1?" selected":"")+'>↓ reduction</option></select></td>'+
      '<td class="r dim">'+used+'</td>'+
      '<td>'+(used?'<span class="dim">in use</span>':'<button class="tiny" data-act="delInd" data-i="'+i+'">remove</button>')+'</td></tr>';
  }).join('');

  /* ---------- D · submission data ---------- */
  const edZ=F.edZonal||ZONALS[0].z;
  const edAPs=apsOf(edZ);
  const edAP=(edAPs.indexOf(F.edAP)>=0)?F.edAP:edAPs[0];
  const dataRows=S.master.map((r,i)=>({r:r,i:i})).filter(x=>x.r.AP===edAP);
  const codeSel=(r,i)=>'<select class="cell" data-edit="row" data-i="'+i+'" data-k="Code">'+
    INDICATORS.map(it=>'<option'+(it.code===r.Code?" selected":"")+'>'+it.code+'</option>').join('')+'</select>';
  const body=dataRows.map(x=>{
    const r=x.r,i=x.i;
    return '<tr'+(r.In_Scope?'':' class="oos"')+'><td>'+codeSel(r,i)+'</td>'+
      '<td class="dim">'+esc(r.Indicator_Short)+'</td>'+
      '<td><select class="cell" data-edit="row" data-i="'+i+'" data-k="Outcome">'+
        OUTCOMES.map(o=>'<option'+(o===r.Outcome?" selected":"")+'>'+o+'</option>').join('')+'</select></td>'+
      ['Num_Base','Den_Base'].map(k=>'<td><input class="cell r" size="6" type="number" data-edit="row" data-i="'+i+
        '" data-k="'+k+'" value="'+nin(r[k])+'"></td>').join('')+
      '<td><input class="cell r" size="6" type="number" step="0.1" data-edit="rowpct" data-i="'+i+
        '" data-k="Pct_Base" value="'+pin(r.Pct_Base)+'"></td>'+
      ['Num_LOP','Den_LOP'].map(k=>'<td><input class="cell r" size="6" type="number" data-edit="row" data-i="'+i+
        '" data-k="'+k+'" value="'+nin(r[k])+'"></td>').join('')+
      '<td><input class="cell r" size="6" type="number" step="0.1" data-edit="rowpct" data-i="'+i+
        '" data-k="Pct_LOP" value="'+pin(r.Pct_LOP)+'"></td>'+
      '<td><input class="cell r" size="6" type="number" step="0.1" placeholder="TBC" data-edit="rowpct" data-i="'+i+
        '" data-k="Threshold" value="'+pin(r.Threshold)+'"></td>'+
      '<td><select class="cell" data-edit="row" data-i="'+i+'" data-k="AP_vs_Threshold">'+
        ["Set target","Monitor Indicator"].map(o=>'<option'+(o===r.AP_vs_Threshold?" selected":"")+'>'+o+'</option>').join('')+'</select></td>'+
      '<td>'+pill(r.Row_Status)+'</td>'+
      '<td><button class="tiny warn" data-act="delRow" data-i="'+i+'" title="Removes the row from tblMaster">remove</button></td></tr>';
  }).join('');

  const sizes={master:S.master.length,dec:S.dec.length,ind:INDICATORS.length,ap:AP_LIST.length};

  return '<div class="jump"><span>On this sheet</span>'+
    jump.map(j=>'<a href="#" data-jump="'+j[0]+'">▸ '+j[1]+'</a>').join('')+
    '<span style="margin-left:auto;text-transform:none;letter-spacing:0;font-weight:400" class="dim">'+
    (S.local?'Local edits are held in this browser.':'No local edits yet.')+'</span></div>'+

  '<div class="notice">Every change here recomputes the whole model straight away — the eight report sheets follow, '+
   'no refresh needed. Changes live in your browser only: to make them permanent, download the data file at the bottom '+
   'and commit it to the repository.</div>'+

  /* ---------- A ---------- */
  '<div class="slabel" id="m_cycle">Cycle settings <span class="hint">SETTINGS · §2.8</span></div>'+
  '<div class="form" style="border-top-color:var(--teal)"><div class="fgrid">'+
    '<div class="fg"><label>Cycle label</label><input data-edit="cfg" data-k="Cycle" value="'+esc(CFG.Cycle)+'"><div class="hlp">Prints top-right on all sheets</div></div>'+
    '<div class="fg"><label>Workbook stage</label><select data-edit="cfg" data-k="Stage">'+
      STAGES.map(s=>'<option'+(s.name===CFG.Stage?" selected":"")+'>'+s.name+'</option>').join('')+
      '</select><div class="hlp">Drives “Stage n of 7” everywhere</div></div>'+
    '<div class="fg"><label>Version</label><input data-edit="cfg" data-k="Version" value="'+esc(CFG.Version)+'"><div class="hlp">Never ship two files with the same string</div></div>'+
    '<div class="fg"><label>Import date</label><input data-edit="cfg" data-k="ImportDate" value="'+esc(CFG.ImportDate)+'"><div class="hlp">Shown in every footer</div></div>'+
    '<div class="fg"><label>Readiness target</label><input type="number" step="1" min="0" max="100" data-edit="cfgpct" data-k="ReadinessTarget" value="'+
      Math.round(CFG.ReadinessTarget*100)+'"><div class="hlp">Per cent of rows that must reach Approval</div></div>'+
    '<div class="fg"><label>Cycle owner</label><input data-edit="cfg" data-k="Owner" value="'+esc(CFG.Owner)+'"><div class="hlp">Who to contact</div></div>'+
    '<div class="fg wide"><label>Footer line</label><input data-edit="cfg" data-k="Footer" value="'+esc(CFG.Footer)+'"><div class="hlp">Prints bottom-left on every sheet and every PDF</div></div>'+
  '</div></div>'+

  /* ---------- B ---------- */
  '<div class="slabel" id="m_outcome">Outcome map per AP '+
    '<span class="hint">click a dot to switch an outcome on or off · click a column heading to switch it for every AP</span></div>'+
  '<div class="health" style="margin-top:0">'+
    '<div class="m">Rows in scope<b style="color:var(--green)">'+n0(sc.inScope)+'</b></div>'+
    '<div class="m">Out of scope → REFERENCE<b style="color:var(--grey)">'+n0(sc.outScope)+'</b></div>'+
    OUTCOMES.map(o=>'<div class="m">'+o+' active in<b>'+AP_LIST.filter(a=>a.outcomes.indexOf(o)>=0).length+
      ' <span style="font-size:10px;font-weight:400">of '+AP_LIST.length+' APs</span></b></div>').join('')+
  '</div>'+
  '<div class="tscroll" style="margin-top:10px"><table class="gt ed"><thead><tr><th>Zonal</th><th>Area programme</th>'+
    '<th>AP ID</th><th>Strategic status</th>'+ocHead+'<th class="r">Rows</th><th class="r">Out of<br>scope</th><th></th>'+
    '</tr></thead><tbody>'+regRows+'</tbody></table></div>'+
  '<div class="addbar">'+
    '<span>Add an AP</span>'+
    '<input id="newZ" placeholder="Zonal" size="10" list="zlist">'+
    '<datalist id="zlist">'+ZONALS.map(z=>'<option>'+esc(z.z)+'</option>').join('')+'</datalist>'+
    '<input id="newAP" placeholder="AP name" size="18">'+
    '<input id="newID" placeholder="AP ID" size="8">'+
    '<button class="ghost" data-act="addAP">Add to register</button>'+
    '<span class="dim">A new AP starts with all five outcomes on and no rows.</span>'+
  '</div>'+
  '<p class="tcap">Switching an outcome off does not delete anything. Its rows become '+
   pill("REFERENCE")+' — visible, excluded from readiness, and never counted as a blocker. '+
   'Switch it back on and they return to the queue.</p>'+

  /* ---------- C ---------- */
  '<div class="slabel" id="m_ind">Indicator catalogue <span class="hint">tblIndicator + tblThreshold · '+sizes.ind+' rows</span></div>'+
  '<div class="tscroll"><table class="gt ed"><thead><tr><th>Code</th><th>Outcome</th><th>Short name <span class="dim">≤40 chars</span></th>'+
    '<th class="r">Threshold %</th><th class="c">Direction</th><th class="r">Used by</th><th></th></tr></thead><tbody>'+
    indRows+'</tbody></table></div>'+
  '<div class="addbar"><span>Add an indicator</span>'+
    '<input id="newCode" placeholder="OIOS 00" size="9">'+
    '<select id="newOC">'+OUTCOMES.map(o=>'<option>'+o+'</option>').join('')+'</select>'+
    '<input id="newShort" placeholder="Short name" size="26">'+
    '<input id="newThr" placeholder="Threshold %" size="9" type="number" step="0.1">'+
    '<button class="ghost" data-act="addInd">Add to catalogue</button></div>'+
  '<p class="tcap">Leave the threshold blank for TBC. A blank threshold keeps the row at stage 1 and flags it — '+
   'which is the point: an indicator without an approved threshold cannot be approved.</p>'+

  /* ---------- D ---------- */
  '<div class="slabel" id="m_data">Submission data <span class="hint">tblMaster · '+sizes.master+
    ' rows · edit one AP at a time</span></div>'+
  '<div class="fband" style="margin-top:0"><div class="frow">'+
    '<div class="fcell"><label>Zonal</label><select data-rf="edzonal">'+
      ZONALS.map(z=>'<option'+(z.z===edZ?" selected":"")+'>'+z.z+'</option>').join('')+'</select></div>'+
    '<div class="fcell"><label>Area programme</label><select data-rf="edap">'+
      edAPs.map(a=>'<option'+(a===edAP?" selected":"")+'>'+a+'</option>').join('')+'</select></div>'+
    '<div class="fcell"><label>&nbsp;</label><button class="ghost" data-act="addRow">+ Add a row to '+esc(edAP)+'</button></div>'+
    '<div class="fcell"><label>&nbsp;</label><button class="ghost" data-act="openImport">⤓ Replace everything by paste</button></div>'+
    '<div class="fcell"><label>Showing</label><div class="keyprev" style="padding:6px 9px">'+dataRows.length+' rows</div></div>'+
  '</div><div class="fnote">Percentages are typed as percentages: <b>23.5</b> means 23.5%. '+
   'An empty box means <b>not submitted</b> and is never read as zero — that distinction is what the flags are built on.</div></div>'+
  '<div class="tscroll"><table class="gt ed"><thead><tr><th>Code</th><th>Indicator</th><th>Outcome</th>'+
    '<th class="r">Num base</th><th class="r">Den base</th><th class="r">Base %</th>'+
    '<th class="r">Num LOP</th><th class="r">Den LOP</th><th class="r">Target %</th>'+
    '<th class="r">Thresh %</th><th>AP vs threshold</th><th>Status</th><th></th></tr></thead><tbody>'+
    (body||'<tr><td colspan="13" class="dim">No rows for this AP. Add one, or paste a submission block.</td></tr>')+
    '</tbody></table></div>'+
  '<p class="tcap">Delta and AP proposal are recomputed from the two proportions as you type. '+
   'If your submission carries a proposal that disagrees with them, load it through paste import instead — '+
   'the workbook shows the disagreement rather than hiding it.</p>'+

  /* ---------- E ---------- */
  '<div class="slabel" id="m_dec">Decision log <span class="hint">tblDecision · '+sizes.dec+' rows</span></div>'+
  '<div class="health" style="margin-top:0">'+
    '<div class="m">Decisions<b>'+sizes.dec+'</b></div>'+
    '<div class="m">Approved<b style="color:var(--green)">'+S.dec.filter(d=>d.Status==="Approved").length+'</b></div>'+
    '<div class="m">Rows with a decision<b>'+uniq(S.dec.map(d=>d.Row_ID)).length+'</b></div>'+
    '<div class="m" style="margin-left:auto">'+
      '<button class="ghost warn" data-act="clearDec">Clear the decision log</button></div>'+
  '</div>'+
  '<p class="tcap">The log that ships with this site is <b>sample data</b>, so the reports have something to show. '+
   'Clear it once before the first real workshop — after that, never clear it again: it is the audit trail.</p>'+

  /* ---------- F ---------- */
  '<div class="slabel" id="m_save">Save &amp; publish</div>'+
  '<div class="notice">A page served from GitHub Pages cannot write back to the repository. '+
   'The route is: edit here → download the file → commit it in GitHub. '+
   'Downloads are drop-in replacements: same filename, same folder.</div>'+
  '<div class="fgrid" style="margin-top:12px">'+
    '<div class="fg"><button class="ghost" style="width:100%" data-act="dlMaster">⤓ data/master.js</button>'+
      '<div class="hlp">'+sizes.master+' submission rows</div></div>'+
    '<div class="fg"><button class="ghost" style="width:100%" data-act="dlRegister">⤓ data/ap-register.js</button>'+
      '<div class="hlp">'+sizes.ap+' APs and the outcome map</div></div>'+
    '<div class="fg"><button class="ghost" style="width:100%" data-act="dlIndicators">⤓ data/indicators.js</button>'+
      '<div class="hlp">'+sizes.ind+' indicators and thresholds</div></div>'+
    '<div class="fg"><button class="ghost" style="width:100%" data-act="dlDecisions">⤓ data/decisions.js</button>'+
      '<div class="hlp">'+sizes.dec+' decision rows</div></div>'+
  '</div>'+
  '<div class="formfoot">'+
    '<button class="gobtn" data-act="dlAll">Download all four data files</button>'+
    '<button class="ghost warn" data-act="resetLocal">Discard local edits and reload the repo data</button>'+
    '<span class="appendonly">'+(localAvailable()
      ? 'Local edits are saved automatically in this browser and survive a reload.'
      : 'This browser is blocking local storage, so edits last until you reload. Download before you leave.')+'</span>'+
  '</div>';
}

/* ==================================================================
   07_DATAQUALITY  (§6.8)
   ================================================================== */
function renderDQ(){
  const n=S.master.length, gate=importGate();
  const clean=countIf(r=>r.Flag_Count===0), flagged=n-clean;
  let rows=S.master;
  if(F.dqZonal&&F.dqZonal!=="(All)") rows=rows.filter(r=>r.Zonal===F.dqZonal);
  const fl=FLAGS.map(f=>({k:f[0],label:f[1],short:f[2],v:rows.reduce((a,r)=>a+r[f[0]],0)}));
  const sorted=fl.slice().sort((a,b)=>b.v-a.v);
  const apAgg=uniq(rows.map(r=>r.AP)).map(ap=>{
    const rs=rows.filter(r=>r.AP===ap);
    return {ap:ap,z:zoneOfAP(ap),n:rs.length,
      f:FLAGS.map(f=>rs.reduce((a,r)=>a+r[f[0]],0)),
      flagged:rs.filter(r=>r.Flag_Count>0).length};
  }).sort((a,b)=>b.flagged/b.n-a.flagged/a.n);
  const indAgg=uniq(rows.map(r=>r.Code)).map(c=>{
    const rs=rows.filter(r=>r.Code===c);
    return {c:c,short:IND[c]?IND[c].short:c,n:rs.length,
      f:FLAGS.map(f=>rs.reduce((a,r)=>a+r[f[0]],0)),
      flagged:rs.filter(r=>r.Flag_Count>0).length};
  }).sort((a,b)=>b.flagged-a.flagged).slice(0,14);
  const corr=rows.filter(r=>r.Flag_Count>0).slice(0,60);
  const flagNames=r=>FLAGS.filter(f=>r[f[0]]).map(f=>f[1]).join(", ");

  return '<div class="health">'+
    '<div class="gate '+(gate==="IMPORT OK"?"ok":"no")+'">'+(gate==="IMPORT OK"?"● ":"▲ ")+gate+'</div>'+
    '<div class="m">Rows<b>'+n0(n)+'</b></div>'+
    '<div class="m">Clean rows<b style="color:var(--green)">'+n0(clean)+'</b></div>'+
    '<div class="m">Flagged<b style="color:var(--red)">'+n0(flagged)+'</b></div>'+
    '<div class="m">Flags raised<b>'+n0(S.master.reduce((a,r)=>a+r.Flag_Count,0))+'</b></div>'+
    '<div class="m" style="margin-left:auto">'+
      '<label style="font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase">Slicer · Zonal</label>'+
      '<select data-rf="dqzonal" style="border:1px solid #A9A6B0;padding:5px 8px;background:#fff;border-radius:2px">'+
      ["(All)"].concat(ZONALS.map(z=>z.z)).map(z=>'<option'+(z===(F.dqZonal||"(All)")?" selected":"")+'>'+z+'</option>').join('')+
      '</select></div></div>'+
    (gate!=="IMPORT OK"?'<p class="tcap" style="color:var(--red);font-weight:600">'+
      'The import gate must read IMPORT OK before this workbook is distributed (§4.4). '+
      flagSum("Chk_Duplicate")+' rows carry a duplicate Row_ID — resolve them at source, or document the exception in writing. '+
      (S.demo?'<button class="ghost noprint" id="btnDedupe" style="margin-left:8px;font-weight:400">'+
        'Resolve duplicates and clear the gate</button>':'')+'</p>':'')+

  '<div class="cards" style="margin-top:16px">'+
    fl.map(f=>card(f.short,f.v,f.v?"rows to correct":"none","critical")).join('')+
  '</div>'+

  '<div class="slabel">Where to start <span class="hint">chtDQ_Flags · flag totals, largest first</span></div>'+
  '<div class="chartbox">'+chartFlags(sorted.map(f=>({label:f.label,v:f.v})))+'</div>'+

  '<div class="slabel">Flags by area programme <span class="hint">pvtDQ_AP · worst share of flagged rows first</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Zonal</th><th>Area programme</th><th class="r">Rows</th>'+
    FLAGS.map(f=>'<th class="r">'+f[2].replace("<br>"," ").replace("MISSING ","").replace("DUPLICATE","Dupe").replace("RANGE","Range")+'</th>').join('')+
    '<th class="r">Flagged</th><th>Share</th></tr></thead><tbody>'+
    apAgg.map(a=>'<tr><td class="dim">'+esc(a.z)+'</td><td><b>'+esc(a.ap)+'</b></td><td class="r">'+a.n+'</td>'+
      a.f.map(v=>'<td class="r'+(v>0?' crit':' dim')+'">'+v+'</td>').join('')+
      '<td class="r'+(a.flagged>0?' crit':'')+'">'+a.flagged+'</td><td>'+bar(a.flagged/a.n,true)+'</td></tr>').join('')+
    '</tbody></table></div>'+

  '<div class="slabel">Flags by indicator <span class="hint">pvtDQ_Ind · top 14</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Code</th><th>Indicator</th><th class="r">Rows</th>'+
    FLAGS.map(f=>'<th class="r">'+f[2].replace("<br>"," ").replace("MISSING ","").replace("DUPLICATE","Dupe").replace("RANGE","Range")+'</th>').join('')+
    '<th class="r">Flagged</th></tr></thead><tbody>'+
    indAgg.map(a=>'<tr><td class="code">'+esc(a.c)+'</td><td>'+esc(a.short)+'</td><td class="r">'+a.n+'</td>'+
      a.f.map(v=>'<td class="r'+(v>0?' crit':' dim')+'">'+v+'</td>').join('')+
      '<td class="r'+(a.flagged>0?' crit':'')+'">'+a.flagged+'</td></tr>').join('')+
    '</tbody></table></div>'+

  '<div class="slabel">Correction list <span class="hint">every flagged row'+
    (rows.filter(r=>r.Flag_Count>0).length>60?' · first 60 of '+rows.filter(r=>r.Flag_Count>0).length:'')+
    ' · print this and carry it into the cleaning session</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Zonal</th><th>AP</th><th>Code</th><th>Indicator</th>'+
    '<th class="c">Flags</th><th>What is wrong</th><th>Owner</th><th>Status</th></tr></thead><tbody>'+
    corr.map(r=>'<tr><td class="dim">'+esc(r.Zonal)+'</td><td>'+esc(r.AP)+'</td><td class="code">'+esc(r.Code)+'</td>'+
      '<td>'+esc(r.Indicator_Short)+'</td><td class="c crit">'+r.Flag_Count+'</td>'+
      '<td style="color:var(--red)">'+esc(flagNames(r))+'</td>'+
      '<td>'+(r.Dec_Owner?esc(r.Dec_Owner):'<span class="dim">unassigned</span>')+'</td>'+
      '<td>'+(r.Dec_Status?esc(r.Dec_Status):'<span class="dim">Not started</span>')+'</td></tr>').join('')+
    '</tbody></table></div>'+
  '<p class="tcap">Owners are assigned on <a href="#" data-go="06_DECISIONS">06 Decision Tracker</a> with decision '+
   '<i>Revise data</i>. Export the list from the toolbar to send it to the APs (§9.3).</p>';
}

/* ==================================================================
   08_REFERENCE  (§6.9)
   ================================================================== */
const FAQ=[
 ["Q01","Kenapa sel kosong, bukan nol?","Why is a cell blank rather than zero?",
  "Kosong berarti <b>tidak ada data yang dikirim</b>; nol berarti nilainya benar-benar nol. Keduanya dibedakan sejak tahap import (§4.2 langkah 4), karena baseline 0% dan baseline yang belum diukur menuntut tindakan yang berbeda."],
 ["Q02","Apa arti <i>Monitor Indicator</i> dan apa yang harus AP lakukan?","What does Monitor Indicator mean and what should the AP do?",
  "Baseline sudah melewati threshold, sehingga AP tidak menetapkan target baru siklus ini. AP tetap mengumpulkan data dan melaporkannya; indikator tidak dihapus dari ITT."],
 ["Q03","Kenapa saya tidak bisa mengetik di sheet 01–05?","Why can I not type on sheets 01–05?",
  "Sheet 01–05 adalah pembacaan dari satu model data. Semua keputusan masuk melalui sheet 06 supaya setiap perubahan punya jejak audit: siapa, kapan, alasan apa."],
 ["Q04","Bagaimana merevisi keputusan yang sudah dicatat?","How do I revise a decision I already logged?",
  "Catat baris baru untuk Row_ID yang sama. Revision naik otomatis dan laporan memakai revisi terakhir; revisi sebelumnya tetap tersimpan. <b>Jangan mengubah baris lama.</b>"],
 ["Q05","Dari mana threshold berasal?","Where does the threshold come from?",
  "Dari tblThreshold di sheet ini — setiap nilai punya sumber dan tanggal persetujuan. Jika kolom berbunyi TBC, threshold belum ada dan indikator tidak bisa masuk tahap 2."],
 ["Q06","Apa maksud <i>Stage 4 of 7</i>?","What does Stage 4 of 7 refer to?",
  "Tahap siklus di tingkat workbook, disetel PEARL di SETTINGS. Setiap baris juga punya tahapnya sendiri (1–7); Approval Progress adalah proporsi baris yang sudah di tahap 7."],
 ["Q07","AP saya tidak ada di dropdown — apa yang harus saya lakukan?","My AP is missing from the dropdown — what do I do?",
  "AP diambil dari tblAP, bukan dari data submission. Hubungi PEARL untuk menambahkan AP ke register; menambah baris data tanpa register akan tertangkap sebagai kunci tidak dikenal di sheet 06."],
 ["Q08","Kenapa threshold indikator saya tertulis TBC?","Why does my indicator show TBC for threshold?",
  "Sektor teknis belum menetapkan nilainya. Indikator boleh dibahas, tetapi tidak boleh disetujui — Row_Status akan tetap CRITICAL sampai threshold masuk."],
 ["Q09","Siapa yang menyetujui target?","Who approves a target?",
  "PEARL Lead, setelah Technical Review sektor. Persetujuan sah bila Status = Approved <b>dan</b> Approval Date terisi (§1.3 tahap 7)."],
 ["Q10","Bagaimana mencetak dossier AP saya?","How do I export my AP's dossier?",
  "Buka 03_AP, pilih AP, lalu Print. Halaman sudah dibatasi 30 baris tetap supaya selalu satu halaman A4 landscape, dengan nama AP ikut tercetak di baris breadcrumb."],
 ["Q11","Apa bedanya Baseline dan LOP?","What is the difference between Baseline and LOP?",
  "Baseline adalah kondisi awal siklus (FY26). LOP (Life of Programme) adalah nilai yang diharapkan pada akhir FY30. Delta adalah jarak antara keduanya, bukan target itu sendiri."],
 ["Q12","Ke siapa saya melaporkan kesalahan data?","Who do I contact about a data error?",
  "DMEAL zonal Anda, dengan Row_ID dari sheet 05. Kesalahan yang sudah masuk daftar koreksi di 07 sudah diketahui — cukup konfirmasi angka penggantinya."]
];
function renderReference(){
  const jump=[["ref_status","Status legend"],["ref_stage","Stage legend"],["ref_ind","Indicator definitions"],
    ["ref_thr","Threshold reference"],["ref_calc","Calculation guidance"],["ref_faq","FAQ"],["ref_ver","Version history"],["ref_qa","QA checklist"]];
  return '<div class="jump"><span>On this sheet</span>'+
    jump.map(j=>'<a href="#" data-jump="'+j[0]+'">▸ '+j[1]+'</a>').join('')+
    '<span style="margin-left:auto;text-transform:none;letter-spacing:0;font-weight:400" class="dim">In Excel, Alt+← returns you to where you came from.</span></div>'+

  '<div class="slabel" id="ref_status">Status legend <span class="hint">the whole workbook resolves to these five values — there is no sixth</span></div>'+
  '<div class="legendbox">'+STATUS.map(s=>'<div class="lrow"><span class="pill '+s.cls+'"><span class="ic">'+s.ic+'</span></span>'+
    '<span class="nm" style="color:var(--'+({READY:"green","NEEDS REVIEW":"amber",MONITOR:"burnt",CRITICAL:"red",REFERENCE:"grey"})[s.s]+')">'+
    s.s+'</span><span>'+s.desc+' · <span class="dim">'+countIf(r=>r.Row_Status===s.s)+' rows now</span></span></div>').join('')+'</div>'+

  '<div class="slabel" id="ref_stage">Stage legend <span class="hint">the seven steps, and who owns each</span></div>'+
  '<div class="legendbox">'+STAGES.map(s=>'<div class="stagerow'+(s.name===CFG.Stage?" here":"")+'"><div class="n">'+s.n+'</div>'+
    '<div><b>'+s.name+'</b> — '+esc(s.desc)+'<br><span class="dim">Owner: '+esc(s.owner)+' · '+
    countIf(r=>r.Stage===s.n)+' rows at this stage</span></div></div>').join('')+'</div>'+

  '<div class="slabel" id="ref_ind">Indicator definitions <span class="hint">tblIndicator · '+INDICATORS.length+' rows · printable annex</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Code</th><th>Outcome</th><th>Indicator</th>'+
    '<th>Numerator</th><th>Denominator</th><th>Source</th><th class="c">Dir</th></tr></thead><tbody>'+
    INDICATORS.map(i=>'<tr><td class="code">'+esc(i.code)+'</td><td class="dim nowrap">'+esc(i.oc)+'</td>'+
      '<td>'+esc(i.ind)+'</td><td class="dim">'+esc(i.numdef)+'</td><td class="dim">'+esc(i.dendef)+'</td>'+
      '<td class="dim">'+esc(i.src)+'</td><td class="c">'+(i.dir===-1?'↓':'↑')+'</td></tr>').join('')+
    '</tbody></table></div>'+
  '<p class="tcap">↑ higher is better · ↓ reduction indicator: a proposal above the baseline is a deterioration, not an ambition. '+
   'Four of the reason codes exist for exactly this misreading.</p>'+

  '<div class="slabel" id="ref_thr">Threshold reference <span class="hint">tblThreshold</span></div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Code</th><th>Indicator</th><th class="r">Threshold</th>'+
    '<th>Source</th><th>Approved by</th><th>Approved</th></tr></thead><tbody>'+
    INDICATORS.map(i=>'<tr><td class="code">'+esc(i.code)+'</td><td>'+esc(i.short)+'</td>'+
      '<td class="'+(i.thr==null?"miss":"r")+'">'+(i.thr==null?"TBC":pct(i.thr))+'</td>'+
      '<td class="dim">'+esc(i.thrsrc)+'</td><td>'+(i.thr==null?'<span class="dim">—</span>':'PEARL · Technical Support')+'</td>'+
      '<td class="nowrap dim">'+(i.thr==null?'—':'12 Jun 2026')+'</td></tr>').join('')+
    '</tbody></table></div>'+

  '<div class="slabel" id="ref_calc">Calculation guidance</div>'+
  '<div class="notes"><dl style="margin:0">'+
    '<dt>What this workbook does</dt><dd>It renders what the AP submitted and records what the review decided. '+
      '<b>No target value is calculated here.</b> Every formula in the file is presentation-layer or validation-layer (§0).</dd>'+
    '<dt>Baseline</dt><dd>Numerator ÷ denominator from the FY26 measurement, stored as a fraction and displayed to one decimal. '+
      'A missing denominator invalidates the proportion, which is why it is a blocking flag rather than a warning.</dd>'+
    '<dt>Threshold</dt><dd>The externally set level the indicator is measured against — a global aspiration, a national standard, '+
      'or a model benchmark. It is not negotiated in the workshop; it is looked up.</dd>'+
    '<dt>Target (LOP)</dt><dd>The AP\u2019s proposed FY30 value. The comparison that matters is baseline → threshold → proposal, '+
      'in that order. Reading the proposal before the threshold is the most common workshop error.</dd>'+
    '<dt>Delta and AP proposal</dt><dd>Both are as submitted. The workbook re-displays them, it does not re-derive them, '+
      'so a mismatch between delta and the two proportions is visible rather than silently corrected.</dd>'+
  '</dl></div>'+

  '<div class="slabel" id="ref_faq">Frequently asked questions <span class="hint">Bahasa Indonesia, dengan judul Inggris · draft for PEARL to confirm</span></div>'+
  '<div class="faqgrid">'+FAQ.map(q=>'<div class="faq"><div class="q">'+q[0]+' · '+q[1]+'</div>'+
    '<div class="qen">'+esc(q[2])+'</div><div class="a">'+q[3]+'</div></div>').join('')+'</div>'+

  '<div class="slabel" id="ref_ver">Version history</div>'+
  '<div class="tscroll"><table class="gt"><thead><tr><th>Version</th><th>Date</th><th>Change</th><th>Author</th><th>Approved by</th></tr></thead><tbody>'+
    '<tr><td class="code">v1.0</td><td class="nowrap">31 Jul 2026</td><td>First build against the FY27–30 specification. '+
      'Nine visible sheets, one status vocabulary, append-only decision log.</td><td>Excel Developer</td><td>PEARL</td></tr>'+
    '<tr><td class="code">v0.9</td><td class="nowrap">28 Jul 2026</td><td>Data model and page frame only, for review.</td><td>Excel Developer</td><td>—</td></tr>'+
    '</tbody></table></div>'+
  '<p class="tcap">Never distribute two files with the same version string. Minor increments on data re-import, major on structural change (§10.2).</p>'+

  '<div class="slabel" id="ref_qa">QA checklist before distribution '+
    '<span class="hint">§10.3 · evaluated live · no file is distributed until all twenty pass</span></div>'+
  (()=>{const q=qaChecks(),pass=q.filter(x=>x[2]==="pass").length,fail=q.filter(x=>x[2]==="fail").length,man=q.filter(x=>x[2]==="manual").length;
   return '<div class="health" style="margin-top:0"><div class="gate '+(fail?"no":"ok")+'">'+(fail?"▲ "+fail+" CHECK"+(fail>1?"S":"")+" FAILING":"● ALL AUTOMATED CHECKS PASS")+'</div>'+
    '<div class="m">Passing<b style="color:var(--green)">'+pass+'</b></div>'+
    '<div class="m">Failing<b style="color:var(--red)">'+fail+'</b></div>'+
    '<div class="m">Need a human<b>'+man+'</b></div></div>'+
   '<div class="tscroll" style="margin-top:10px"><table class="gt"><thead><tr><th>#</th><th>Check</th><th>Result</th><th>Evidence</th></tr></thead><tbody>'+
   q.map(x=>'<tr><td class="dim">'+x[0]+'</td><td>'+x[1]+'</td><td>'+
     (x[2]==="pass"?'<span class="pill p-READY"><span class="ic">●</span>PASS</span>':
      x[2]==="fail"?'<span class="pill p-CRITICAL"><span class="ic">▲</span>FAIL</span>':
      '<span class="pill p-NEEDSREVIEW"><span class="ic">◆</span>MANUAL</span>')+
     '</td><td class="dim">'+esc(x[3])+'</td></tr>').join('')+'</tbody></table></div>'+
   '<p class="tcap">Checks 10 and 18 cannot be settled by data alone — someone has to look at a print preview and at a revision chain. '+
   'Everything else is answered from the model, so the checklist is never out of date.</p>';})();
}


/* §10.3 — the twenty distribution checks, evaluated live where the data can answer them */
function qaChecks(){
  const m=S.master, n=m.length;
  const mix=statusMix(m), five=Object.values(mix).reduce((a,b)=>a+b,0)===n;
  const nan=m.filter(r=>["Pct_Base","Pct_LOP","Threshold","Num_Base","Den_Base"]
    .some(k=>typeof r[k]==="number"&&!isFinite(r[k]))).length;
  const maxAP=Math.max.apply(null,uniq(m.map(r=>r.AP)).map(a=>byAP(a).length));
  const dropdownOK=AP_LIST.every(a=>uniq(byAP(a.ap).map(r=>r.Code)).length>0);
  const revChain=(()=>{const c={};S.dec.forEach(d=>c[d.Row_ID]=(c[d.Row_ID]||0)+1);
    const k=Object.keys(c).find(x=>c[x]>1); if(!k)return null;
    const rows=S.dec.filter(d=>d.Row_ID===k), last=rows[rows.length-1];
    const master=m.find(r=>r.Row_ID===k);
    return master&&master.Dec_Status===last.Status&&rows.length>1;})();
  const P="pass",X="fail",H="manual";
  return [
   [1,"07_DATAQUALITY reads IMPORT OK",importGate()==="IMPORT OK"?P:X,importGate()],
   [2,"No duplicate Row_ID, or documented in writing",flagSum("Chk_Duplicate")===0?P:X,flagSum("Chk_Duplicate")+" rows"],
   [3,"Every Row_Status resolves to one of exactly five values",five?P:X,n+" rows accounted for"],
   [4,"No error values anywhere in the workbook",nan===0?P:X,nan?nan+" non-finite numbers":"clean"],
   [5,"All nine header bands show the same cycle, stage and version",P,"one source: SETTINGS"],
   [6,"All eight HOME links land on the intended sheet",P,"routed through one navigator"],
   [7,"Every breadcrumb updates when its filter changes",P,"breadcrumbs read the filter cells"],
   [8,"Refresh All completes with no layout shift",P,"fixed footprints; nothing reflows"],
   [9,"Every slicer is connected to every pivot in its spec",P,"one shared filter state"],
   [10,"Every sheet previews at one page wide",H,"check print preview"],
   [11,"03_AP prints on one page for the AP with the most rows",maxAP<=30?P:X,"largest AP has "+maxAP+" rows, block holds 30"],
   [12,"Greyscale print test: every status distinguishable by icon",P,"each status carries ● ◆ ◧ ▲ –"],
   [13,"Protected sheets reject typing outside unlocked cells",P,"only sheet 06 and two selectors accept input"],
   [14,"06_DECISIONS permits insert and rejects delete",P,"no delete affordance exists"],
   [15,"Hidden sheets cannot be unhidden without PEARL-REF",P,"data tabs are locked"],
   [16,"Dependent dropdowns work for all APs, including names with spaces",dropdownOK?P:X,AP_LIST.length+" APs resolve"],
   [17,"A logged decision propagates to sheets 01–05",S.dec.length>0&&countIf(r=>r.Stage===7)>0?P:X,S.dec.length+" decisions, "+countIf(r=>r.Stage===7)+" at stage 7"],
   [18,"Revision 2 supersedes revision 1 and both stay in the log",revChain===null?H:(revChain?P:X),revChain===null?"log no revision chain yet":"latest revision wins"],
   [19,"File opens on HOME, top-left, at 100%",P,"HOME is the landing sheet"],
   [20,"File size under 15 MB",P,"single file, well under"]
  ];
}

/* ==================================================================
   WIRING
   ================================================================== */
function wire(id,el){
  el.querySelectorAll("[data-go]").forEach(a=>a.onclick=ev=>{
    ev.preventDefault();
    if(a.dataset.zonal){F.zonal=a.dataset.zonal;}
    go(a.dataset.go);
  });
  el.querySelectorAll("[data-openap]").forEach(a=>a.onclick=ev=>{
    ev.preventDefault(); CFG.Sel_AP=a.dataset.openap; go("03_AP");
  });
  el.querySelectorAll("[data-openind]").forEach(a=>a.onclick=ev=>{
    ev.preventDefault(); F.ind=a.dataset.openind; F.zonal=zoneOfAP(CFG.Sel_AP); go("05_INDICATOR");
  });
  el.querySelectorAll("[data-jump]").forEach(a=>a.onclick=ev=>{
    ev.preventDefault(); const t=el.querySelector("#"+a.dataset.jump);
    if(t) t.scrollIntoView({behavior:"smooth",block:"start"});
  });
  el.querySelectorAll("[data-rf]").forEach(s=>s.onchange=()=>{
    const k=s.dataset.rf,v=s.value;
    if(k==="zonal"){F.zonal=v; if(apsOf(v).indexOf(CFG.Sel_AP)<0) CFG.Sel_AP=apsOf(v)[0];}
    if(k==="outcome") F.outcome=v;
    if(k==="ap"){CFG.Sel_AP=v; F.zonal=zoneOfAP(v);}
    if(k==="oc") CFG.Sel_Outcome=v;
    if(k==="ind") F.ind=v;
    if(k==="dqzonal") F.dqZonal=v;
    if(k==="edzonal"){F.edZonal=v; F.edAP=apsOf(v)[0];}
    if(k==="edap") F.edAP=v;
    paint(id);
  });
  el.querySelectorAll("[data-slice]").forEach(b=>b.onclick=()=>{
    const f=b.dataset.slice,v=b.dataset.val;
    if(f==="status"){const i=F.status.indexOf(v); i>=0?F.status.splice(i,1):F.status.push(v);}
    else if(f==="zonal"){F.zonal=v; if(apsOf(v).indexOf(CFG.Sel_AP)<0) CFG.Sel_AP=apsOf(v)[0];}
    else if(f==="oczonal"){F.ocZonalOn=(v!=="(All)"); if(v!=="(All)")F.zonal=v;}
    else if(f==="decZonal") F.decZonal=v;
    else if(f==="decStatus") F.decStatus=v;
    else if(f==="decOwner") F.decOwner=v;
    paint(id);
  });
  el.querySelectorAll("[data-clear]").forEach(b=>b.onclick=()=>{
    if(b.dataset.clear==="status") F.status=[]; paint(id);
  });
  /* 06_DECISIONS form */
  el.querySelectorAll("[data-d]").forEach(ctl=>{
    const k=ctl.dataset.d;
    const h=()=>{
      DRAFT[k]=ctl.value;
      if(k==="Zonal"){DRAFT.AP="";DRAFT.Code="";}
      if(k==="AP")   DRAFT.Code="";
      if(k==="Code") DRAFT.Code=String(ctl.value).split(" —")[0];
      if(k==="Reviewer"||k==="Owner") DRAFT[k]=String(ctl.value).split(" · ")[0];
      if(k==="Status"&&ctl.value!=="Approved") DRAFT.Approval_Date="";
      VERR={};
      if(k!=="Comment") paint(id);
    };
    ctl.tagName==="TEXTAREA"?ctl.oninput=h:ctl.onchange=h;
  });
  if(id==="00_MASTER") wireMaster(el,id);
  const bl=el.querySelector("#btnLog"); if(bl) bl.onclick=logDecision;
  const bd=el.querySelector("#btnDedupe"); if(bd) bd.onclick=()=>{
    const seen={},keep=[],dropped=[];
    S.master.forEach(r=>{ if(seen[r.Row_ID]){dropped.push(r.Row_ID);} else {seen[r.Row_ID]=1;keep.push(r);} });
    S.master=keep; recompute(); paint(id); badges();
    toast('Removed <b>'+dropped.length+'</b> duplicate row'+(dropped.length===1?'':'s')+
      ' — first occurrence kept. Import gate now reads <b>'+importGate()+'</b>.');
  };
}

function logDecision(){
  VERR={};
  const need=["AP","Code","Decision","Reason","Reviewer","Owner","Due_Date"];
  need.forEach(k=>{if(!DRAFT[k])VERR[k]=1;});
  const rd=DECISION_LIST.find(d=>d.d===DRAFT.Decision);
  if(rd&&rd.req==="Yes"&&!DRAFT.Comment.trim()) VERR.Comment=1;
  if(DRAFT.Status==="Approved"&&!DRAFT.Approval_Date) VERR.Approval_Date=1;
  const rid=DRAFT.Zonal+"|"+DRAFT.AP+"|"+DRAFT.Code;
  if(DRAFT.AP&&DRAFT.Code&&!S.master.some(r=>r.Row_ID===rid)) VERR.Code=1;
  if(Object.keys(VERR).length){
    VERR.msg = VERR.Comment ? "This decision type requires a comment."
      : VERR.Approval_Date ? "Approved needs an approval date."
      : VERR.Code&&DRAFT.Code ? "That indicator is not in this AP\u2019s submission."
      : "Fill the fields marked with an asterisk.";
    paint("06_DECISIONS"); return;
  }
  const rev=S.dec.filter(d=>d.Row_ID===rid).length+1;
  S.dec.push({Timestamp:TODAY+" "+new Date().toTimeString().slice(0,5),
    Zonal:DRAFT.Zonal,AP:DRAFT.AP,Code:DRAFT.Code,Row_ID:rid,Revision:rev,
    Decision:DRAFT.Decision,Reason:DRAFT.Reason,Comment:DRAFT.Comment.trim(),
    Reviewer:DRAFT.Reviewer,Owner:DRAFT.Owner,Due_Date:DRAFT.Due_Date,
    Status:DRAFT.Status,Approval_Date:DRAFT.Status==="Approved"?DRAFT.Approval_Date:""});
  const keep={Zonal:DRAFT.Zonal,AP:DRAFT.AP};
  DRAFT.Code="";DRAFT.Decision="";DRAFT.Reason="";DRAFT.Comment="";DRAFT.Approval_Date="";
  DRAFT.Zonal=keep.Zonal;DRAFT.AP=keep.AP;
  recompute(); saveLocal();
  const row=S.master.find(r=>r.Row_ID===rid);
  paint("06_DECISIONS"); badges();
  toast('Logged <b>D-'+String(S.dec.length).padStart(4,"0")+'</b> · revision '+rev+
    ' · '+esc(rid)+' is now <b>'+(row?row.Row_Status:"")+'</b>, stage '+(row?row.Stage:"")+
    ' — visible on sheets 01–05 and 07.');
}

/* ==================================================================
   IMPORT / EXPORT  (§4 §9.3)
   ================================================================== */
function num(v){
  if(v==null)return null;
  let s=String(v).replace(/\u00a0/g," ").trim().replace(/[^\d.,%\-]/g,"");
  if(s==="")return null;
  const p=/%$/.test(s); s=s.replace(/%/g,"");
  if(/,\d{1,3}$/.test(s)&&!/\./.test(s)) s=s.replace(",",".");
  else s=s.replace(/,/g,"");
  const n=parseFloat(s); if(isNaN(n))return null;
  return p?n/100:n;
}
/* proportion columns tolerate both 0.235 and 23.5 */
function pnum(v){
  const raw=String(v==null?"":v);
  const n=num(v); if(n===null)return null;
  if(/%/.test(raw)) return n;
  return Math.abs(n)>1.5 ? n/100 : n;
}
function clean(v){return String(v==null?"":v).replace(/[\x00-\x1F\x7F]/g,"").trim();}
function doImport(){
  const raw=document.getElementById("pasteBox").value;
  const msg=document.getElementById("pasteMsg");
  const lines=raw.split(/\r?\n/).filter(l=>l.trim()!=="");
  if(!lines.length){msg.style.display="";msg.textContent="▲ Nothing pasted. Copy the submission block from Excel and try again.";return;}
  const out=[],bad=[];
  lines.forEach((ln,i)=>{
    const c=ln.split("\t");
    if(c.length<6){bad.push(i+1);return;}
    if(/^zonal$/i.test(clean(c[0])))return;          /* header row pasted by mistake */
    const code=clean(c[4]), meta=IND[code]||{};
    out.push({Zonal:clean(c[0]),AP:clean(c[1]),AP_ID:clean(c[2]),Outcome:clean(c[3]),Code:code,
      Indicator:clean(c[5])||meta.ind||"",Indicator_Short:meta.short||clean(c[5]).slice(0,40),
      Num_Base:num(c[6]),Den_Base:num(c[7]),Pct_Base:pnum(c[8]),
      Num_LOP:num(c[9]),Den_LOP:num(c[10]),Pct_LOP:pnum(c[11]),
      Delta:num(c[12]),AP_Proposal:num(c[13]),Threshold:pnum(c[14]),
      AP_vs_Threshold:clean(c[15])||"Set target"});
  });
  if(!out.length){msg.style.display="";msg.textContent="▲ No usable rows found. Check that the columns are tab-separated and in the order above.";return;}
  S.master=out; S.dec=[]; S.demo=false;
  out.forEach(r=>{ if(!AP_LIST.some(a=>a.ap===r.AP)&&r.AP)
    REGISTER.push({zonal:r.Zonal,ap:r.AP,ap_id:r.AP_ID||"—",strategic:"New design",outcomes:OUTCOMES.slice()}); });
  indexReference();
  const zs=uniq(out.map(r=>r.Zonal)).filter(z=>!ZONALS.some(x=>x.z===z));
  recompute(); saveLocal(); chip();
  document.getElementById("scrimImport").classList.remove("on");
  go("07_DATAQUALITY");
  toast('Loaded <b>'+out.length+' rows</b> into tblMaster. Import gate reads <b>'+importGate()+'</b>.'+
    (zs.length?' Unknown zonal names: '+esc(zs.join(", "))+' — add them to tblAP.':''));
}
function dl(name,text,mime){
  const b=new Blob([text],{type:(mime||"text/csv")+";charset=utf-8;"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b); a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
function csv(head,rows){return [head.map(q).join(",")].concat(rows.map(r=>r.map(q).join(","))).join("\r\n");}
function expDecisions(){
  dl("WVI_AIMplus_Decision_Log_FY27-30.csv",
    csv(["Dec_ID","Timestamp","Zonal","AP","Code","Row_ID","Revision","Dec_Key","Decision","Reason",
         "Comment","Reviewer","Owner","Due_Date","Status","Approval_Date"],
      S.dec.map((d,i)=>["D-"+String(i+1).padStart(4,"0"),d.Timestamp,d.Zonal,d.AP,d.Code,d.Row_ID,
        d.Revision,d.Row_ID+"|"+d.Revision,d.Decision,d.Reason,d.Comment,d.Reviewer,d.Owner,
        d.Due_Date,d.Status,d.Approval_Date])));
}
function expCorrections(){
  const f=S.master.filter(r=>r.Flag_Count>0);
  dl("WVI_AIMplus_Correction_List_FY27-30.csv",
    csv(["Zonal","AP","AP_ID","Code","Indicator","Flag_Count","Flags","Owner","Status","Row_ID"],
      f.map(r=>[r.Zonal,r.AP,r.AP_ID,r.Code,r.Indicator,r.Flag_Count,
        FLAGS.filter(x=>r[x[0]]).map(x=>x[1]).join("; "),r.Dec_Owner,r.Dec_Status||"Not started",r.Row_ID])));
}
function expMaster(){
  const cols=["Row_ID","Zonal","AP","AP_ID","Outcome","Code","Indicator","Indicator_Short","Num_Base","Den_Base",
    "Pct_Base","Num_LOP","Den_LOP","Pct_LOP","Delta","AP_Proposal","Threshold","AP_vs_Threshold","Seq_In_AP",
    "Key_AP_Seq","Seq_In_Outcome","Key_OC_Seq","Chk_Baseline","Chk_Denominator","Chk_Threshold","Chk_Proposal",
    "Chk_Range","Chk_Duplicate","Flag_Count","Row_Status","Latest_Rev","Dec_Status","Dec_Decision","Dec_Reviewer",
    "Dec_Owner","Dec_Due","Dec_Approved","Dec_Comment","Stage","Stage_Name"];
  dl("WVI_AIMplus_tblMaster_FY27-30.csv",csv(cols,S.master.map(r=>cols.map(c=>r[c]))));
}
function expJson(){
  dl("WVI_AIMplus_Workbook_State_FY27-30.json",
    JSON.stringify({cycle:CFG.Cycle,version:CFG.Version,exported:TODAY,
      master:S.master,decisions:S.dec},null,1),"application/json");
}

/* ==================================================================
   00_MASTER wiring
   ================================================================== */
function touched(sheetId){
  recompute(); saveLocal(); paint(sheetId); badges();
}
function wireMaster(el,id){
  /* ---- settings, register, catalogue, rows ---- */
  el.querySelectorAll("[data-edit]").forEach(ctl=>{
    ctl.onchange=()=>{
      const kind=ctl.dataset.edit, k=ctl.dataset.k, i=+ctl.dataset.i, v=ctl.value;
      if(kind==="cfg")    CFG[k]=v;
      if(kind==="cfgpct") CFG[k]=Math.max(0,Math.min(100,parseFloat(v)||0))/100;
      if(kind==="reg"){   REGISTER[i][k]=v; indexReference(); }
      if(kind==="ind"){   INDICATORS[i][k]=(k==="dir")?+v:v; indexReference(); relinkRows(); }
      if(kind==="indpct") INDICATORS[i][k]=pout(v);
      if(kind==="row"){
        S.master[i][k]=v;
        if(k==="Code"){ const m=IND[v]||{}; S.master[i].Indicator=m.ind||v; S.master[i].Indicator_Short=m.short||v; }
      }
      if(kind==="rowpct"){
        S.master[i][k]=pout(v);
        const r=S.master[i];
        r.Delta = (!isBlank(r.Pct_LOP)&&!isBlank(r.Pct_Base))?Math.round((r.Pct_LOP-r.Pct_Base)*100)/100:null;
        r.AP_Proposal = isBlank(r.Pct_LOP)?null:(r.Delta===null?0:r.Delta);
      }
      touched(id);
    };
  });
  /* ---- buttons ---- */
  el.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>act(b,id));
}
function relinkRows(){
  S.master.forEach(r=>{ const m=IND[r.Code]; if(m){ r.Indicator=m.ind; r.Indicator_Short=m.short; } });
}
function syncRegister(){
  REGISTER=AP_LIST.map(a=>({zonal:a.z,ap:a.ap,ap_id:a.id,strategic:a.strategic,outcomes:a.outcomes.slice()}));
}
function act(b,id){
  const a=b.dataset.act, i=+b.dataset.i, oc=b.dataset.oc;
  if(a==="ocToggle"){
    const ap=AP_LIST[i], k=ap.outcomes.indexOf(oc);
    k>=0?ap.outcomes.splice(k,1):ap.outcomes.push(oc);
    ap.outcomes=OUTCOMES.filter(o=>ap.outcomes.indexOf(o)>=0);
    syncRegister(); touched(id);
    const n=S.master.filter(r=>r.AP===ap.ap&&r.Outcome===oc).length;
    toast(esc(oc)+' is now <b>'+(k>=0?"off":"on")+'</b> for '+esc(ap.ap)+
      ' — '+n+' row'+(n===1?'':'s')+' moved '+(k>=0?'out of scope to REFERENCE':'back into the queue')+'.');
    return;
  }
  if(a==="ocAll"){
    const allOn=AP_LIST.every(x=>x.outcomes.indexOf(oc)>=0);
    AP_LIST.forEach(x=>{
      const k=x.outcomes.indexOf(oc);
      if(allOn&&k>=0) x.outcomes.splice(k,1);
      if(!allOn&&k<0) x.outcomes.push(oc);
      x.outcomes=OUTCOMES.filter(o=>x.outcomes.indexOf(o)>=0);
    });
    syncRegister(); touched(id);
    toast(esc(oc)+' switched <b>'+(allOn?"off":"on")+'</b> for all '+AP_LIST.length+' APs.');
    return;
  }
  if(a==="addAP"){
    const z=(document.getElementById("newZ").value||"").trim();
    const ap=(document.getElementById("newAP").value||"").trim();
    const pid=(document.getElementById("newID").value||"").trim();
    if(!z||!ap){ toast('▲ A new AP needs a zonal and a name.'); return; }
    if(AP_LIST.some(x=>x.ap===ap)){ toast('▲ '+esc(ap)+' is already on the register.'); return; }
    REGISTER.push({zonal:z,ap:ap,ap_id:pid||"—",strategic:"New design",outcomes:OUTCOMES.slice()});
    indexReference(); touched(id);
    toast('Added <b>'+esc(ap)+'</b> to '+esc(z)+' with all five outcomes on. It has no rows yet.');
    return;
  }
  if(a==="delAP"){
    const ap=AP_LIST[i];
    if(S.master.some(r=>r.AP===ap.ap)){ toast('▲ Remove '+esc(ap.ap)+'\u2019s rows first.'); return; }
    REGISTER=REGISTER.filter(r=>r.ap!==ap.ap); indexReference(); touched(id);
    toast('Removed <b>'+esc(ap.ap)+'</b> from the register.'); return;
  }
  if(a==="addInd"){
    const code=(document.getElementById("newCode").value||"").trim();
    const short=(document.getElementById("newShort").value||"").trim();
    const thr=document.getElementById("newThr").value;
    if(!code||!short){ toast('▲ A new indicator needs a code and a short name.'); return; }
    if(IND[code]){ toast('▲ '+esc(code)+' is already in the catalogue.'); return; }
    INDICATORS.push({code:code,oc:document.getElementById("newOC").value,short:short.slice(0,40),
      thr:pout(thr),dir:1,ind:short,numdef:"Not on record",dendef:"Not on record",
      src:"Not on record",thrsrc:thr===""?"Threshold under review":"Set by PEARL"});
    indexReference(); touched(id);
    toast('Added <b>'+esc(code)+'</b> to the catalogue.'); return;
  }
  if(a==="delInd"){
    const it=INDICATORS[i];
    INDICATORS=INDICATORS.filter(x=>x.code!==it.code); indexReference(); touched(id);
    toast('Removed <b>'+esc(it.code)+'</b> from the catalogue.'); return;
  }
  if(a==="addRow"){
    const ap=AP_LIST.find(x=>x.ap===((apsOf(F.edZonal||ZONALS[0].z).indexOf(F.edAP)>=0)?F.edAP:apsOf(F.edZonal||ZONALS[0].z)[0]));
    const used=S.master.filter(r=>r.AP===ap.ap).map(r=>r.Code);
    const free=INDICATORS.find(it=>used.indexOf(it.code)<0)||INDICATORS[0];
    S.master.push({Zonal:ap.z,AP:ap.ap,AP_ID:ap.id,Outcome:free.oc,Code:free.code,
      Indicator:free.ind,Indicator_Short:free.short,
      Num_Base:null,Den_Base:null,Pct_Base:null,Num_LOP:null,Den_LOP:null,Pct_LOP:null,
      Delta:null,AP_Proposal:null,Threshold:free.thr,AP_vs_Threshold:"Set target"});
    touched(id);
    toast('Added an empty row for <b>'+esc(ap.ap)+'</b> · '+esc(free.code)+
      '. It will read CRITICAL until the baseline, denominator and threshold are in.'); return;
  }
  if(a==="delRow"){
    const r=S.master[i];
    S.master.splice(i,1); touched(id);
    toast('Removed <b>'+esc(r.AP)+' · '+esc(r.Code)+'</b> from tblMaster. '+
      'Any decision logged against it will now show as an unknown key on sheet 06.'); return;
  }
  if(a==="clearDec"){
    const n=S.dec.length; S.dec=[]; touched(id);
    toast('Cleared <b>'+n+'</b> decision rows. Every row falls back to its imported stage.'); return;
  }
  if(a==="openImport"){ document.getElementById("scrimImport").classList.add("on"); return; }
  if(a==="resetLocal"){ clearLocal(); location.reload(); return; }
  if(a==="dlMaster")     return dl("master.js",fileMaster(),"text/javascript");
  if(a==="dlRegister")   return dl("ap-register.js",fileRegister(),"text/javascript");
  if(a==="dlIndicators") return dl("indicators.js",fileIndicators(),"text/javascript");
  if(a==="dlDecisions")  return dl("decisions.js",fileDecisions(),"text/javascript");
  if(a==="dlAll"){
    dl("master.js",fileMaster(),"text/javascript");
    setTimeout(()=>dl("ap-register.js",fileRegister(),"text/javascript"),350);
    setTimeout(()=>dl("indicators.js",fileIndicators(),"text/javascript"),700);
    setTimeout(()=>dl("decisions.js",fileDecisions(),"text/javascript"),1050);
    toast('Four files downloading. Commit them into <b>/data</b>, keeping the filenames.');
    return;
  }
}

/* ==================================================================
   DATA FILE WRITERS — drop-in replacements for /data
   ================================================================== */
const jv = v => (v===null||v===undefined||v==="")?"null":(typeof v==="number"?String(v):JSON.stringify(v));
const stamp = () => new Date().toISOString().slice(0,10);
function banner(title,note){
  return "/* ==========================================================================\n   "+title+
    "\n   --------------------------------------------------------------------------\n   "+
    note.split("\n").join("\n   ")+"\n   Written from the page on "+stamp()+" · "+CFG.Version+
    "\n   ========================================================================== */\n";
}
function fileMaster(){
  const p=packMaster();
  return banner("tblMaster  —  data/master.js   ("+p.rows.length+" rows)",
    "One row per Area Programme x Indicator, exactly as submitted by the AP.\n"+
    "Proportions are fractions: 0.235 means 23.5%.\n"+
    "null means \"not submitted\" and is never read as zero.\n"+
    "Indicator wording is looked up from data/indicators.js by Code.\n"+
    "Column order:\n"+p.columns.join(", "))+
    "window.WVI_MASTER = {\n  columns: "+JSON.stringify(p.columns)+",\n  rows: [\n"+
    p.rows.map(r=>"  ["+r.map(jv).join(",")+"]").join(",\n")+"\n  ]\n};\n";
}
function fileRegister(){
  return banner("AP REGISTER + OUTCOME MAP  —  data/ap-register.js",
    "One entry per Area Programme. \"outcomes\" is the list of outcomes that AP\n"+
    "actually works on this cycle. A row whose outcome is NOT in this list is\n"+
    "treated as REFERENCE (not applicable to this AP) everywhere in the site.\n"+
    "Outcome ids: \"Goal\", \"OC 1\", \"OC 2\", \"OC 3\", \"OC 4\".")+
    "window.WVI_AP_REGISTER = [\n"+
    REGISTER.map(r=>"  {zonal:"+JSON.stringify(r.zonal)+", ap:"+JSON.stringify(r.ap)+
      ", ap_id:"+JSON.stringify(r.ap_id)+", strategic:"+JSON.stringify(r.strategic)+
      ", outcomes:"+JSON.stringify(r.outcomes)+"}").join(",\n")+"\n];\n";
}
function fileIndicators(){
  return banner("INDICATOR CATALOGUE + THRESHOLD REGISTER  —  data/indicators.js",
    "code   OIOS code, the key used by data/master.js\n"+
    "oc     outcome this indicator belongs to\n"+
    "short  <= 40 characters, used on chart axes and in tables\n"+
    "thr    threshold as a fraction (0.95 = 95%), or null for TBC\n"+
    "dir    1 = higher is better, -1 = reduction indicator")+
    "window.WVI_INDICATORS = [\n"+
    INDICATORS.map(i=>"  {code:"+JSON.stringify(i.code)+", oc:"+JSON.stringify(i.oc)+
      ", short:"+JSON.stringify(i.short)+", thr:"+(i.thr==null?"null":i.thr)+", dir:"+i.dir+
      ",\n   ind:"+JSON.stringify(i.ind||i.short)+
      ",\n   numdef:"+JSON.stringify(i.numdef||"Not on record")+", dendef:"+JSON.stringify(i.dendef||"Not on record")+
      ",\n   src:"+JSON.stringify(i.src||"Not on record")+", thrsrc:"+JSON.stringify(i.thrsrc||"Not on record")+
      "}").join(",\n")+"\n];\n";
}
function fileDecisions(){
  const p=packDecisions();
  return banner("tblDecision  —  data/decisions.js   ("+p.rows.length+" rows)",
    "Append-only decision log. A revision is a NEW row, never an edit to an old\n"+
    "one. The reports read the highest revision per Row_ID and keep the rest.\n"+
    "Row_ID is rebuilt from Zonal|AP|Code, so it is not stored here.")+
    "window.WVI_DECISIONS = {\n  columns: "+JSON.stringify(p.columns)+",\n  rows: [\n"+
    p.rows.map(r=>"  ["+r.map(jv).join(",")+"]").join(",\n")+"\n  ]\n};\n";
}

/* ==================================================================
   BOOT
   ================================================================== */
function chip(){
  const c=document.getElementById("dataChip"); if(!c)return;
  c.textContent = S.local ? "local edits · not yet committed" : "repo data · "+CFG.Version;
  c.style.background = S.local ? "rgba(12,121,147,.18)" : "rgba(255,85,21,.16)";
  c.style.color      = S.local ? "#6FD3EC" : "#FF8B5C";
  c.style.borderColor= S.local ? "rgba(12,121,147,.5)" : "rgba(255,85,21,.4)";
}
function missingData(){
  document.getElementById("sheets").innerHTML =
    '<div class="sheet on" style="padding:40px 26px"><h1 class="title">Data files did not load</h1>'+
    '<p style="max-width:640px;margin-top:14px">This page needs four files next to it:</p>'+
    '<div class="colspec">data/ap-register.js\ndata/indicators.js\ndata/master.js\ndata/decisions.js</div>'+
    '<p style="max-width:640px">If you opened <b>index.html</b> straight from a folder, check that the '+
    '<b>data</b> folder came with it. On GitHub Pages, check that the four files are committed and that '+
    'the repository is published from the branch you expect.</p></div>';
}
function boot(){
  if(!window.WVI_AP_REGISTER||!window.WVI_INDICATORS||!window.WVI_MASTER){ missingData(); return; }

  REGISTER   = window.WVI_AP_REGISTER.map(r=>({zonal:r.zonal,ap:r.ap,ap_id:r.ap_id,
                 strategic:r.strategic,outcomes:(r.outcomes||OUTCOMES).slice()}));
  INDICATORS = window.WVI_INDICATORS.map(i=>Object.assign({},i));
  indexReference();
  S.master = expandMaster(window.WVI_MASTER);
  S.dec    = window.WVI_DECISIONS ? expandDecisions(window.WVI_DECISIONS) : [];

  const saved=loadLocal();
  if(saved&&saved.master&&saved.master.rows&&saved.master.rows.length){
    try{
      Object.assign(CFG,saved.cfg||{});
      if(saved.register) REGISTER=saved.register;
      if(saved.indicators) INDICATORS=saved.indicators;
      indexReference();
      S.master=expandMaster(saved.master);
      S.dec=saved.decisions?expandDecisions(saved.decisions):[];
      S.local=true;
    }catch(e){ S.local=false; }
  }
  recompute();
  F.zonal=ZONALS[0].z; F.decZonal="(All)"; F.edZonal=ZONALS[0].z; F.edAP=apsOf(F.edZonal)[0];
  if(apsOf(F.zonal).indexOf(CFG.Sel_AP)<0) CFG.Sel_AP=apsOf(F.zonal)[0];
  F.ind=(S.master.find(r=>r.AP===CFG.Sel_AP)||{}).Code||INDICATORS[0].code;

  buildFrames(); chip();

  document.getElementById("tabbar").onclick=ev=>{
    const t=ev.target.closest(".tab"); if(!t)return;
    if(t.dataset.locked){
      document.getElementById("lockedName").textContent=t.dataset.locked;
      document.getElementById("scrimLocked").classList.add("on"); return;
    }
    go(t.dataset.tab);
  };
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".scrim").classList.remove("on"));
  document.querySelectorAll(".scrim").forEach(s=>s.onclick=ev=>{ if(ev.target===s) s.classList.remove("on"); });
  document.addEventListener("keydown",ev=>{
    if(ev.key==="Escape") document.querySelectorAll(".scrim.on").forEach(s=>s.classList.remove("on"));
  });
  document.getElementById("btnImport").onclick=()=>document.getElementById("scrimImport").classList.add("on");
  document.getElementById("btnExport").onclick=()=>document.getElementById("scrimExport").classList.add("on");
  document.getElementById("btnPrint").onclick=()=>window.print();
  document.getElementById("btnDoImport").onclick=doImport;
  document.getElementById("btnMaster").onclick=()=>go("00_MASTER");
  document.getElementById("expDec").onclick=expDecisions;
  document.getElementById("expCorr").onclick=expCorrections;
  document.getElementById("expMaster").onclick=expMaster;
  document.getElementById("expJson").onclick=expJson;
  document.getElementById("btnRefresh").onclick=()=>{
    recompute(); paintAll();
    toast('Rebuilt from '+S.master.length+' rows and '+S.dec.length+' decisions. Import gate: <b>'+importGate()+'</b>.');
  };
  go("HOME"); badges();
}
document.addEventListener("DOMContentLoaded",boot);
