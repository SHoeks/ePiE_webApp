function saveTabValues() {
  var data = {};

  var ObjtableField = document.getElementsByClassName("tableField");
  for (let i = 0; i < ObjtableField.length; i++) data[ObjtableField[i].id] = document.getElementById(ObjtableField[i].id).value;

  var ObjtableField2 = document.getElementsByClassName("tableField2");
  for (let i = 0; i < ObjtableField2.length; i++) data[ObjtableField2[i].id] = document.getElementById(ObjtableField2[i].id).value;

  var ObjtableField3 = document.getElementsByClassName("tableField3");
  for (let i = 0; i < ObjtableField3.length; i++) data[ObjtableField3[i].id] = document.getElementById(ObjtableField3[i].id).value;

  var ObjtableField4 = document.getElementsByClassName("tableField4");
  for (let i = 0; i < ObjtableField4.length; i++) data[ObjtableField4[i].id] = document.getElementById(ObjtableField4[i].id).value;
  console.log(data);

  if (data["primaryFrac_row1"] > 1.0 || data["primaryFrac_row1"] < 0.0) {
    dialog.showMessageBox({ title: 'Invalid WWTP removal input', message: 'Primary fraction must be between 0 and 1', buttons: ['OK'] })
    document.querySelector("#primaryFrac_row1").value = "";
  }
  if (data["secondaryFrac_row1"] > 1.0 || data["secondaryFrac_row1"] < 0.0) {
    dialog.showMessageBox({ title: 'Invalid WWTP removal input', message: 'Secondary fraction must be between 0 and 1', buttons: ['OK'] })
    document.querySelector("#secondaryFrac_row1").value = "";
  }

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