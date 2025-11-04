import { dialog } from '@electron/remote'
import fs from 'fs'
import path from 'path'
const {convertCsvToXlsx} = require('@aternus/csv-to-xlsx');
const isDevelopment = process.env.NODE_ENV !== 'production'

/**
 * Replace ; with , in a CSV file
 * @param {string} inputPath - Path to the input CSV file
 * @param {string} outputPath - Path to the output CSV file
 */
function replaceSeparator(inputPath, outputPath) {
    fs.readFile(inputPath, 'utf8', (err, data) => {
        if (err) {
        console.error('Error reading file:', err);
        return;
        }

        const updatedData = data.replace(/;/g, ',');

        fs.writeFile(outputPath, updatedData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }

        console.log(`Separator replaced and saved to: ${outputPath}`);
        });
    });
}

export default async function exportFullOutputExcel(fullTempPathDir) {
    
    console.log("exportFullOutputExcel")
    let btn_obj = document.getElementById("ExcelExportBtnConc")
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Processing Excel file..."

    // check path results file (goejson)
    var tmpdir = fullTempPathDir;
    var lastChar = tmpdir.substr(-1); 
    if (lastChar != '/') tmpdir = tmpdir + '/';
    let pts_file = path.join(tmpdir,'pts_out.xlsx');
    let pts_csv = path.join(tmpdir,'pts_out.csv');
    let pts_csv_comma = path.join(tmpdir,'pts_out_comma.csv');
    if(isDevelopment) pts_file = path.join(tmpdir,'pts_out.xlsx');
    console.log("pts_csv: ",pts_csv);
    console.log("pts_csv_comma: ",pts_csv_comma);
    console.log("pts_file: ",pts_file);

    // remove old xlsx file if exists
    if(fs.existsSync(pts_file)) {
        fs.unlinkSync(pts_file);
        console.log("Removed old xlsx file")
    }

    // remove old pts_csv_comma
    if(fs.existsSync(pts_csv_comma)) {
        fs.unlinkSync(pts_csv_comma);
        console.log("Removed old csv_comma file")
    }

    // sleep for 1 second to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Waited 1 second")

    // replace ; with , in pts_csv and save as pts_csv_comma
    replaceSeparator(pts_csv, pts_csv_comma);

    // sleep for 1 second to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Waited 1 second")

    // convert csv to xlsx if csv exists
    if(fs.existsSync(pts_csv_comma)) {
        convertCsvToXlsx(pts_csv_comma, pts_file)
        console.log("Converted csv to xlsx")
    }else{
        console.log("No csv file found to convert to xlsx")
    }

    // check if file exists
    if (!fs.existsSync(pts_file)) {
        console.log('File not found!');
        dialog.showMessageBox({
          title: 'No results found',
          message: 'Unable to generate file, no results found. Please run ePiE first.',
          buttons: ['OK']
        })
        return;
    }

    // output dialog options
    var options = {
        title: "Save result file",
        defaultPath : "ePiE_spatial_prediction.xlsx",
        buttonLabel : "Save",
        filters :[
            {name: 'xlsx', extensions: ['xlsx']},
            {name: 'All Files', extensions: ['*']}
        ]
    };

    // show save dialog
    dialog.showSaveDialog(null, options).then(({ filePath }) => {
        if(filePath === undefined || filePath==""){
            console.log("No file selected");
            return;
        }else{
            if(fs.existsSync(pts_file)) {
                fs.copyFileSync(pts_file, filePath);
            }
        }
    });

    btn_obj.style.color = "black"
    btn_obj.style.background = "white"
    btn_obj.innerText = "Export full data as Excel"
}
