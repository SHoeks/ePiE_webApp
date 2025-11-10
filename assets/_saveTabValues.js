function saveTabValues() {

  const roundingDigits = 3; 
  const roundingMinValue = 0.01; 

  nonNumericalFields = ["API","CAS","class"];

  tab1fields = {
    "name_row1":"API","cas_row1":"CAS","class_row1":"class",
    "MW_row1":"MW","KOW_n_row1":"KOW_n","Pv_row1":"Pv",
    "S_row1":"S","pKa_row1":"pKa","f_uf_row1":"f_uf","k_bio_wwtp_row1":"k_bio_wwtp",
  };
  const tabobjid = Object.keys(tab1fields);
  const tabvalues = Object.values(tab1fields);

  tab2fields = {
    "API_ID_tab2_row1":"API","Kp_ps_n_row1":"Kp_ps_n","Kp_as_n_row1":"Kp_as_n","Kp_sd_n_row1":"Kp_sd_n","KOC_n_row1":"KOC_n",
  };
  const tabobjid2 = Object.keys(tab2fields);
  const tabvalues2 = Object.values(tab2fields);

  tab2altfields = {
    "API_ID_tab2alt_row1":"API","KOW_alt_row1":"KOW_alt","Kp_ps_alt_row1":"Kp_ps_alt","Kp_as_alt_row1":"Kp_as_alt","Kp_sd_alt_row1":"Kp_sd_alt","KOC_alt_row1":"KOC_alt"
  };
  const tabobjid2alt = Object.keys(tab2altfields);
  const tabvalues2alt = Object.values(tab2altfields);

  wwtpRemovalFields = {
    "API_ID_tab2_row1":"API",
    "primaryFrac_row1":"custom_wwtp_primary_removal",
    "secondaryFrac_row1":"custom_wwtp_secondary_removal",
  }
  const wwtpRemovalObjId = Object.keys(wwtpRemovalFields);
  const wwtpRemovalValues = Object.values(wwtpRemovalFields);

  var objidsall = tabobjid.concat(tabobjid2, tabobjid2alt, wwtpRemovalObjId);
  var tabvaluesall = tabvalues.concat(tabvalues2, tabvalues2alt, wwtpRemovalValues);

  // get current chem data
  var currentData = getChemProperties();
  var currentDataSubset = {};

  // subset to revelavent fields only
  var keys = Object.keys(currentData);
  tabfields1 = Object.values(tab1fields);
  tabfields2 = Object.values(tab2fields);
  tabfields2alt = Object.values(tab2altfields);
  wwtpFields = Object.values(wwtpRemovalFields);
  var relevantFields = tabfields1.concat(tabfields2, tabfields2alt, wwtpFields);
  relevantFields = [...new Set(relevantFields)]; // remove duplicates
  for(const i in relevantFields) {
    // console.log("Checking field to save: ", relevantFields[i]);
    currentData[relevantFields[i]] !== undefined ? currentDataSubset[relevantFields[i]] = currentData[relevantFields[i]] : null;
  }
  console.log("Current saved chemical data before saving tab values: ", currentDataSubset);
  
  // check which fields are numerical
  numericalFields = keys.filter(x => !nonNumericalFields.includes(x));
  var relevantFields2 = relevantFields.filter(x => !nonNumericalFields.includes(x));
  numericalFields = numericalFields.concat(relevantFields2);
  numericalFields = [...new Set(numericalFields)]; // remove duplicates
  console.log("Numerical fields: ", numericalFields); 

  // get data from tables
  var NewData = {};
  for (const key in tab1fields) {
    // console.log("Getting tab 1 field ", key);
    NewData[tab1fields[key]] = document.getElementById(key).value;
  }
  for (const key in tab2fields) {
    // console.log("Getting tab 2 field ", key);
    NewData[tab2fields[key]] = document.getElementById(key).value;
  }
  for (const key in tab2altfields) {
    // console.log("Getting tab 2 alt field ", key);
    NewData[tab2altfields[key]] = document.getElementById(key).value;
  }
  for (const key in wwtpRemovalFields) {
    // console.log("Getting WWTP removal field ", key);
    NewData[wwtpRemovalFields[key]] = document.getElementById(key).value;
  }

  // exclude data that is empty to keep existing values
  for (const key in NewData) {
    if (NewData[key] === "") {
      delete NewData[key];
    }
  }

  // keep new data fields that are different from currentDataSubset
  for (const key in NewData) {
    if (currentDataSubset[key] !== undefined) {
      // both numerical
      if (numericalFields.includes(key)) {
        tmpValnew = NewData[key];
        tmpValold = currentDataSubset[key];
        if(!isNaN(tmpValnew) && parseFloat(tmpValnew)>roundingMinValue) {
            tmpValnew = parseFloat(tmpValnew).toFixed(roundingDigits);
        }
        if(!isNaN(tmpValold) && parseFloat(tmpValold)>roundingMinValue) {
            tmpValold = parseFloat(tmpValold).toFixed(roundingDigits);
        }
        // console.log("Numerical field comparison: ", parseFloat(tmpValnew), parseFloat(tmpValold));
        if (parseFloat(tmpValnew) === parseFloat(tmpValold)) {
          // console.log("Skipping unchanged numerical field: ", key, NewData[key]);
          delete NewData[key];
        }
      } else {
        // non-numerical
        if (NewData[key] === currentDataSubset[key]) {
          // console.log("Skipping unchanged non-numerical field: ", key, NewData[key]);
          delete NewData[key];
        }
      }
    }else{
      console.log("New field to add: ", key, NewData[key]);
    }
  }

  console.log("New data from tabs to save: ", NewData);

  // check if new data is numerical and convert to float
  for (const key in NewData) {
    if (numericalFields.includes(key)) {
      if (!isNaN(NewData[key])) {
        NewData[key] = parseFloat(NewData[key]);
      }else if (NewData[key] === "NA" || NewData[key] === "na" || NewData[key] === "Na" || NewData[key] === "nA" || NewData[key] === "") {
        delete NewData[key];
        delete currentData[key];
        delete currentDataSubset[key];
        let idx = tabvaluesall.indexOf(key);
        let objid = objidsall[idx];
        let obj = document.getElementById(objid);
        if(obj!=null){obj.value = "";}
      } else {
        alert("Invalid numerical input for '" + key + "' : '" + NewData[key] + "'");
        delete NewData[key];
        let idx = tabvaluesall.indexOf(key);
        let objid = objidsall[idx];
        let obj = document.getElementById(objid);
        if(obj!=null){obj.value = "";}
      }
    }
  }

  // NewData contains or old data is invalid
  check1 = NewData["custom_wwtp_primary_removal"] !== undefined && 
  (currentData["custom_wwtp_primary_removal"] > 1.0 || currentData["custom_wwtp_primary_removal"] < 0.0);
  check2 = NewData["custom_wwtp_secondary_removal"] !== undefined &&
  (currentData["custom_wwtp_secondary_removal"] > 1.0 || currentData["custom_wwtp_secondary_removal"] < 0.0);

  // validate WWTP removal fractions
  if (NewData["custom_wwtp_primary_removal"] > 1.0 || NewData["custom_wwtp_primary_removal"] < 0.0 || check1) {
    alert("Primary fraction must be between 0 and 1");
    // dialog.showMessageBox({ title: 'Invalid WWTP removal input', message: 'Primary fraction must be between 0 and 1', buttons: ['OK'] })
    document.getElementById("primaryFrac_row1").value = "";
    delete NewData["custom_wwtp_primary_removal"];
  }
  if (NewData["custom_wwtp_secondary_removal"] > 1.0 || NewData["custom_wwtp_secondary_removal"] < 0.0 || check2) {
    alert("Secondary fraction must be between 0 and 1");
    // dialog.showMessageBox({ title: 'Invalid WWTP removal input', message: 'Secondary fraction must be between 0 and 1', buttons: ['OK'] })
    document.getElementById("secondaryFrac_row1").value = "";
    delete NewData["custom_wwtp_secondary_removal"];
  }

  // merge current data with new data
  var updatedData = { ...currentData, ...NewData };
  console.log("Updated chemical data after saving tab values: ", updatedData);

  if(updatedData["class"] != "acid" && updatedData["class"] != "base" && updatedData["class"] != "neutral"){
    alert("Chemical class must be: 'acid' OR 'base' OR 'neutral'");
    document.getElementById("class_row1").value = "";
    delete updatedData["class"];
  }

  // set updated chem data
  setChemProperties([updatedData], true, false);

  var fields = document.querySelectorAll("table input[type='text']");
  for (let i = 0; i < fields.length; i++) {
    fields[i].readOnly = true;
    fields[i].style.border = "none";
  }

  document.getElementById("save").style.display = "none";
  document.getElementById("save2").style.display = "none";
  document.getElementById("save3").style.display = "none";
  document.getElementById("save4").style.display = "none";
  document.getElementById("save5").style.display = "none";
  copyOverAPI_ID();

  // calculate API total kg cons per country if value is set
  var percapfield = document.querySelector("#cPercapitaValue_row1");
  if (percapfield != null) {
    let val = percapfield.value;
    console.log(val);
    if (val != "") {
      let percapitakg = parseFloat(val) / 1000.00;
      console.log(percapitakg);

      let countriesPop = getCountriesConsPop();
      console.log(countriesPop);

      for (let i = 0; i < countriesPop.countries.length; i++) {
        let country = countriesPop.countries[i];
        let selector = countriesPop.selectors[i];
        selector = selector.replace("c_row", "api1_row");
        let pop = countriesPop.poparray[i];
        console.log(country, selector, pop);
        let cons = (percapitakg * pop).toFixed(3);
        console.log(cons);
        //if(document.querySelector(selector).value===""){
        document.querySelector(selector).value = cons;
        //}
      }

    }
  }

}