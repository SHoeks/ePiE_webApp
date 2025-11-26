 /* eslint-disable */
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Import the functions from separate modules
import * as  funct from './RunModelePiE_defs.js';
import  * as helper from'./RunModelePiE_helper.js';
// import * as CSVtoGeoJSON from './CSVtoGeoJSON.js'

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

// r functions wrappers
async function runEPIEWrapper(){

    console.log('runEPIEWrapper!');

    // show progress
    let Progress_bar = document.getElementById("myBar");
    let btn_obj = document.getElementById("run_epie_btn")
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Running ePiE, please wait..."
    
    // get settings
    const settings = getAllSettings();
    if(!settings){ // error occurred
        btn_obj.style.color = "black"
        btn_obj.style.background = "white"
        btn_obj.innerText = "Run ePiE"
        return;
    }  
    console.log("runEPIEWrapper, settings: ",settings);
    
    // get file maps and basin mappings
    const {unique_pts_files,unique_hl_files,unique_flow_files,pts_basin_map,hl_basin_map,flow_basin_map} = getFileMaps();

    // reset progress indicators
    if(unique_pts_files.length === 0){
        btn_obj.style.color = "black";btn_obj.style.background = "white";btn_obj.innerText = "Run ePiE";
        console.log('runEPIEWrapper, no basins selected or error occurred while getting file maps.');
        return; // No basins selected or error occurred
    }
    
    // read pts files
    await readptsFiles(unique_pts_files, pts_basin_map);
    
    // read hl files
    await readhlFiles(unique_hl_files, hl_basin_map);
    
    // read flow files
    await readflowFiles(unique_flow_files, flow_basin_map);
    
    // fill gaps data
    completeData();

    // rbind data
    rbindBasinData();

    // merge basin data
    const basinData = {
        pts: global_pts_data,
        flow: global_flow_data,
        hl: global_hl_data
    }
    console.log("BasinData:", basinData);

    // run ePiE model
    await RunModelePiE(settings, basinData);

    // reset progress indicators
    btn_obj.innerText = "Run ePiE"
    console.log('runEPIEWrapper completed successfully!');
    //Progress_bar.style.transition = 'width 1s ease-in-out';
    // Progress_bar.style.width = 20 + "%";
    btn_obj.style.color = "black"
    btn_obj.style.background = "white"

}


/* eslint-disable */
async function RunModelePiE(settings, basinData) {

    let CMD_out_obj = document.getElementById("cmd_out");
    CMD_out_obj.innerText = "";
    let Progress_bar = document.getElementById("myBar");
    Progress_bar.style.width = 0 + "%";
    let btn_obj = document.getElementById("run_epie_btn")
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Run ePiE: processing, please wait"
    
    // wait 1+0.5 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    CMD_out_obj.innerText = "Starting ePiE model run...\n";
    CMD_out_obj.innerText += "\n";
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine flow selection
    let flowSelect = "average";
    if (settings.flowSelection === "Average") flowSelect = "average";
    if (settings.flowSelection === "Max") flowSelect = "maximum";
    if (settings.flowSelection === "Min") flowSelect = "minimum";
    console.log("Selected flow condition:", flowSelect);

    // merge chem data
    let chem = [{ ...settings.apiProperties, ...settings.wwtpRemovalData }];
    console.log("Merged chemical data:", chem);

    // // Open API-specific data
    const API_name = chem[0].API;
    CMD_out_obj.innerText += "Reading chemical data...\n";
    console.log("Reading chemical data...");
    await new Promise(resolve => setTimeout(resolve, 50));
    CMD_out_obj.innerText += "- selected API: " + API_name + "\n";
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // // Read custom WWTP removal properties
    await new Promise(resolve => setTimeout(resolve, 50));
    Progress_bar.style.width = 10 + "%";
    CMD_out_obj.innerText += "Reading WWTP removal data...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 50));


    // Complete missing values in chem data
    const completedChem = funct.completeChemProperties(chem);
    completedChem.forEach(row => {row.API_metab = null;});
    console.log("- WWTP primary removal fraction:", completedChem[0].custom_wwtp_primary_removal);
    console.log("- WWTP secondary removal fraction:", completedChem[0].custom_wwtp_secondary_removal);
    CMD_out_obj.innerText += "- WWTP primary removal fraction: " + completedChem[0].custom_wwtp_primary_removal + "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    CMD_out_obj.innerText += "- WWTP secondary removal fraction: " + completedChem[0].custom_wwtp_secondary_removal + "\n";
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Load consumption data
    CMD_out_obj.innerText += "Reading consumption data...\n";

    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    console.log("Reading consumption data...");
    const constmp = settings.consumptionData;
    console.log("Raw consumption data:", constmp);
    
    // convert consumption data to desired format
    const cons = [];
    const conskeys = Object.keys(constmp);
    for(let i=0; i<conskeys.length; i++){
        cons[i] = {};
        cons[i]["cnt"] = conskeys[i];
        cons[i][API_name] = helper.toNumeric(constmp[conskeys[i]]);
    }
    console.log("cons reformatted", cons);
    CMD_out_obj.innerText += "- consumption data provided for " + cons.length + " countries\n";
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    //Progress_bar.style.transition = 'width 1s ease-in-out';
    await new Promise(resolve => setTimeout(resolve, 50));
    Progress_bar.style.width = 25 + "%";

    // Process basin data
    let uniqueBasinIds = settings.basinIDs.selected_basins;
    console.log("Processing basin data...");
    CMD_out_obj.innerText += "Processing basin data..\n";
    // CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 50));

    // Filter basins by basin IDs
    const basins = { pts: basinData["pts"], hl: basinData["hl"] };
    basins.pts = helper.filterDataFrame(basins.pts, 'basin_id', uniqueBasinIds);
    basins.hl = helper.filterDataFrame(basins.hl, 'basin_id', uniqueBasinIds);
    basinData["flow"] = helper.filterDataFrame(basinData["flow"], 'basin_id', uniqueBasinIds);
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
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Remove unnamed columns
    basins.pts = helper.removeUnnamedColumns(basins.pts);
    basins.hl = helper.removeUnnamedColumns(basins.hl);

    // Check consumption data
    const checkedCons = funct.checkConsumptionData(basins.pts, completedChem, cons);
    console.log("checkedCons: ",checkedCons);

    // Load river flow
    console.log("Merging flow data...");
    CMD_out_obj.innerText += "Merging flow data...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    let flow = basinData["flow"];
    flow = helper.filterDataFrame(flow, 'basin_id', uniqueBasinIds);
    console.log("- n flow records:", flow.length);
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Attach flow to basin data
    basins.pts = helper.mergeDataFrames(basins.pts, basinData["flow"]);
    Progress_bar.style.width = 35 + "%";

    // Set local parameters (apply to basin data)
    console.log("Setting local parameters...");
    CMD_out_obj.innerText += "Setting local parameters...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    const ptsHl = funct.setLocalParametersCustomRemovalFast3(
        basins.pts, 
        basins.hl, 
        checkedCons, 
        completedChem, 
        0
    );
    // Progress_bar.style.transition = 'width 1s ease-in-out';
    await new Promise(resolve => setTimeout(resolve, 50));
    Progress_bar.style.width = 40 + "%";
    await new Promise(resolve => setTimeout(resolve, 50));
    // // check local params
    // // ptsHl.pts[0]["ID"]
    // // ptsHl.pts[2]["k"]
    // // console.log("ptsHl.pts: ", ptsHl.pts);
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Compute environmental concentrations
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log("Computing environmental concentrations...");
    CMD_out_obj.innerText += "Computing environmental concentrations...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 50));
    let results = await funct.computeEnvConcentrationsV4Test(ptsHl.pts, ptsHl.hl, Progress_bar, CMD_out_obj);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Extract and write results
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log("Saving results...");
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.innerText += "\n";
    CMD_out_obj.innerText += "Saving results...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    await new Promise(resolve => setTimeout(resolve, 50));

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

    epie_results = ptsResults;
    console.log("ePiE results:", ptsResults);
    Progress_bar.style.width = 100 + "%";

    // // read outputs
    // let geojsonpath = path.join(dirName, 'pts.geojson');
    // let csvpath = path.join(dirName, 'pts_out.csv');
    // console.log("csvpath: ",csvpath);
    // console.log("geojsonpath: ",geojsonpath);
    // let read_stream = fs.readFileSync(csvpath);
    // let csv_string = read_stream.toString();
    // //console.log(csv_string);
    // CSVtoGeoJSON(csv_string, geojsonpath);

    // // deactivate button
    // document.getElementById(btnSelector).style.color = "black"
    // document.getElementById(btnSelector).style.background = "white"
    // document.getElementById(btnSelector).innerText = "Run ePiE"
    // CMD_out_obj.innerText += "Done!\n";
    // CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // clear variables
    global_flow_data = [];
    global_hl_data = [];
    global_pts_data = [];
    basinData = {};


}


// expose to global
window.runEPIEWrapper = runEPIEWrapper;

