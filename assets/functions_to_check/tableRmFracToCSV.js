import fs from 'fs'
const { join } = require('path');

export default function tableRmFracToCSV(dirpath, filename) {
    
    let csv_path = join(dirpath, filename);
    console.log(csv_path)
    
    let csv_data = [];
    let rows = document.querySelector("#API_table_degradation > tbody") // Get each row data
    let colHeader = rows.querySelectorAll('.tableHeader3');
    let csvheader = [];
    let innerTextTemp = "";
    

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
    
    for (let i = 1; i < rows.childElementCount; i++) {
        let colsData = rows.childNodes[i];

        let csvrow = [];
        for (let j = 0; j < colsData.childElementCount; j++) {
            if(colsData.childNodes[j].firstElementChild.value===""){
                csvrow.push("NA");
            }else{
                csvrow.push(colsData.childNodes[j].firstElementChild.value);
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