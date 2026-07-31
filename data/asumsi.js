/* ==========================================================================
   tblAsumsi  —  data/asumsi.js
   --------------------------------------------------------------------------
   Arah dan Target Delta per indikator. Yang TIDAK terdaftar di sini dianggap
   Arah = Naik dengan Target Delta = target_delta_default.
   Nama indikator harus PERSIS sama dengan kolom Indicator di indicators.js.
   ========================================================================== */
window.WVI_ASUMSI = {
  target_delta_default: 0.1,
  rows: [
  {ind:"OIOS 160: Prevalence of underweight in children under five years of age", arah:"Turun", delta:-0.12},
  {ind:"Proportion of adolescent who married", arah:"Turun", delta:-0.1},
  {ind:"Proportion of adolescent who report L1 having experienced physical violence and /or psychological agression by parent / caregiver in the past 12 months", arah:"Turun", delta:-0.1}
  ]
};
