/* eslint-disable */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// load accessbasindb module
const helper = require('./AccessBasinDB_helper');

// Default values for testing (commented in original Python)
/*
const basinDir = "/Users/osx/Documents/Work/ePiE_run_translation/basins/";
const tmpDir = "/Users/osx/Documents/Work/ePiE_run_translation/tmp_data/";
let basinIdsStr, resourcesBasinPath, filesRequestStr;
basinIdsStr = "c(107287,000012_1029578_sc)";
resourcesBasinPath = basinDir;
filesRequestStr = "c(pts,hl,avg,mi,ma)";
AccessBasinDB(basinIdsStr, resourcesBasinPath, filesRequestStr, tmpDir);
*/

// Main function
export default async function AccessBasinDB(basinIdsStr, resourcesBasinPath, filesRequestStr, tmpPath, btnSelector, cmd_activit_id) {

    let Progress_bar = document.getElementById("myBar");
    let CMD_out_obj = document.getElementById(cmd_activit_id);
    let btn_obj = document.getElementById(btnSelector)
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Run ePiE: processing, please wait"
    CMD_out_obj.innerText += "Accessing basin database...\n";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;

    // Schema definitions
    const schema = { basin_id: 'str', file_index: 'str' };
    const ptsSchema = {
        'ID': 'str', 'x': 'float', 'y': 'float', 'ID_nxt': 'str', 'Down_type': 'str', 
        'T_AIR': 'float', 'Wind': 'float', 'line_node': 'str', 'lake_out': 'int', 
        'lake_in': 'int', 'slope': 'float', 'Pt_type': 'str', 'Dist_down': 'float', 
        'dist_nxt': 'float', 'HL_ID_new': 'int', 'uwwID': 'str', 'rptMStateK': 'str', 
        'uwwCode': 'str', 'uwwName': 'str', 'uwwCollect': 'str', 'uwwLatit_1': 'str', 
        'uwwLongi_1': 'str', 'uwwLoadEnt': 'Int64', 'uwwCapacit': 'Int64', 
        'uwwPrimary': 'Int64', 'uwwSeconda': 'Int64', 'f_STP': 'float', 
        'F_direct': 'float', 'basin_id': 'str', 'LD_new': 'float', 'aggID': 'str',
        'uwwOtherTr': 'Int64', 'uwwNRemova': 'Int64', 'uwwPRemova': 'Int64', 
        'uwwUV': 'Int64', 'uwwChlorin': 'Int64', 'uwwOzonati': 'Int64', 
        'uwwSandFil': 'Int64', 'uwwMicroFi': 'Int64', 'uwwOther': 'Int64', 
        'uwwSpecifi': 'str', 'aggCode': 'str', 'aggName': 'str', 'aggLatit_1': 'str', 
        'aggLongi_1': 'str', 'aggGenerat': 'str', 'snap_dist': 'float', 'stop': 'Int64', 
        'Freq': 'Int64', 'flow_acc': 'float', 'pH': 'float'
    };

    try {

        // Parse file request
        const filesRequest = helper.parseBasinVector(filesRequestStr);

        // Format basin IDs (to array)
        let basinIds = helper.parseBasinVector(basinIdsStr);

        // Remove duplicates and ensure all are strings
        basinIds = basinIds.map(x => String(x));
        basinIds = helper.getUniqueValues(basinIds);

        // Get file indices
        const basinIndexFile = path.join(resourcesBasinPath, "BasinIndex.csv");
        const basinIndexData = await helper.readCsvFile(basinIndexFile);

        // Filter basin index by basin IDs
        const basinIndex = basinIndexData.filter(row => {
            const basinId = String(row.basin_id);
            return basinIds.includes(basinId);
        });

        console.log('Basin Index:', basinIndex);

        // Add file paths to basin index
        basinIndex.forEach(row => {
            row.pts_file = path.join(resourcesBasinPath, `pts_${row.file_index}.csv`);
            row.hl_file = path.join(resourcesBasinPath, `hl_${row.file_index}.csv`);
            row.avg_file = path.join(resourcesBasinPath, `avg_${row.file_index}.csv`);
            row.mi_file = path.join(resourcesBasinPath, `mi_${row.file_index}.csv`);
            row.ma_file = path.join(resourcesBasinPath, `ma_${row.file_index}.csv`);
        });

        // Process pts files
        if (filesRequest.includes("pts")) {
            const uniquePtsFiles = helper.getUniqueValues(basinIndex.map(row => row.pts_file));
            const ptsData = await helper.readFilesAsPdSubsetByBasinIdWithSchema(uniquePtsFiles, basinIds, ptsSchema);
            const ptsJsonFile = path.join(tmpPath, "pts.json");
            await helper.writeToJsonFile(ptsData, ptsJsonFile);
            console.log(`Processed ${ptsData.length} pts records`);
        }

        // Process hl files
        if (filesRequest.includes("hl")) {
            const uniqueHlFiles = helper.getUniqueValues(basinIndex.map(row => row.hl_file));
            const hlData = await helper.readFilesAsPdSubsetByBasinId(uniqueHlFiles, basinIds);
            const hlJsonFile = path.join(tmpPath, "hl.json");
            await helper.writeToJsonFile(hlData, hlJsonFile);
            console.log(`Processed ${hlData.length} hl records`);
        }

        // Process avg files
        if (filesRequest.includes("avg")) {
            const uniqueAvgFiles = helper.getUniqueValues(basinIndex.map(row => row.avg_file));
            const avgData = await helper.readFilesAsPdSubsetByBasinId(uniqueAvgFiles, basinIds);
            const avgJsonFile = path.join(tmpPath, "avg.json");
            await helper.writeToJsonFile(avgData, avgJsonFile);
            console.log(`Processed ${avgData.length} avg records`);
        }

        // Process mi files
        if (filesRequest.includes("mi")) {
            const uniqueMiFiles = helper.getUniqueValues(basinIndex.map(row => row.mi_file));
            const miData = await helper.readFilesAsPdSubsetByBasinId(uniqueMiFiles, basinIds);
            const miJsonFile = path.join(tmpPath, "mi.json");
            await helper.writeToJsonFile(miData, miJsonFile);
            console.log(`Processed ${miData.length} mi records`);
        }

        // Process ma files
        if (filesRequest.includes("ma")) {
            const uniqueMaFiles = helper.getUniqueValues(basinIndex.map(row => row.ma_file));
            const maData = await helper.readFilesAsPdSubsetByBasinId(uniqueMaFiles, basinIds);
            const maJsonFile = path.join(tmpPath, "ma.json");
            await helper.writeToJsonFile(maData, maJsonFile);
            console.log(`Processed ${maData.length} ma records`);
        }

        btn_obj.style.color = "black"
        btn_obj.style.background = "white"
        btn_obj.innerText = "Run ePiE"
        console.log('Processing completed successfully!');
        //Progress_bar.style.transition = 'width 1s ease-in-out';
        Progress_bar.style.width = 20 + "%";
        return(true);

    } catch (error) {

        btn_obj.style.color = "black"
        btn_obj.style.background = "white"
        btn_obj.innerText = "Run ePiE"
        console.error('Error during processing:', error);
        // Progress_bar.style.transition = 'width 0s ease-in-out';
        Progress_bar.style.width = 0 + "%";
        process.exit(1);
        return(false);
    }



}
