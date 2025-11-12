import fs from 'fs'
const { join } = require('path');
import getCountriesConsPop from './getCountriesConsPop.js';

export default function tableConsToCSV(dirpath, filename) {
    
    let csv_path = join(dirpath, filename);
    console.log(csv_path)
    
    let csv_data = [];
    let rows = document.querySelectorAll("#API_table_consumption > tbody > tr") // Get each row data
    let colHeader = rows[0].querySelectorAll('.api_cons');
    let csvheader = [];
    let innerTextTemp = "";
    
    // header
    for (let j = 0; j < colHeader.length; j++) {
        innerTextTemp = colHeader[j].firstElementChild.childNodes[0].textContent;//colHeader[j].firstElementChild.innerText;
        innerTextTemp = innerTextTemp.split(/\r?\n/)[0]
        innerTextTemp = innerTextTemp.split(/([()])/)[0]
        innerTextTemp = innerTextTemp.replace(/ /g, "_");
        console.log(innerTextTemp)
        csvheader.push(innerTextTemp);
    }

    console.log("header---------------------------------")
    console.log(csvheader)
    console.log("header---------------------------------")
    csv_data.push(csvheader.join(";"));

    // data
    let cons_dat_type = document.querySelector("#cons_data_type_value_holder").innerText;
    console.log(cons_dat_type);
    let popData = getCountriesConsPop();
    console.log(popData)
    
    for (let i = 1; i < rows.length; i++) {
        let colsData = rows[i].querySelectorAll('.tableFieldCons');

        let csvrow = [];
        for (let j = 0; j < colsData.length; j++) {
            if(colsData[j].value===""){
                csvrow.push("NA");
            }else{
                if(cons_dat_type=="country_percapitagram" & colsData[j].id.includes("api")){
                    csvrow.push(colsData[j].value/1000.00 * popData.poparray[i-1] );
                }else{
                    csvrow.push(colsData[j].value);
                }
            }
        }

        csv_data.push(csvrow.join(";"));
    }

    // Combine each row data with new line character
    csv_data = csv_data.join('\n');
    csv_data = csv_data + '\n';

    // Call this function to download csv file  
    console.log(csv_data)
    fs.writeFileSync(csv_path, csv_data)
    return csv_path;
  }