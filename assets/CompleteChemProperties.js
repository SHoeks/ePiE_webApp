// testing code
/*
let testChemicals = {
        API: "Ibuprofen",
        CAS: "15687-27-1",
        class: "acid",
        MW: 206.2808,
        KOW_n: 9332.543,
        Pv: 0.0248,
        S: 21,
        pKa: 4.85,
        f_uf: 0.2,
        k_bio_wwtp: 0.0,
        Kp_ps_n: null,
        Kp_as_n: null,
        Kp_sd_n: null,
        KOC_n: null,
        KOW_alt: null,
        Kp_ps_alt: null,
        Kp_as_alt: null,
        Kp_sd_alt: null,
        KOC_alt: null
      };
  testChemicals["k_bio_wwtp_n"] = testChemicals["k_bio_wwtp"]
  testChemicals["API"]
  let chemArray = [testChemicals];
  let out = completeChemProperties(chemArray)
*/

function runAPICompleteWrapper(){

  function getcolnames(headerNodeList){
    let colNames = [];
    for(let i = 0; i < headerNodeList.length; i++) {
      let innerTextTemp = headerNodeList[i].firstElementChild.innerText;
      console.log(innerTextTemp)
      innerTextTemp = innerTextTemp.split(/\r?\n/)[0]
      innerTextTemp = innerTextTemp.split(/([()])/)[0]
      colNames.push(innerTextTemp);
    }
    return colNames;
  }

  function getcoldata(colsData){
    let data = []; 
    for (let j = 0; j < colsData.length; j++) {
        if(colsData[j].value===""){
          data.push(null);
        }else{
          data.push(colsData[j].value);
        }
    }
    return data;
  }

  // gather inputs for APIComplete js function
  let rows = document.querySelectorAll("#API_table > tbody > tr") // Get each row data
  let rows2 = document.querySelectorAll("#API_table2 > tbody > tr") // Get each row2 data
  let rows3 = document.querySelectorAll("#API_table2alt > tbody > tr") // Get each row2 data
  let colHeader = rows[0].querySelectorAll('.tableHeader');
  let colHeader2 = rows2[0].querySelectorAll('.tableHeader2');
  let colHeader3 = rows3[0].querySelectorAll('.tableHeader2alt');
  let colNames = getcolnames(colHeader);
  let colNames2 = getcolnames(colHeader2);
  let colNames3 = getcolnames(colHeader3);
  console.log(colNames);
  console.log(colNames2);
  console.log(colNames3);
  let colsData = rows[1].querySelectorAll('.tableField');
  let colsData2 = rows2[1].querySelectorAll('.tableField2');
  let colsData3 = rows3[1].querySelectorAll('.tableField2alt');
  let colsd = getcoldata(colsData);
  let colsd2 = getcoldata(colsData2);
  let colsd3 = getcoldata(colsData3);
  console.log(colsd);
  console.log(colsd2);
  console.log(colsd3);

  // prepare chem
  let chem = {};
  for(let i = 0; i < colNames.length; i++) chem[colNames[i]] = colsd[i];
  for(let i = 0; i < colNames2.length; i++) chem[colNames2[i]] = colsd2[i];
  for(let i = 0; i < colNames3.length; i++) chem[colNames3[i]] = colsd3[i];
  
  // convert string to float for specific parameters
  let floatParams = ["MW","KOW_n","Pv","S","pKa","f_uf","k_bio_wwtp",
                      "KOW_n","Kp_ps_n","Kp_as_n","Kp_sd_n","KOC_n",
                      "KOW_alt","Kp_ps_alt","Kp_as_alt","Kp_sd_alt","KOC_alt"];
  for(let i = 0; i < floatParams.length; i++){
    let p = floatParams[i];
    if(chem[p]!=null){
      let pfloat = parseFloat(chem[p]);
      if(!isNaN(pfloat)) chem[p] = pfloat;
    }
  }
  console.log("chem:",chem);
  
  // preprocessing
  chem["k_bio_wwtp_n"] = chem["k_bio_wwtp"]
  chem["API"]
  let chemArray = [chem];
  
  // loop over all chem params (chemArray)
  var f = chemArray[0];
  Object.keys(f).forEach(function(key) {console.log(key,":",f[key]);});

  // complete chem properties
  let chem2 = completeChemProperties(chemArray); //!!
  console.log("chem2:",chem2);
  chem2[0]['metab'] = 0
  chem2[0]['API_metab'] = 0

  // set global variable
  setChemProperties(chem2, false, true);
  
}


function completeChemProperties(chem) {
    // Helper to ensure property exists on each object
    function ensureProp(arr, propName, defaultValue) {
      arr.forEach(item => {
        if (!(propName in item)) {
          item[propName] = defaultValue;
        }
      });
    }
  
    // Step 1: Ensure primary/secondary removal columns exist
    ensureProp(chem, "custom_wwtp_primary_removal", null);
    ensureProp(chem, "custom_wwtp_secondary_removal", null);
  
    // Step 2: Tertiary columns — default to zero
    const tertiaryCols = [
      "custom_wwtp_N_removal", "custom_wwtp_P_removal", "custom_wwtp_UV_removal",
      "custom_wwtp_Cl_removal", "custom_wwtp_O3_removal", "custom_wwtp_sandfilter_removal",
      "custom_wwtp_microfilter_removal"
    ];
    tertiaryCols.forEach(col => ensureProp(chem, col, 0));
  
    // Step 3: Validate primary/secondary logic
    chem.forEach(item => {
      const primary = item.custom_wwtp_primary_removal;
      const secondary = item.custom_wwtp_secondary_removal;
      if (primary == null && secondary == null) {
        console.log(`WWTP primary and secondary removal rates evaluated with SimpleTreat 4.0 for ${item.API}`);
      } else if (primary != null && secondary != null) {
        console.log(`WWTP primary and secondary custom removal rates are used for ${item.API}`);
      } else {
        throw new Error(`Error: Primary or secondary WWTP removal rates are not valid for ${item.API}`);
      }
    });
  
    // Step 4: Check for missing tertiary removals
    chem.forEach(item => {
      tertiaryCols.forEach(col => {
        if (item[col] == null) {
          throw new Error(`Error: One of the tertiary treatment removal is NA for ${item.API}`);
        }
      });
    });
  
    // Step 5: Convert certain columns to numeric
    ["MW", "pKa", "KOW_n"].forEach(col => {
      chem.forEach(item => {
        item[col] = parseFloat(item[col]);
        if (isNaN(item[col])) item[col] = null;
      });
    });
  
    // Step 6: Ensure a long list of columns exist (default NaN / null)
    const checkCols = [
      "k_bio_wwtp_n", "f_u", "f_f", "f_uf", "k_bio_wwtp_alt",
      "Kp_ps_n", "Kp_as_n", "Kp_ps_alt", "k_bio_wwtp", "Kp_as_alt",
      "KOC_n", "KOC_alt", "k_bio_sw1_n", "k_bio_sw1_alt",
      "T_bio_sw_n", "T_bio_sw_alt", "T_bio_sd_n", "T_bio_sd_alt",
      "k_hydro_sw_n", "k_hydro_sw_alt", "T_hydro_sw_n", "T_hydro_sd_n",
      "T_hydro_sw_alt", "T_hydro_sd_alt", "k_photo12_sw_n",
      "k_photo12_sw_alt", "T_photo12_sw_n", "T_photo12_sw_alt",
      "alpha_n", "lambda_solar_n", "alpha_alt", "lambda_solar_alt",
      "fn_WWTP", "Kp_sd_n", "Kp_sd_alt"
    ];
    checkCols.forEach(col => ensureProp(chem, col, null));
  
    // Step 7: Fill and compute f_uf, f_u, f_f
    chem.forEach(item => {
      item.f_uf = item.f_uf == null ? 0 : item.f_uf;
      if (item.f_u == null) {
        item.f_u = (item.f_f == null) ? 1 : item.f_u;
      }
      item.f_f = item.f_f == null ? 0 : item.f_f;
      if (item.f_uf === 0) {
        item.f_uf = item.f_u + item.f_f;
      }
    });
  
    // Step 8: k_bio_wwtp_n fallback, fill defaults
    chem.forEach(item => {
      item.k_bio_wwtp_n = (item.k_bio_wwtp_n == null) ? item.k_bio_wwtp : item.k_bio_wwtp_n;
      if (item.k_bio_wwtp_n == null) item.k_bio_wwtp_n = 0;
      if (item.k_bio_wwtp_alt == null) item.k_bio_wwtp_alt = 0;
    });
  
    // Step 9: calc_fn — ion class logic
    function calc_fn(cclass, pka) {
      if (cclass === "neutral") return 1;
      if (cclass === "acid") return 1 / (1 + 10 ** (7 - pka));
      if (cclass === "base") return 1 / (1 + 10 ** (pka - 7));
      return NaN;
    }
    chem.forEach(item => {
      item.fn_WWTP = calc_fn(item.class, item.pKa);
    });
  
    // Step 10: compute k_bio_wwtp
    chem.forEach(item => {
      item.k_bio_wwtp = item.fn_WWTP * item.k_bio_wwtp_n + (1 - item.fn_WWTP) * item.k_bio_wwtp_alt;
    });
  
    // Step 11: Kp fallback logic
    chem.forEach(item => {
      if (item.Kp_ps_n == null && item.Kp_as_n != null) {
        item.Kp_ps_n = (0.3 / 0.37) * item.Kp_as_n;
      }
      if (item.Kp_ps_alt == null && item.Kp_as_alt != null) {
        item.Kp_ps_alt = (0.3 / 0.37) * item.Kp_as_alt;
      }
      if (item.Kp_as_n == null && item.Kp_ps_n != null) {
        item.Kp_as_n = (0.37 / 0.3) * item.Kp_ps_n;
      }
      if (item.Kp_as_alt == null && item.Kp_ps_alt != null) {
        item.Kp_as_alt = (0.37 / 0.3) * item.Kp_ps_alt;
      }
    });
  
    // Step 12: calc_KOC functions
    function calc_KOC_n(cclass, Kow_n, KOC_n) {
      if (KOC_n != null) return KOC_n;
      if (cclass === "neutral") return 1.26 * Kow_n ** 0.81;
      if (cclass === "acid") return 10 ** (0.54 * Math.log10(Kow_n) + 1.11);
      if (cclass === "base") return 10 ** (0.37 * Math.log10(Kow_n) + 1.7);
      return NaN;
    }
    function calc_KOC_alt(cclass, Kow_n, pKa, KOC_alt) {
      if (KOC_alt != null) return KOC_alt;
      if (cclass === "neutral") return Kow_n;
      if (cclass === "acid") return 10 ** (0.11 * Math.log10(Kow_n) + 1.54);
      if (cclass === "base") {
        return 10 ** (pKa ** 0.65 * (Kow_n / (Kow_n + 1)) ** 0.14);
      }
      return NaN;
    }
  
    chem.forEach(item => {
      item.KOC_n = calc_KOC_n(item.class, item.KOW_n, item.KOC_n);
      item.KOC_alt = calc_KOC_alt(item.class, item.KOW_n, item.pKa, item.KOC_alt);
    });
  
    // Step 13: KOW_alt
    chem.forEach(item => {
      item.KOW_alt = 10 ** (Math.log10(item.KOW_n) - 3.5);
    });
  
    // Step 14: Fallback partitions from KOC
    chem.forEach(item => {
      if (item.Kp_ps_n == null) item.Kp_ps_n = 0.3 * item.KOC_n;
      if (item.Kp_ps_alt == null) item.Kp_ps_alt = 0.3 * item.KOC_alt;
      if (item.Kp_as_n == null) item.Kp_as_n = 0.37 * item.KOC_n;
      if (item.Kp_as_alt == null) item.Kp_as_alt = 0.37 * item.KOC_alt;
    });
  
    // Step 15: Weighted Kp averages
    chem.forEach(item => {
      item.Kp_ps = item.Kp_ps_n * item.fn_WWTP + item.Kp_ps_alt * (1 - item.fn_WWTP);
      item.Kp_as = item.Kp_as_n * item.fn_WWTP + item.Kp_as_alt * (1 - item.fn_WWTP);
    });
  
    // Step 16: Fill biodegradation rates in surface water
    chem.forEach(item => {
      item.k_bio_sw1_n = item.k_bio_sw1_n == null ? 0 : item.k_bio_sw1_n;
      item.k_bio_sw1_alt = item.k_bio_sw1_alt == null ? 0 : item.k_bio_sw1_alt;
    });
  
    // Step 17: Bacteria constant and second‑stage rates
    chem.forEach(item => {
      const BACT_test = 1e6;
      item.BACT_test = BACT_test;
      item.k_bio_sw2_n = item.k_bio_sw1_n / BACT_test;
      item.k_bio_sw2_alt = item.k_bio_sw1_alt / BACT_test;
    });
  
    // Step 18: Temperature defaults
    const tempCols = [
      'T_bio_sw_n', 'T_bio_sw_alt', 'T_bio_sd_n', 'T_bio_sd_alt',
      'T_hydro_sw_n', 'T_hydro_sw_alt', 'T_hydro_sd_n', 'T_hydro_sd_alt',
      'T_photo12_sw_n', 'T_photo12_sw_alt'
    ];
    tempCols.forEach(col => {
      chem.forEach(item => {
        if (item[col] == null) item[col] = 293.15;
      });
    });
  
    // Step 19: Hydrolysis & photolysis defaults
    const rateCols = [
      'k_hydro_sw_n', 'k_hydro_sw_alt', 'k_photo12_sw_n', 'k_photo12_sw_alt'
    ];
    rateCols.forEach(col => {
      chem.forEach(item => {
        if (item[col] == null) item[col] = 0;
      });
    });
  
    // Step 20: Sediment partition
    chem.forEach(item => {
      const fOC_sd = 0.05;
      if (item.Kp_sd_n == null) item.Kp_sd_n = item.KOC_n * fOC_sd;
      if (item.Kp_sd_alt == null) item.Kp_sd_alt = item.KOC_alt * fOC_sd;
    });
  
    // Step 21: Solar absorption logic (findInterval + alpha calculation)
    const lambdaRange = [0, 298.75, 301.25, 303.75, 306.75, 308.75, 311.25, 313.75,
                         316.25, 318.75, 321.25, 325, 335, 345, 355, 365, 375, 385,
                         395, 405, 435, 465, 495];
    const alphaRange = [0.043, 0.0415, 0.0395, 0.0375, 0.0355, 0.0335, 0.032, 0.0305,
                        0.029, 0.0275, 0.026, 0.022, 0.0185, 0.015, 0.0125, 0.01, 0.0083,
                        0.0069, 0.0055, 0.0042, 0.0028, 0.0019, 0.001];
  
    function findInterval(value, bins) {
      for (let i = 0; i < bins.length - 1; i++) {
        if (bins[i] <= value && value < bins[i + 1]) return i;
      }
      return bins.length - 2;
    }
    function calcAlpha(lam) {
      if (lam == null) return 1e-6;
      const idx = findInterval(lam, lambdaRange);
      return alphaRange[idx];
    }
  
    chem.forEach(item => {
      item.alpha_n = calcAlpha(item.lambda_solar_n);
      item.alpha_alt = calcAlpha(item.lambda_solar_alt);
    });
  
    // Step 22: Drop f_u and f_f
    chem.forEach(item => {
      delete item.f_u;
      delete item.f_f;
    });
  
    return chem;
  }
  