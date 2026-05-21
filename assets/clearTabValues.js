function clearTabValues() {
  if (confirm("Are you sure you want to clear the table values? This action cannot be undone.")) {
    // clear the table values
    for (const key in tab2fields) {
      document.getElementById(key).value = "";
    }
    for (const key in tab2altfields) {
      document.getElementById(key).value = "";
    }
    for (const key in wwtpRemovalFields) {
      document.getElementById(key).value = "";
    }

    // get current chem data
    var currentData = getChemProperties();

    // clear the corresponding data in the currentData object
    for (const key in tab2altfields) {
      if (tab2altfields[key] !== "API") {
        console.log("Clearing data for field ", tab2altfields[key]);
        delete currentData[tab2altfields[key]];
      }
    }
    for (const key in tab2fields) {
      if (tab2fields[key] !== "API") {
        console.log("Clearing data for field ", tab2fields[key]);
        delete currentData[tab2fields[key]];
      }
    }

  } else {
    // user cancelled, do nothing
    console.log("Clear table values cancelled by user.");
  }

  // set updated chem data
  setChemProperties([currentData], true, false);


}