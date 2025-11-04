import { dialog } from '@electron/remote'
import xlsx from 'node-xlsx';

import addAPItableRow from './addAPItableRow.js';
import removeLastAPItableRow from './removeLastAPItableRow.js';
import copyOverAPI_ID from './copyOverAPI_ID.js'

export default function loadExcelData(){

    console.log('loadFile confirmation');
    const options = {
        title: 'Select a Excel file',
        filters: [
            { name: 'Excel files', extensions: ['xlsx'] },
            { name: 'CSV files', extensions: ['csv'] }
        ]
    };

    var path = dialog.showOpenDialogSync(options);
    if(path === undefined){
        console.log('No file selected');
        return;
    }
    console.log(path[0]);
    var workSheetsFromFile = xlsx.parse(path[0]);
    console.log(workSheetsFromFile[0].data);

    var dataHeader = workSheetsFromFile[0].data[0];
    console.log(dataHeader);
    let API_name_idx = dataHeader.findIndex(x=>x=="API");
    console.log("API_name_idx:",API_name_idx);
    var dataRows = workSheetsFromFile[0].data.length - 1;
    let API_names = [];
    for(let i = 1; i < workSheetsFromFile[0].data.length; i++){
      if(workSheetsFromFile[0].data[i][API_name_idx] != undefined & workSheetsFromFile[0].data[i][API_name_idx] != "" & workSheetsFromFile[0].data[i][API_name_idx] != "NA"){
        API_names.push(workSheetsFromFile[0].data[i][API_name_idx]);
      }
    }
    console.log("nAPIs: ",dataRows);
    console.log("API_names: ",API_names);

    if(API_names.length > 1){
      dialog.showMessageBox({
        title: 'In development!',
        message: 'The current ePiE interface only supports a run for the single API.\n\nSelect an API loaded from the Excel file from the list below.',
        buttons: API_names,
      }).then(({ response }) => {
        console.log('User selected API:', API_names[response]);
        
        var ai = response;
        dataRows = dataRows[ai]; // only first API
        console.log(dataRows);
    
        var match = {name : "API", cas : "CAS", class : "class", MW : "MW", KOW_n : "KOW_n", Pv : "Pv", S : "S", pKa : "pKa", f_u : "f_uf", f_f : "k_bio_wwtp"};
        console.log(match);
        
        var ObjtableFieldInit = document.getElementsByClassName("tableField");
        var lastObjStringId = String(ObjtableFieldInit[ObjtableFieldInit.length-1].id);
        console.log(lastObjStringId);
        let currentNRows = lastObjStringId.split("_row")[1];
        for(let i = 0; i < currentNRows; i++) removeLastAPItableRow();
    
        ObjtableFieldInit = document.getElementsByClassName("tableField");
        lastObjStringId = String(ObjtableFieldInit[ObjtableFieldInit.length-1].id);
        currentNRows = lastObjStringId.split("_row")[1];
        for(let rowIndex = 0; rowIndex<(dataRows-currentNRows); rowIndex++) addAPItableRow();
        
        var ObjtableField = document.getElementsByClassName("tableField");
        var rowIndexSelect = ai+1;
        for(let i = 0; i < ObjtableField.length; i++){
          let objStringId = String(ObjtableField[i].id);
          let colName = objStringId.split("_row")[0];
          let rowIndex = objStringId.split("_row")[1];
          console.log(colName + ": "+ rowIndex);
          let headerString = match[colName];
          let colIndex = dataHeader.findIndex(x=>x==headerString);
          //console.log(headerString + " - " + colIndex + " - " + objStringId);
          //document.getElementById(ObjtableField[i].id).value = workSheetsFromFile[0].data[rowIndex][colIndex]; 
          if(workSheetsFromFile[0].data[rowIndexSelect][colIndex]==undefined| workSheetsFromFile[0].data[rowIndexSelect][colIndex]==""  | workSheetsFromFile[0].data[rowIndexSelect][colIndex]=="NA"){
            document.getElementById(ObjtableField[i].id).value = ""
            document.getElementById(ObjtableField[i].id).setAttribute('value',''); 
          }else{
            document.getElementById(ObjtableField[i].id).value = workSheetsFromFile[0].data[rowIndexSelect][colIndex];
            document.getElementById(ObjtableField[i].id).setAttribute('value',workSheetsFromFile[0].data[rowIndexSelect][colIndex]); 
          }
        }
    
        // fill table 2 if possible
        var targetDiv = document.getElementsByClassName("tableField2")
        var colIndex;
        for(let i = 0; i < targetDiv.length; i++) {
          let colName = targetDiv[i].id.split("_row")[0];
          let rowIndex = targetDiv[i].id.split("_row")[1];
          console.log(rowIndex);
          colIndex = dataHeader.findIndex(x=>x==colName);
          if(workSheetsFromFile[0].data[rowIndexSelect][colIndex]==undefined  | workSheetsFromFile[0].data[rowIndexSelect][colIndex]==""  | workSheetsFromFile[0].data[rowIndexSelect][colIndex]=="NA"){
            targetDiv[i].value = ""
            targetDiv[i].setAttribute('value',''); 
          }else{
            targetDiv[i].value = workSheetsFromFile[0].data[rowIndexSelect][colIndex];
            targetDiv[i].setAttribute('value',workSheetsFromFile[0].data[rowIndexSelect][colIndex]); 
          }
          console.log(targetDiv[i].id + " - " + colIndex + " - " + workSheetsFromFile[0].data[rowIndexSelect][colIndex]);
          targetDiv[i].style.color = "black";
        }
    
        // fill table 2 if possible
        targetDiv = document.getElementsByClassName("tableField2alt")
        for(let i = 0; i < targetDiv.length; i++) {
          let colName = targetDiv[i].id.split("_row")[0];
          let rowIndex = targetDiv[i].id.split("_row")[1];
          console.log(rowIndex);
          colIndex = dataHeader.findIndex(x=>x==colName);
          if(workSheetsFromFile[0].data[rowIndexSelect][colIndex]==undefined  | workSheetsFromFile[0].data[rowIndexSelect][colIndex]==""  | workSheetsFromFile[0].data[rowIndexSelect][colIndex]=="NA"){
            targetDiv[i].value = ""
            targetDiv[i].setAttribute('value',''); 
          }else{
            targetDiv[i].value = workSheetsFromFile[0].data[rowIndexSelect][colIndex];
            targetDiv[i].setAttribute('value',workSheetsFromFile[0].data[rowIndexSelect][colIndex]); 
          }
          console.log(targetDiv[i].id + " - " + colIndex + " - " + workSheetsFromFile[0].data[rowIndexSelect][colIndex]);
          targetDiv[i].style.color = "black";
        }
    
        copyOverAPI_ID();
    
      });
    }



    
}
