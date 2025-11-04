import fs from 'fs'
const { join } = require('path');

export default function tableToCSV(dirpath, filename) {
    
    let csv_path = join(dirpath, filename);
    console.log(csv_path)
    
    let csv_data = [];
    let rows = document.querySelectorAll("#API_table > tbody > tr") // Get each row data
    let rows2 = document.querySelectorAll("#API_table2 > tbody > tr") // Get each row2 data
    let rows3 = document.querySelectorAll("#API_table2alt > tbody > tr") // Get each row2 data
    
    let colHeader = rows[0].querySelectorAll('.tableHeader');
    let colHeader2 = rows2[0].querySelectorAll('.tableHeader2');
    let colHeader3 = rows3[0].querySelectorAll('.tableHeader2alt');
    let csvheader = [];
    let innerTextTemp = "";
    for (let j = 0; j < colHeader.length; j++) {
        innerTextTemp = colHeader[j].firstElementChild.innerText;
        console.log(innerTextTemp)
        innerTextTemp = innerTextTemp.split(/\r?\n/)[0]
        innerTextTemp = innerTextTemp.split(/([()])/)[0]
        console.log(innerTextTemp)
        csvheader.push(innerTextTemp);
    }
    for (let j = 0; j < colHeader2.length; j++) {
        innerTextTemp = colHeader2[j].firstElementChild.innerText;
        console.log(innerTextTemp)
        innerTextTemp = innerTextTemp.split(/\r?\n/)[0]
        innerTextTemp = innerTextTemp.split(/([()])/)[0]
        console.log(innerTextTemp)
        csvheader.push(innerTextTemp);
    }
    for (let j = 0; j < colHeader3.length; j++) {
        innerTextTemp = colHeader3[j].firstElementChild.innerText;
        console.log(innerTextTemp)
        innerTextTemp = innerTextTemp.split(/\r?\n/)[0]
        innerTextTemp = innerTextTemp.split(/([()])/)[0]
        console.log(innerTextTemp)
        csvheader.push(innerTextTemp);
    }

    console.log("header---------------------------------")
    console.log(csvheader)
    console.log("header---------------------------------")

    csv_data.push(csvheader.join(";"));

    
    for (let i = 1; i < rows.length; i++) {
        let colsData = rows[i].querySelectorAll('.tableField');
        let colsData2 = rows2[i].querySelectorAll('.tableField2');
        let colsData3 = rows3[i].querySelectorAll('.tableField2alt');
        console.log(colsData3.length)
        // Get each column data
        let csvrow = [];
        for (let j = 0; j < colsData.length; j++) {
            if(colsData[j].value===""){
                csvrow.push("NA");
            }else{
                csvrow.push(colsData[j].value);
            }
        }
        for (let j = 0; j < colsData2.length; j++) {
            if(colsData2[j].value===""){
                csvrow.push("NA");
            }else{
                csvrow.push(colsData2[j].value);
            }
        }
        for (let j = 0; j < colsData3.length; j++) {
            if(colsData3[j].value===""){
                csvrow.push("NA");
            }else{
                csvrow.push(colsData3[j].value);
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