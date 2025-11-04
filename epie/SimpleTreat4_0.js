var math = require('mathjs');
var fs = require('fs');
// testing code
/*
let chemIdx = 0;
let filepath = "C:/Users/Selwyn Hoeks/Documents/GitHub/epie_gui_v2/resources/tmp_data/API_run.csv";
let out = SimpleTreat4_0(filepath,chemIdx)
console.log(out);
*/

/* eslint-disable */
export default function SimpleTreat4_0(filepath,chemIdx) {

  console.log(`filepath: ${filepath}`);
  console.log(`chem_idx: ${chemIdx}`);
  
  // Simple CSV loader assuming semicolon delimiter and header
  function loadCSV(file) {
      const data = fs.readFileSync(file, 'utf-8');
      const [headerLine, ...lines] = data.trim().split('\n');
      const headers = headerLine.split(';');
    
      return lines.map(line => {
        const parts = line.split(';');
        return headers.reduce((obj, h, i) => {
          const raw = parts[i];
          if (raw === 'NA' || raw === '') {
            obj[h] = null;
          } else {
            const num = parseFloat(raw);
            obj[h] = isNaN(num) ? raw : num;
          }
          return obj;
        }, {});
      });
  }
  
  // === Load chemical data ===
  let chem = loadCSV(filepath);
  let entry = chem[chemIdx];
  console.log(entry);
  
  // === Extract chemical properties ===
  let chemClass = entry.class;
  let MW0 = entry["MW"];
  let KOW_n = entry["KOW_n"];
  let Pv = entry["Pv"];
  let S0 = entry["S"];
  let pKa = entry["pKa"];
  let Kp_ps = entry["Kp_ps_n"];
  let Kp_as = entry["Kp_as_n"];
  let kbioW = entry["k_bio_wwtp"];
  let kbioWn = entry["k_bio_wwtp_n"];
  
  let k_bio_WWTP = kbioW != null ? kbioW : kbioWn;
  
  
  // === Defaults & Constants ===
  const E_rate = 100, Inh = 5000, Wind = 5.0, T_air = 285;
  const S_flow = 0.2, M_flow_rs = 0.09, BOD_rs = 60, f_BOD_ss = 0.5417, f_ss_rem = 2/3;
  const SLR = 0.1, aeration = 's', pH_WWTP = 7;
  
  // === Helper Functions ===
  const ifelse = (condition, v1, v2) => condition ? v1 : v2;
  
  //---------------------------------------------------------------------------------------------------
  // === Core Calculations ===
  let MW = MW0 / 1000;                              // kg/mol
  let S = S0 / MW / 1000;                           // solubility mol/m³
  let fn = chemClass === 'acid'
    ? 1/(1 + 10**(pH_WWTP - pKa))
    : chemClass === 'base'
      ? 1/(1 + 10**(pKa - pH_WWTP))
      : 1;
  let H = Pv / S * fn;
  console.log(`H: ${H}`);
  console.log(`fn: ${fn}`);
  
  // Raw sewage metrics
  const dens_rs = 1.5;
  const C_ss_rs = M_flow_rs / S_flow;
  const C_tot_rs = 1000 * E_rate / (S_flow * Inh);
  const C_diss_rs = C_tot_rs / (1 + Kp_ps * C_ss_rs / 1000);
  const C_solids_rs = Kp_ps * C_diss_rs;
  
  // Primary sedimentation
  const depth_PS = 4, HRT_PS = 2;
  const V_PS = S_flow * HRT_PS / 24;
  const A_PS = V_PS / depth_PS;
  const C_ss_PS = C_ss_rs * (1 - f_ss_rem);
  const dens_PS = 1.5;
  
  // Aerator definitions — 9-box & 6-box
  const depth_ae = 3, oxygen_C = 0.002, C_as = 4, rate_ae = 0.0000131, dens_as = 1.3;
  const oxygen_req_9b = (BOD_rs/1000) * (1 - (f_BOD_ss * f_ss_rem)) / S_flow;
  const V_ae_9b = S_flow * oxygen_req_9b / (SLR * C_as);
  const HRT_ae_9b = V_ae_9b / S_flow * 24;
  const A_ae_9b = V_ae_9b / depth_ae;
  
  const oxygen_req_6b = (BOD_rs/1000) / S_flow;
  const V_ae_6b = S_flow * oxygen_req_6b / (SLR * C_as);
  const HRT_ae_6b = V_ae_6b / S_flow * 24;
  const A_ae_6b = V_ae_6b / depth_ae;
  
  // Solids liquid separation
  const depth_SLS = 3, HRT_SLS = 6;
  const V_SLS = S_flow * HRT_SLS / 24;
  const A_SLS = V_SLS / depth_SLS;
  const C_ss_SLS = 0.0075, dens_SLS = 1.3;
  
  // Sludge & retention metrics
  const f_BOD_rem = 0.818 - 0.0422 * Math.log(SLR);
  const Y_BOD = 0.947 + 0.0739 * Math.log(SLR);
  const Surplus_sludge_9b = S_flow * (oxygen_req_9b * f_BOD_rem * Y_BOD - C_ss_SLS);
  const Surplus_sludge_6b = S_flow * (oxygen_req_6b * f_BOD_rem * Y_BOD - C_ss_SLS);
  
  const H_air = 10;
  const A_WWTP_9b = A_PS + A_ae_9b + A_SLS;
  const A_WWTP_6b = A_ae_6b + A_SLS;
  
  // --- Advective transport calculations (m3/s)
  let adv_9b = Array.from({ length: 10 }, () => Array(10).fill(0));
  adv_9b[0][1] = Math.sqrt(A_WWTP_9b * Inh) * H_air * Wind;
  adv_9b[1][0] = adv_9b[0][1];
  adv_9b[0][2] = S_flow * Inh / 24 / 3600;
  adv_9b[2][5] = adv_9b[0][2];
  adv_9b[0][3] = M_flow_rs * Inh / (dens_rs * 1000) / 24 / 3600;
  adv_9b[3][4] = f_ss_rem * adv_9b[0][3];
  adv_9b[3][6] = adv_9b[0][3] * (1 - f_ss_rem);
  adv_9b[4][0] = adv_9b[3][4];
  adv_9b[5][7] = adv_9b[0][2];
  adv_9b[6][8] = (S_flow / 24 / 3600) * Inh * C_as / (dens_as * 1000);
  adv_9b[7][0] = adv_9b[5][7];
  adv_9b[8][0] = (S_flow / 24 / 3600) * Inh * C_ss_SLS / (dens_SLS * 1000);
  adv_9b[8][9] = adv_9b[6][8] - adv_9b[8][0];
  adv_9b[9][0] = Surplus_sludge_9b * Inh / 24 / 3600 / (dens_SLS * 1000);
  adv_9b[9][6] = adv_9b[8][9] - adv_9b[9][0];
  
  // Net sludge decay - 9box (kgdwt/person/d)
  let sludge_decay_9b = (
      (
          (
              adv_9b[3][6] * dens_PS +
              adv_9b[9][6] * dens_as
          ) * 1000
          - adv_9b[6][8] * dens_as * 1000
      )
      / (dens_as * 1000)
  ) * dens_as * 1000 * 3600 * 24;
  
  console.log(`Sludge decay 9-box (kgdwt/person/d): ${sludge_decay_9b}`);
  
  // --- Advective transport calculations (m³/s)
  let adv_6b = Array.from({ length: 10 }, () => Array(10).fill(0));
  
  let adv_6b_val = Math.sqrt(A_WWTP_6b * Inh) * H_air * Wind;
  adv_6b[0][1] = adv_6b_val;
  adv_6b[1][0] = adv_6b_val;
  adv_6b[0][5] = S_flow * Inh / 24 / 3600;
  adv_6b[0][6] = M_flow_rs * Inh / (dens_rs * 1000) / 24 / 3600;
  adv_6b[5][7] = adv_6b[0][5];
  adv_6b[6][8] = (S_flow / 24 / 3600) * Inh * C_as / (dens_as * 1000);
  adv_6b[7][0] = adv_6b[5][7];
  adv_6b[8][0] = (S_flow / 24 / 3600) * Inh * C_ss_SLS / (dens_SLS * 1000);
  adv_6b[8][9] = adv_6b[6][8] - adv_6b[8][0];
  adv_6b[9][0] = Surplus_sludge_6b * Inh / 24 / 3600 / (dens_SLS * 1000);
  adv_6b[9][6] = adv_6b[8][9] - adv_6b[9][0];
  
  // --- Sludge decay calculation (kgdwt/person/d)
  let sludge_decay_6b = (
      (
          (adv_6b[0][6] * dens_rs + adv_6b[9][6] * dens_as) * 1000
          - adv_6b[6][8] * dens_as * 1000
      )
      / (dens_as * 1000)
  ) * dens_as * 1000 * 3600 * 24;
  
  console.log(`Sludge decay 6-box: ${sludge_decay_6b}`);
  
  // --- Initialize volume arrays (length 9)
  const vol_9b = Array(9).fill(0);
  vol_9b[0] = A_WWTP_9b * Inh * H_air;
  vol_9b[1] = V_PS * Inh;
  vol_9b[2] = (vol_9b[1] * C_ss_PS) / (dens_PS * 1000);
  vol_9b[3] = M_flow_rs * f_ss_rem / 1000 / dens_rs;
  vol_9b[4] = V_ae_9b * Inh;
  vol_9b[5] = vol_9b[4] * C_as / (dens_as * 1000);
  vol_9b[6] = V_SLS * Inh;
  vol_9b[7] = (vol_9b[6] * C_ss_SLS) / (dens_SLS * 1000);
  vol_9b[8] = Surplus_sludge_9b / 1000 / dens_as;
  
  const vol_6b = Array(9).fill(0);
  vol_6b[0] = A_WWTP_6b * Inh * H_air;
  vol_6b[4] = V_ae_6b * Inh;
  vol_6b[5] = vol_6b[4] * C_as / (dens_as * 1000);
  vol_6b[6] = V_SLS * Inh;
  vol_6b[7] = (vol_6b[6] * C_ss_SLS) / (dens_SLS * 1000);
  vol_6b[8] = Surplus_sludge_6b / 1000 / dens_as;
  
  // --- Constants
  const K_air = 0.00278;     // m/s
  const K_water = 0.0000278; // m/s
  const R = 8.314;           // J/K/mol
  
  const Kaw = H / (R * T_air);  // Partition coefficient air-water
  
  // --- Strip rate constants (based on aeration type)
  let k_strip_9b = null;
  let k_strip_6b = null;
  
  if (aeration === "s") {
      k_strip_9b = (0.6 * oxygen_req_9b) / (HRT_ae_9b * 3600 * (0.009 - oxygen_C)) * (40 * Kaw / (40 * Kaw + 1));
      k_strip_6b = (0.6 * oxygen_req_6b) / (HRT_ae_6b * 3600 * (0.009 - oxygen_C)) * (40 * Kaw / (40 * Kaw + 1));
  } else if (aeration === "b") {
      k_strip_9b = 0.00089 * rate_ae / V_ae_9b * Math.pow(H, 1.04);
      k_strip_6b = 0.00089 * rate_ae / V_ae_6b * Math.pow(H, 1.04);
  }
  
  // --- Volatilization rate constants
  const k_vol_9b = A_ae_9b * Inh * (
      (1 / (vol_9b[0] * A_ae_9b / A_WWTP_9b) + Kaw / vol_9b[4]) /
      (1 / K_air + Kaw / K_water)
  );
  
  const k_vol_6b = A_ae_6b * Inh * (
      (1 / (vol_6b[0] * A_ae_6b / A_WWTP_6b) + Kaw / vol_6b[4]) /
      (1 / K_air + Kaw / K_water)
  );
  
  // --- Total rate constants aerator
  const k_ae_9b = (k_strip_9b ?? 0) + k_vol_9b;
  const k_ae_6b = (k_strip_6b ?? 0) + k_vol_6b;
  console.log(`k_ae_9b: ${k_ae_9b}, k_ae_6b: ${k_ae_6b}`);
  
  // --- Half-lives (seconds)
  const t50_PS = 3600;  // Primary sedimentation
  const t50_ae = 360;   // Aeration
  const t50_SLS = 3600; // Solids-liquid separator
  
  // --- Initialize 10x10 diffusion matrices with zeros
  const diff_9b = Array.from({ length: 10 }, () => Array(10).fill(0));
  const diff_6b = Array.from({ length: 10 }, () => Array(10).fill(0));
  
  // Fill in diffusion values for 9-box
  diff_9b[1][2] = A_PS * Inh / (1 / K_air + Kaw / K_water);
  diff_9b[2][1] = A_PS * Inh / (1 / (K_air * Kaw) + 1 / K_water);
  
  diff_9b[1][5] = k_ae_9b / (1 / (vol_9b[0] * A_ae_9b / A_WWTP_9b) + Kaw / vol_9b[4]);
  diff_9b[5][1] = k_ae_9b / (1 / (vol_9b[0] * A_ae_9b / A_WWTP_9b * Kaw) + 1 / vol_9b[4]);
  
  diff_9b[1][7] = A_SLS * Inh / (1 / K_air + Kaw / K_water);
  diff_9b[7][1] = A_SLS * Inh / (1 / (K_air * Kaw) + 1 / K_water);
  
  diff_9b[2][3] = (Math.log(2) / t50_PS) / (1 / vol_9b[1] + 1 / (vol_9b[2] * dens_PS * Kp_ps));
  diff_9b[3][2] = (Math.log(2) / t50_PS) / (dens_PS * Kp_ps / vol_9b[1] + 1 / vol_9b[2]);
  
  diff_9b[5][6] = (Math.log(2) / t50_ae) / (1 / vol_9b[4] + 1 / (vol_9b[5] * dens_as * Kp_as));
  diff_9b[6][5] = (Math.log(2) / t50_ae) / (dens_as * Kp_as / vol_9b[4] + 1 / vol_9b[5]);
  
  diff_9b[7][8] = (Math.log(2) / t50_SLS) / (1 / vol_9b[6] + 1 / (vol_9b[7] * dens_SLS * Kp_as));
  diff_9b[8][7] = (Math.log(2) / t50_SLS) / (dens_SLS * Kp_as / vol_9b[6] + 1 / vol_9b[7]);
  
  // Fill in diffusion values for 6-box
  diff_6b[1][5] = k_ae_6b / (1 / (vol_6b[0] * A_ae_6b / A_WWTP_6b) + Kaw / vol_6b[4]);
  diff_6b[5][1] = k_ae_6b / (1 / (vol_6b[0] * A_ae_6b / A_WWTP_6b * Kaw) + 1 / vol_6b[4]);
  
  diff_6b[1][7] = A_SLS * Inh / (1 / K_air + Kaw / K_water);
  diff_6b[7][1] = A_SLS * Inh / (1 / (K_air * Kaw) + 1 / K_water);
  
  diff_6b[5][6] = (Math.log(2) / t50_ae) / (1 / vol_6b[4] + 1 / (vol_6b[5] * dens_as * Kp_as));
  diff_6b[6][5] = (Math.log(2) / t50_ae) / (dens_as * Kp_as / vol_6b[4] + 1 / vol_6b[5]);
  
  diff_6b[7][8] = (Math.log(2) / t50_SLS) / (1 / vol_6b[6] + 1 / (vol_6b[7] * dens_SLS * Kp_as));
  diff_6b[8][7] = (Math.log(2) / t50_SLS) / (dens_SLS * Kp_as / vol_6b[6] + 1 / vol_6b[7]);
  
  // --- External concentration (g/m³)
  const conc_ext_9b = Array(9).fill(0);
  conc_ext_9b[1] = C_diss_rs;
  conc_ext_9b[2] = C_solids_rs * dens_rs;
  
  const conc_ext_6b = Array(9).fill(0);
  conc_ext_6b[4] = C_diss_rs;
  conc_ext_6b[5] = C_solids_rs * dens_rs;
  
  // --- First order biodegradation (s⁻¹)
  const biodeg_9b = Array(9).fill(0);
  biodeg_9b[4] = k_bio_WWTP;
  
  const biodeg_6b = Array(9).fill(0);
  biodeg_6b[4] = k_bio_WWTP;
  
  // --- Mass balance coefficients matrix (10x10)
  const coef_9box = Array.from({ length: 10 }, () => Array(10).fill(0));
  
  // Fill upper triangle of coef_9box (i = 1..9, j = 1..9)
  for (let i = 1; i < 10; i++) {
      for (let j = 1; j < 10; j++) {
          coef_9box[i][j] = -adv_9b[j][i] - diff_9b[j][i];
      }
  }
  
  // Fill diagonal (i = 1..9)
  for (let i = 1; i < 10; i++) {
      const advSum = adv_9b[i].reduce((a, b) => a + b, 0);
      const diffSum = diff_9b[i].reduce((a, b) => a + b, 0);
      coef_9box[i][i] = advSum + diffSum + (biodeg_9b[i - 1] * vol_9b[i - 1]);
  }
  
  // --- Extract submatrix (rows 1 to 9, columns 1 to 9) from coef_9box
  const coef_submatrix = coef_9box.slice(1).map(row => row.slice(1));
  
  // --- Invert the 9x9 matrix
  const coef_1_9box = math.inv(coef_submatrix);
  
  // --- Construct the constant vector (length 9)
  const constant_9b = Array(9).fill(0);
  for (let i = 0; i < 9; i++) {
      constant_9b[i] = adv_9b[0][i + 1] * conc_ext_9b[i];
  }
  
  // --- Solve for concentrations: conc_9b_vals = coef_1_9box @ constant_9b
  const conc_9b_vals = math.multiply(coef_1_9box, constant_9b);
  
  // --- Store as object (like a dataframe column)
  const conc_9b = conc_9b_vals.map(val => ({ conc9b: val }));
  
  // --- Calculate total mass inflow (g/s)
  const M_in_9b = adv_9b[0][2] * conc_ext_9b[1] + adv_9b[0][3] * conc_ext_9b[2];
  
  // --- Calculate total mass outflow (g/s)
  let M_out_9b = 0;
  for (let i = 1; i < 10; i++) {
      M_out_9b += adv_9b[i][0] * conc_9b_vals[i - 1];
  }
  
  console.log(`Mass in 9-box (g/s) (M_out_9b): ${M_in_9b}`);
  
  // --- Initialize coef_6box as 10x10 zero matrix
  const coef_6box = Array.from({ length: 10 }, () => Array(10).fill(0));
  
  // --- Fill coef_6box (10x10 matrix)
  for (let i = 1; i < 10; i++) {
    for (let j = 1; j < 10; j++) {
        coef_6box[i][j] = -adv_6b[j][i] - diff_6b[j][i];
    }
  }
  
  // --- Fill diagonal elements (i = 1 to 9)
  for (let i = 1; i < 10; i++) {
    const advSum = adv_6b[i].reduce((a, b) => a + b, 0);
    const diffSum = diff_6b[i].reduce((a, b) => a + b, 0);
    coef_6box[i][i] = advSum + diffSum + biodeg_6b[i - 1] * vol_6b[i - 1];
  }
  
  // --- Define subset indices: R's c(2,6:10) → JS: [1, 5, 6, 7, 8, 9]
  const rowsCols = [1, 5, 6, 7, 8, 9];
  
  // --- Extract submatrix using subset
  const coef_submatrix_6b = rowsCols.map(i => rowsCols.map(j => coef_6box[i][j]));
  
  // --- Invert the submatrix
  const coef_1_6box = math.inv(coef_submatrix_6b);
  
  // --- Build the full constant vector (length 9)
  const constant_6b = Array(9).fill(0);
  for (let i = 0; i < 9; i++) {
    constant_6b[i] = adv_6b[0][i + 1] * conc_ext_6b[i];
  }
  
  // --- Subset constant vector for selected rows: JS: [0, 4, 5, 6, 7, 8]
  const constant_sub = [constant_6b[0], ...constant_6b.slice(4, 9)];
  
  // --- Solve linear system
  const conc_6b_vals = math.multiply(coef_1_6box, constant_sub);
  
  // --- Store result like a DataFrame column
  const conc_6b = conc_6b_vals.map(val => ({ conc_6b: val }));
  
  // --- Calculate total mass inflow (g/s)
  const M_in_6b = adv_6b[0][5] * conc_ext_6b[4] + adv_6b[0][6] * conc_ext_6b[5];
  
  // --- Total mass outflow: indices c(2,6:10) → JS: [1, 5, 6, 7, 8, 9]
  const outflow_indices = [1, 5, 6, 7, 8, 9];
  let M_out_6b = 0;
  for (let i = 0; i < outflow_indices.length; i++) {
    const idx = outflow_indices[i];
    M_out_6b += adv_6b[idx][0] * conc_6b_vals[i];
  }
  console.log(`Mass in 6-box (g/s) (M_out_6b): ${M_in_6b}`);
  
  // --- Elimination in primary settler (only 9box)
  const f_rem_PS_vol = (conc_9b[1].conc9b * diff_9b[2][1] - conc_9b[0].conc9b * diff_9b[1][2]) / M_in_9b;
  const f_rem_PS_sludge = (conc_9b[3].conc9b * adv_9b[4][0]) / M_in_9b;
  const f_rem_PS_tot = f_rem_PS_vol + f_rem_PS_sludge;
  
  // --- Elimination in aerator (9box)
  const f_rem_ae_strip_9b = (diff_9b[5][1] * conc_9b[4].conc9b - diff_9b[1][5] * conc_9b[0].conc9b) / M_in_9b;
  const f_rem_ae_bio_9b = (biodeg_9b[4] * vol_9b[4] * conc_9b[4].conc9b + biodeg_9b[5] * vol_9b[5] * conc_9b[5].conc9b) / M_in_9b;
  const f_rem_ae_tot_9b = f_rem_ae_strip_9b + f_rem_ae_bio_9b;
  
  // --- Elimination in aerator (6box)
  const f_rem_ae_strip_6b = (diff_6b[5][1] * conc_6b[1].conc_6b - diff_6b[1][5] * conc_6b[0].conc_6b) / M_in_6b;
  const f_rem_ae_bio_6b = (biodeg_6b[4] * vol_6b[4] * conc_6b[1].conc_6b + biodeg_6b[5] * vol_6b[5] * conc_6b[2].conc_6b) / M_in_6b;
  const f_rem_ae_tot_6b = f_rem_ae_strip_6b + f_rem_ae_bio_6b;
  
  // --- Elimination in solids liquid separator (9box)
  const f_rem_SLS_vol_9b = (diff_9b[7][1] * conc_9b[6].conc9b - diff_9b[1][7] * conc_9b[0].conc9b) / M_in_9b;
  const f_rem_SLS_sludge_9b = (adv_9b[9][0] * conc_9b[8].conc9b) / M_in_9b;
  const f_rem_SLS_tot_9b = f_rem_SLS_vol_9b + f_rem_SLS_sludge_9b;
  
  // --- Elimination in solids liquid separator (6box)
  const f_rem_SLS_vol_6b = (diff_6b[7][1] * conc_6b[3].conc_6b - diff_6b[1][7] * conc_6b[0].conc_6b) / M_in_6b;
  const f_rem_SLS_sludge_6b = (adv_6b[9][0] * conc_6b[5].conc_6b) / M_in_6b;
  const f_rem_SLS_tot_6b = f_rem_SLS_vol_6b + f_rem_SLS_sludge_6b;
  
  // --- Total elimination
  const f_rem_tot_9b = f_rem_PS_tot + f_rem_ae_tot_9b + f_rem_SLS_tot_9b;
  const f_eff_diss_9b = (adv_9b[7][0] * conc_9b[6].conc9b) / M_in_9b;
  const f_eff_ass_9b = (adv_9b[8][0] * conc_9b[7].conc9b) / M_in_9b;
  const f_eff_tot_9b = f_eff_diss_9b + f_eff_ass_9b;
  
  const f_rem_tot_6b = f_rem_ae_tot_6b + f_rem_SLS_tot_6b;
  const f_eff_diss_6b = (adv_6b[7][0] * conc_6b[3].conc_6b) / M_in_6b;
  const f_eff_ass_6b = (adv_6b[8][0] * conc_6b[4].conc_6b) / M_in_6b;
  const f_eff_tot_6b = f_eff_diss_6b + f_eff_ass_6b;
  
  // --- Fractions of chemical distribution (9box)
  const f_air_9b = (adv_9b[1][0] * conc_9b[0].conc9b) / M_in_9b;
  const f_water_9b = (adv_9b[7][0] * conc_9b[6].conc9b + adv_9b[8][0] * conc_9b[7].conc9b) / M_in_9b;
  const f_ps_9b = (adv_9b[4][0] * conc_9b[3].conc9b) / M_in_9b;
  const f_as_9b = (adv_9b[9][0] * conc_9b[8].conc9b) / M_in_9b;
  const f_deg_9b = (biodeg_9b[4] * vol_9b[4] * conc_9b[4].conc9b + biodeg_9b[5] * vol_9b[5] * conc_9b[5].conc9b) / M_in_9b;
  
  // --- Fractions of chemical distribution (6box)
  const f_air_6b = (adv_6b[1][0] * conc_6b[0].conc_6b) / M_in_6b;
  const f_water_6b = (adv_6b[7][0] * conc_6b[3].conc_6b + adv_6b[8][0] * conc_6b[4].conc_6b) / M_in_6b;
  const f_as_6b = (adv_6b[9][0] * conc_6b[5].conc_6b) / M_in_6b;
  const f_deg_6b = (biodeg_6b[4] * vol_6b[4] * conc_6b[1].conc_6b + biodeg_6b[5] * vol_6b[5] * conc_6b[2].conc_6b) / M_in_6b;
  
  // --- Concentrations (9box)
  const conc_air_9b = conc_9b[0].conc9b;
  const conc_comb_s_9b = (conc_9b[3].conc9b * adv_9b[4][0] + conc_9b[8].conc9b * adv_9b[9][0]) / (adv_9b[4][0] * dens_PS + adv_9b[9][0] * dens_SLS);
  const conc_ps_9b = conc_9b[3].conc9b / dens_PS;
  const conc_as_9b = conc_9b[8].conc9b / dens_SLS;
  const conc_ml_diss_9b = conc_9b[4].conc9b;
  const conc_ml_ass_9b = conc_9b[5].conc9b / (1000 * dens_as) * C_as;
  const conc_ml_tot_9b = conc_ml_diss_9b + conc_ml_ass_9b;
  const conc_eff_diss_9b = conc_9b[6].conc9b;
  const conc_eff_ass_9b = conc_9b[7].conc9b / dens_SLS * C_ss_SLS / 1000;
  const conc_eff_tot_9b = conc_eff_diss_9b + conc_eff_ass_9b;
  const conc_eff_sol_9b = conc_9b[7].conc9b / dens_SLS;
  
  // --- Concentrations (6box)
  const conc_air_6b = conc_6b[0].conc_6b;
  const conc_as_6b = conc_6b[5].conc_6b / dens_SLS;
  const conc_ml_diss_6b = conc_6b[1].conc_6b;
  const conc_ml_ass_6b = (conc_6b[2].conc_6b / (1000 * dens_as)) * C_as;
  const conc_ml_tot_6b = conc_ml_diss_6b + conc_ml_ass_6b;
  const conc_eff_diss_6b = conc_6b[3].conc_6b;
  const conc_eff_ass_6b = (conc_6b[4].conc_6b / dens_SLS) * (C_ss_SLS / 1000);
  const conc_eff_tot_6b = conc_eff_diss_6b + conc_eff_ass_6b;
  const conc_eff_sol_6b = conc_6b[4].conc_6b / dens_SLS;
  
  console.log("remTotal: ",f_rem_tot_9b)
  console.log("remPrim: ",f_rem_PS_tot)
  console.log("remSec: ",f_rem_tot_6b)
  
  return {
    "remTotal": f_rem_tot_9b,
    "remPrim" : f_rem_PS_tot,
    "remSec" : f_rem_tot_6b,
  }
  
}


