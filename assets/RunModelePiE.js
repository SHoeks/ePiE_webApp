 /* eslint-disable */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Import the functions from separate modules
const funct = require('./RunModelePiE_defs');
const helper = require('./RunModelePiE_helper');
import CSVtoGeoJSON from '../CSVtoGeoJSON.js'

// Use default values for testing
/*
const tmpDir = "/Users/osx/Documents/Work/ePiE_run_translation/tmp_data/";
let apiPropertiesFile = path.join(tmpDir, "API_derived.csv");
let consumptionFile = path.join(tmpDir, "Cons_run.csv");
let basinIds = "c(107287,000012_1029578_sc)"; // York for testing
let flowInput = "Average";
let wwtpRemovalFile = path.join(tmpDir, "RmFrac_run.csv");
let tmpPath = tmpDir;
run_ePiE_js(apiPropertiesFile, consumptionFile, basinIds, flowInput, wwtpRemovalFile, tmpPath);
*/

/* eslint-disable */
export default async function RunModelePiE(apiPropertiesFile, consumptionFile, basinIds, flowInput, wwtpRemovalFile, tmpPath, btnSelector, cmd_activit_id) {

    let Progress_bar = document.getElementById("myBar");
    let CMD_out_obj = document.getElementById(cmd_activit_id);
    let btn_obj = document.getElementById(btnSelector)
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Run ePiE: processing, please wait"

    console.log('API properties file:', apiPropertiesFile);
    console.log('Consumption data file:', consumptionFile);
    console.log('Basin ID:', basinIds);
    console.log('Flow input:', flowInput);
    console.log('WWTP removal file:', wwtpRemovalFile);
    console.log('tmp path:', tmpPath);

    // Parse basin IDs
    const basinIdsArray = funct.parseBasinVector(basinIds);
    const uniqueBasinIds = [...new Set(basinIdsArray)];
    console.log('Unique basin IDs:', uniqueBasinIds);

    // Determine flow paths
    const ptsPath = path.join(tmpPath, "pts.json");
    const hlPath = path.join(tmpPath, "hl.json");
    const ptsAvgPath = path.join(tmpPath, "avg.json");
    const ptsMaxPath = path.join(tmpPath, "ma.json");
    const ptsMinPath = path.join(tmpPath, "mi.json");

    // Determine flow selection
    let flowSelect = "average";
    if (flowInput === "Average") flowSelect = "average";
    if (flowInput === "Max") flowSelect = "maximum";
    if (flowInput === "Min") flowSelect = "minimum";
    console.log("Selected flow condition:", flowSelect);

    // Open API-specific data
    CMD_out_obj.innerText += "Reading chemical data...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    console.log("Reading chemical data...");
    const chem = await helper.readCsvFile(apiPropertiesFile, ';');

    // Read custom WWTP removal properties
    CMD_out_obj.innerText += "Reading WWTP removal data...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    console.log("Reading WWTP removal data...");
    const wwtpRemoval = await helper.readCsvFile(wwtpRemovalFile, ';');

    // Rename the first column to "API"
    if (wwtpRemoval.length > 0) {
        const firstCol = Object.keys(wwtpRemoval[0])[0];
        wwtpRemoval.forEach(row => {
            if (firstCol !== 'API') {
                row.API = row[firstCol];
                delete row[firstCol];
            }
        });

        // Convert removal fractions to numeric
        wwtpRemoval.forEach(row => {
            row.Primary_removal_fraction = helper.toNumeric(row.Primary_removal_fraction);
            row.Secondary_removal_fraction = helper.toNumeric(row.Secondary_removal_fraction);
        });

        // Check if all values in both removal columns are null
        const checkWwtpRm = wwtpRemoval.every(row => 
            row.Primary_removal_fraction === null && row.Secondary_removal_fraction === null
        );

        if (!checkWwtpRm) {
            // Create mapping from API to removal fractions
            const primaryMap = {};
            const secondaryMap = {};
            
            wwtpRemoval.forEach(row => {
                primaryMap[row.API] = row.Primary_removal_fraction;
                secondaryMap[row.API] = row.Secondary_removal_fraction;
            });

            // Assign mapped values to new columns in chem
            chem.forEach(row => {
                row.custom_wwtp_primary_removal = primaryMap[row.API] || null;
                row.custom_wwtp_secondary_removal = secondaryMap[row.API] || null;
            });
        }
    }

    // Complete missing values in chem data
    const completedChem = funct.completeChemProperties(chem);
    completedChem.forEach(row => {row.API_metab = null;});
    console.log("- WWTP primary removal fraction:", completedChem[0].custom_wwtp_primary_removal);
    console.log("- WWTP secondary removal fraction:", completedChem[0].custom_wwtp_secondary_removal);
    CMD_out_obj.innerText += "- WWTP primary removal fraction: " + completedChem[0].custom_wwtp_primary_removal + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    CMD_out_obj.innerText += "- WWTP secondary removal fraction: " + completedChem[0].custom_wwtp_secondary_removal + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Load consumption data
    CMD_out_obj.innerText += "Reading consumption data...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    console.log("Reading consumption data...");
    const cons = await helper.readCsvFile(consumptionFile, ';');

    // Process consumption data
    if (cons.length > 0) {
        console.log("Raw consumption data sample:", cons[0]);
        
        // The CSV has been parsed as: Country, WWTPs, Ibuprofen
        // We want to rename Country to cnt and remove WWTPs, convert Ibuprofen to numeric
        cons.forEach(row => {
            // Rename Country to cnt
            row.cnt = row.Country;
            delete row.Country;
            
            // Remove WWTPs column
            delete row.WWTPs;
            
            // Convert chemical values to numeric
            for (const [key, value] of Object.entries(row)) {
                if (key !== 'cnt') {
                    row[key] = helper.toNumeric(value);
                }
            }
        });
        
        console.log("Processed consumption data sample:", cons[0]);
        console.log("Available countries in consumption data:", cons.map(row => row.cnt));
    }
    //Progress_bar.style.transition = 'width 1s ease-in-out';
    Progress_bar.style.width = 25 + "%";

    // Load basin data
    console.log("Processing basin data...");
    CMD_out_obj.innerText += "Processing basin data..\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    console.log(ptsPath);
    console.log(hlPath);
    const pts = await helper.readJsonFile(ptsPath);
    const hl = await helper.readJsonFile(hlPath);
    console.log("- n river nodes:", pts.length);

    // Filter basins by basin IDs
    const basins = { pts, hl };
    basins.pts = helper.filterDataFrame(basins.pts, 'basin_id', uniqueBasinIds);
    basins.hl = helper.filterDataFrame(basins.hl, 'basin_id', uniqueBasinIds);
    console.log("- basin ids:", helper.getUniqueValues(basins.pts, 'basin_id'));
    console.log("- n basins:", helper.getUniqueValues(basins.pts, 'basin_id').length);
    console.log("- n river nodes:", basins.pts.length);
    console.log("- n lakes:", basins.hl.length);
    
    CMD_out_obj.innerText += "- basin ids: " + helper.getUniqueValues(basins.pts, 'basin_id') + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    CMD_out_obj.innerText += "- n basins: " + helper.getUniqueValues(basins.pts, 'basin_id').length + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    CMD_out_obj.innerText += "- n river nodes: " + basins.pts.length + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    CMD_out_obj.innerText += "- n lakes: " + basins.hl.length + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Remove unnamed columns
    basins.pts = helper.removeUnnamedColumns(basins.pts);
    basins.hl = helper.removeUnnamedColumns(basins.hl);

    // Check consumption data
    const checkedCons = funct.checkConsumptionData(basins.pts, completedChem, cons);
    console.log("checkedCons: ",checkedCons);

    // Load river flow
    console.log("Loading flow data...");
    CMD_out_obj.innerText += "Loading flow data...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    const flowFiles = {
        "average": ptsAvgPath,
        "maximum": ptsMaxPath,
        "minimum": ptsMinPath
    };

    const flowFile = flowFiles[flowSelect];
    let flow = await helper.readJsonFile(flowFile);
    flow = helper.removeUnnamedColumns(flow);

    // Attach flow to basin data
    basins.pts = helper.mergeDataFrames(
        basins.pts,
        flow.map(row => ({
            ID: row.ID,
            basin_id: row.basin_id,
            Q: row.Q,
            V: row.V,
            H: row.H,
            V_NXT: row.V_NXT
        })),
        ['ID', 'basin_id'],
        'left'
    );
    //Progress_bar.style.transition = 'width 1s ease-in-out';
    await new Promise(resolve => setTimeout(resolve, 50));
    Progress_bar.style.width = 35 + "%";

    console.log("Setting local parameters...");
    CMD_out_obj.innerText += "Setting local parameters...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    const ptsHl = funct.setLocalParametersCustomRemovalFast3(basins.pts, basins.hl, checkedCons, completedChem, 0);
    //Progress_bar.style.transition = 'width 1s ease-in-out';
    Progress_bar.style.width = 40 + "%";
    // check local params
    // ptsHl.pts[0]["ID"]
    // ptsHl.pts[2]["k"]
    // console.log("ptsHl.pts: ", ptsHl.pts);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Compute environmental concentrations
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log("Computing environmental concentrations...");
    CMD_out_obj.innerText += "Computing environmental concentrations...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 50));
    let results = funct.computeEnvConcentrationsV4Test(ptsHl.pts, ptsHl.hl, true, Progress_bar, CMD_out_obj);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Extract and write results
    console.log("Writing results...");
    CMD_out_obj.innerText += "\nWriting results...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    const ptsResults = results.pts.map(row => ({
        ID: row.ID,
        basin_ID: row.basin_ID,
        Pt_type: row.Pt_type,
        HylakId: row.HylakId,
        Q: row.Q,
        Ew: row.Ew,
        C_w: row.C_w,
        C_sd: row.C_sd,
        x: row.x,
        y: row.y
    }));

    const dirName = path.dirname(consumptionFile);
    const outfile = path.join(dirName, "pts_out.csv");

    await helper.writeCsvFile(ptsResults, outfile, ';');

    console.log(`Results written to: ${outfile}`);
    console.log("Finished!");

    // read outputs
    let geojsonpath = path.join(dirName, 'pts.geojson');
    let csvpath = path.join(dirName, 'pts_out.csv');
    console.log("csvpath: ",csvpath);
    console.log("geojsonpath: ",geojsonpath);
    let read_stream = fs.readFileSync(csvpath);
    let csv_string = read_stream.toString();
    //console.log(csv_string);
    CSVtoGeoJSON(csv_string, geojsonpath);

    // deactivate button
    document.getElementById(btnSelector).style.color = "black"
    document.getElementById(btnSelector).style.background = "white"
    document.getElementById(btnSelector).innerText = "Run ePiE"
    CMD_out_obj.innerText += "Done!\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

}


