// Main function
function AccessBasinDB() {

    let Progress_bar = document.getElementById("myBar");
    let btn_obj = document.getElementById("gen_cons_table_btn")
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Run ePiE: processing, please wait"


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

    const basinSetObj = document.getElementById('selectedBasinsDataFull');
    const basin_indx = basinSetObj.textContent;
    
    // no data check
    if(basin_indx == "{Undefined}"){
        console.log("No basins selected in AccessBasinDB");
        alert("No basins selected, please select at least one basin to generate the consumption data table");
        return undefined;
    }

    const basin_indx_array = JSON.parse(basin_indx).selected_basins;
    console.log("Basin indices to process:", basin_indx_array);

    const basin_file_idx = [];
    for(let i=0; i<basin_indx_array.length; i++){
        let basin_id = basin_indx_array[i];
        let file_idx = BasinIndex[basin_id][0];
        if(file_idx !== undefined){
            basin_file_idx.push({ basin_id: basin_id, file_index: file_idx });
        } else {
            console.warn(`Basin ID ${basin_id} not found in BasinIndex`);
        }
    }

    console.log('Basin File Indices:', basin_file_idx);

    const filePaths = fileConstructor();
    console.log("File paths from fileConstructor:", filePaths);

    var flow_selector = "avg"
    const flowDatObj = document.getElementById('selectedFlowDataFull');
    const flow_selector_str = flowDatObj.textContent;
    if(flow_selector_str != "{Undefined}"){
        let flow_selector_json = JSON.parse(flow_selector_str);
        let flow_condition = flow_selector_json.flow_condition;
        if(flow_condition == "Average"){
            flow_selector = "avg";
        } else if(flow_condition == "Min"){
            flow_selector = "mi";
        } else if(flow_condition == "Max"){
            flow_selector = "ma";
        } else {
            flow_selector = "avg";
        }
    }
    console.log("Selected flow condition:", flow_selector);
    
    const basin_file_idx_with_file = [];
    for(let i=0; i<basin_indx_array.length; i++){
        let basin_id = basin_indx_array[i];
        let file_idx = BasinIndex[basin_id][0];
        if(file_idx !== undefined){
            basin_file_idx_with_file.push({ 
                basin_id: basin_id, 
                file_index: file_idx, 
                pts_file_path: filePaths["pts"][file_idx],
                hl_file_path: filePaths["hl"][file_idx],
                flow_file_path: filePaths[flow_selector][file_idx]
            });
        } else {
            console.warn(`Basin ID ${basin_id} not found in BasinIndex`);
        }
    }
    console.log('Basin File Indices with File Paths:', basin_file_idx_with_file);


    
    // try {

    

    //     // // Parse file request
    //     // const filesRequest = helper.parseBasinVector(filesRequestStr);

    //     // // Format basin IDs (to array)
    //     // let basinIds = helper.parseBasinVector(basinIdsStr);

    //     // // Remove duplicates and ensure all are strings
    //     // basinIds = basinIds.map(x => String(x));
    //     // basinIds = helper.getUniqueValues(basinIds);

    //     // // Get file indices
    //     // const basinIndexFile = path.join(resourcesBasinPath, "BasinIndex.csv");
    //     // const basinIndexData = await helper.readCsvFile(basinIndexFile);

    //     // // Filter basin index by basin IDs
    //     // const basinIndex = basinIndexData.filter(row => {
    //     //     const basinId = String(row.basin_id);
    //     //     return basinIds.includes(basinId);
    //     // });

    //     // console.log('Basin Index:', basinIndex);

    //     // // Add file paths to basin index
    //     // basinIndex.forEach(row => {
    //     //     row.pts_file = path.join(resourcesBasinPath, `pts_${row.file_index}.csv`);
    //     //     row.hl_file = path.join(resourcesBasinPath, `hl_${row.file_index}.csv`);
    //     //     row.avg_file = path.join(resourcesBasinPath, `avg_${row.file_index}.csv`);
    //     //     row.mi_file = path.join(resourcesBasinPath, `mi_${row.file_index}.csv`);
    //     //     row.ma_file = path.join(resourcesBasinPath, `ma_${row.file_index}.csv`);
    //     // });

    //     // // Process pts files
    //     // if (filesRequest.includes("pts")) {
    //     //     const uniquePtsFiles = helper.getUniqueValues(basinIndex.map(row => row.pts_file));
    //     //     const ptsData = await helper.readFilesAsPdSubsetByBasinIdWithSchema(uniquePtsFiles, basinIds, ptsSchema);
    //     //     const ptsJsonFile = path.join(tmpPath, "pts.json");
    //     //     await helper.writeToJsonFile(ptsData, ptsJsonFile);
    //     //     console.log(`Processed ${ptsData.length} pts records`);
    //     // }

    //     // // Process hl files
    //     // if (filesRequest.includes("hl")) {
    //     //     const uniqueHlFiles = helper.getUniqueValues(basinIndex.map(row => row.hl_file));
    //     //     const hlData = await helper.readFilesAsPdSubsetByBasinId(uniqueHlFiles, basinIds);
    //     //     const hlJsonFile = path.join(tmpPath, "hl.json");
    //     //     await helper.writeToJsonFile(hlData, hlJsonFile);
    //     //     console.log(`Processed ${hlData.length} hl records`);
    //     // }

    //     // // Process avg files
    //     // if (filesRequest.includes("avg")) {
    //     //     const uniqueAvgFiles = helper.getUniqueValues(basinIndex.map(row => row.avg_file));
    //     //     const avgData = await helper.readFilesAsPdSubsetByBasinId(uniqueAvgFiles, basinIds);
    //     //     const avgJsonFile = path.join(tmpPath, "avg.json");
    //     //     await helper.writeToJsonFile(avgData, avgJsonFile);
    //     //     console.log(`Processed ${avgData.length} avg records`);
    //     // }

    //     // // Process mi files
    //     // if (filesRequest.includes("mi")) {
    //     //     const uniqueMiFiles = helper.getUniqueValues(basinIndex.map(row => row.mi_file));
    //     //     const miData = await helper.readFilesAsPdSubsetByBasinId(uniqueMiFiles, basinIds);
    //     //     const miJsonFile = path.join(tmpPath, "mi.json");
    //     //     await helper.writeToJsonFile(miData, miJsonFile);
    //     //     console.log(`Processed ${miData.length} mi records`);
    //     // }

    //     // // Process ma files
    //     // if (filesRequest.includes("ma")) {
    //     //     const uniqueMaFiles = helper.getUniqueValues(basinIndex.map(row => row.ma_file));
    //     //     const maData = await helper.readFilesAsPdSubsetByBasinId(uniqueMaFiles, basinIds);
    //     //     const maJsonFile = path.join(tmpPath, "ma.json");
    //     //     await helper.writeToJsonFile(maData, maJsonFile);
    //     //     console.log(`Processed ${maData.length} ma records`);
    //     // }

    //     btn_obj.style.color = "black"
    //     btn_obj.style.background = "white"
    //     btn_obj.innerText = "Run ePiE"
    //     console.log('Processing completed successfully!');
    //     //Progress_bar.style.transition = 'width 1s ease-in-out';
    //     Progress_bar.style.width = 20 + "%";
    //     return(true);

    // } catch (error) {

    //     btn_obj.style.color = "black"
    //     btn_obj.style.background = "white"
    //     btn_obj.innerText = "Run ePiE"
    //     console.error('Error during processing:', error);
    //     // Progress_bar.style.transition = 'width 0s ease-in-out';
    //     Progress_bar.style.width = 0 + "%";
    //     process.exit(1);
    //     return(false);
    // }



}

function fileConstructor(){

    // number of files to construct
    const nfiles = 30; 
    const itstart = 1;

    // check if baseHydroDataPath and with trailing slash exists
    if(typeof baseHydroDataPath === 'undefined' || !baseHydroDataPath.endsWith('/')){
        console.error("baseHydroDataPath is not defined or does not end with a '/'");
        return undefined;
    }
    
    // construct file paths
    var files = [];
    files["avg"] = []; files["ma"] = []; files["mi"] = []; files["hl"] = []; files["pts"] = [];
    for(let i=0; i<(nfiles+itstart); i++){
        let intdexStr = i.toString().padStart(5, '0');
        if(i<itstart){ 
            files["avg"].push("");
            files["ma"].push("");
            files["mi"].push("");
            files["hl"].push("");
            files["pts"].push("");
            continue; 
        }
        files["avg"].push(`${baseHydroDataPath}avg_${intdexStr}.csv`);
        files["ma"].push(`${baseHydroDataPath}ma_${intdexStr}.csv`);
        files["mi"].push(`${baseHydroDataPath}mi_${intdexStr}.csv`);
        files["hl"].push(`${baseHydroDataPath}hl_${intdexStr}.csv`);
        files["pts"].push(`${baseHydroDataPath}pts_${intdexStr}.csv`);
    }
    //console.log("Constructed file paths:", files);

    // return file paths
    return files;

}
    

