
getChemProperties = function() {

    const output = document.getElementById('chemDataFull');
    
    // no data check
    if(output.textContent == "{Undefined}"){
        console.log("No chemical data available in getChemProperties");
        return undefined;
    }

    // parse chem data
    let chemDat = JSON.parse(output.textContent);
    console.log("Chemical data retrieved in getChemProperties: ", chemDat);
    return chemDat;

}

setChemProperties = function(chem, overwriteChemTables = true, colorWarning = false) {

    const output = document.getElementById('chemDataFull');
    
    // no data check
    if(chem == undefined){
        console.log("No chemical data provided to setChemProperties");
        output.textContent = "{Undefined}";
        return;
    }

    // single chem parsed
    if(chem.length == undefined && chem.constructor == Object){
        console.log("Single chemical data provided to setChemProperties");
        output.textContent = JSON.stringify(chem, null, 2);
    }

    // mulitple parsed select first
    if(chem.length != undefined && chem.constructor == Array){
        console.log("Multiple chemical data provided to setChemProperties, selecting first");
        output.textContent = JSON.stringify(chem[0], null, 2);
    }

    // chem parsed as string directly
    if(chem.constructor == String){
        console.log("Chemical data provided to setChemProperties as string");
        output.textContent = chem;
    }
    
    updateChemTables(overwriteChemTables, colorWarning);
    copyOverAPI_ID();

    // check if k_bio_wwtp == 0 
    let cell = document.querySelector("#k_bio_wwtp_row1")
    let k_bio_wwtp = cell.value;
    k_bio_wwtp = parseFloat(k_bio_wwtp);
    console.log("k_bio_wwtp: ",k_bio_wwtp);
    if(k_bio_wwtp == 0){
        cell.style.color = "#ff0000";
    }
    if(k_bio_wwtp > 0){
        cell.style.color = "#000000";
    }
    if(isNaN(k_bio_wwtp)){
        cell.value = 0.0;
        cell.setAttribute('value',0.0); 
        cell.style.color = "#ff0000";
    }


}

updateChemTables = function(overwriteChemTables = true, colorWarning = false) {

    const roundingDigits = 3; 
    const roundingMinValue = 0.01; 
    const warningColor = "#ff9000";
    const normalColor = "#000000";

    // set color
    let colorToUse = normalColor;
    if(colorWarning) colorToUse = warningColor;

    console.log("Filling table using hidden chem data (", updateChemTables, ")");

    const datObj = document.getElementById('chemDataFull');
    const chemDat = JSON.parse(datObj.textContent);
    console.log(chemDat);
    const dataHeader = Object.keys(chemDat);
    console.log(dataHeader);
    colNameTab1Translate = { "name": "API", "cas": "CAS" }
    colNameTab2Translate = { "API_ID_tab2": "API", "cas": "CAS" }
    colNameTab3Translate = { "API_ID_tab2alt": "API", "cas": "CAS" }

    // fill table 1 if possible
    var targetDiv = document.getElementsByClassName("tableField")
    var colIndex;
    for (let i = 0; i < targetDiv.length; i++) {
        let currentValue = targetDiv[i].value;
        if(!overwriteChemTables & currentValue!=""){
            console.log("Skipping existing value for ",targetDiv[i].id," : ",currentValue);
            continue;
        }
        targetDiv[i].value = ""
        targetDiv[i].setAttribute('value', '');
        let colName = targetDiv[i].id.split("_row")[0];
        let rowIndex = targetDiv[i].id.split("_row")[1];
        console.log(colName);
        let mappedColName = colNameTab1Translate[colName];
        if (mappedColName == undefined) mappedColName = colName;
        console.log(mappedColName);
        if (chemDat[mappedColName] == undefined | chemDat[mappedColName] == "" | chemDat[mappedColName] == "NA") {
            targetDiv[i].value = ""
            targetDiv[i].setAttribute('value', '');
        } else {
            let tmpVal = chemDat[mappedColName];
            //round value 3 decimals
            if(!isNaN(tmpVal) && parseFloat(tmpVal)>roundingMinValue) {
                tmpVal = parseFloat(tmpVal).toFixed(roundingDigits);
            }
            targetDiv[i].value = tmpVal;
            targetDiv[i].setAttribute('value', tmpVal);
        }
        targetDiv[i].style.color = colorToUse;
    }

    // fill table 2 if possible
    var targetDiv = document.getElementsByClassName("tableField2")
    var colIndex;
    for (let i = 0; i < targetDiv.length; i++) {
        let currentValue = targetDiv[i].value;
        if(!overwriteChemTables & currentValue!=""){
            console.log("Skipping existing value for ",targetDiv[i].id," : ",currentValue);
            continue;
        }
        targetDiv[i].value = ""
        targetDiv[i].setAttribute('value', '');
        let colName = targetDiv[i].id.split("_row")[0];
        let rowIndex = targetDiv[i].id.split("_row")[1];
        console.log(colName);
        let mappedColName = colNameTab2Translate[colName];
        if (mappedColName == undefined) mappedColName = colName;
        if (chemDat[mappedColName] == undefined | chemDat[mappedColName] == "" | chemDat[mappedColName] == "NA") {
            targetDiv[i].value = ""
            targetDiv[i].setAttribute('value', '');
        } else {
            let tmpVal = chemDat[mappedColName];
            //round value 3 decimals
            if(!isNaN(tmpVal) && parseFloat(tmpVal)>roundingMinValue) {
                tmpVal = parseFloat(tmpVal).toFixed(roundingDigits);
            }
            targetDiv[i].value = tmpVal;
            targetDiv[i].setAttribute('value', tmpVal);
        }
        console.log(targetDiv[i].id + " - " + mappedColName + " - " + chemDat[mappedColName]);
        targetDiv[i].style.color = colorToUse;
    }

    // fill table 2 if possible
    targetDiv = document.getElementsByClassName("tableField2alt")
    for (let i = 0; i < targetDiv.length; i++) {
        let currentValue = targetDiv[i].value;
        if(!overwriteChemTables & currentValue!=""){
            console.log("Skipping existing value for ",targetDiv[i].id," : ",currentValue);
            continue;
        }
        targetDiv[i].value = ""
        targetDiv[i].setAttribute('value', '');
        let colName = targetDiv[i].id.split("_row")[0];
        let rowIndex = targetDiv[i].id.split("_row")[1];
        console.log(colName);
        let mappedColName = colNameTab3Translate[colName];
        if (mappedColName == undefined) mappedColName = colName;
        if (chemDat[mappedColName] == undefined | chemDat[mappedColName] == "" | chemDat[mappedColName] == "NA") {
            targetDiv[i].value = ""
            targetDiv[i].setAttribute('value', '');
        } else {
            let tmpVal = chemDat[mappedColName];
            //round value 3 decimals
            if(!isNaN(tmpVal) && parseFloat(tmpVal)>roundingMinValue) {
                tmpVal = parseFloat(tmpVal).toFixed(roundingDigits);
            }
            targetDiv[i].value = tmpVal;
            targetDiv[i].setAttribute('value', tmpVal);
        }
        console.log(targetDiv[i].id + " - " + mappedColName + " - " + chemDat[mappedColName]);
        targetDiv[i].style.color = colorToUse;
    }



}



