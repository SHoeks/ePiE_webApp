// Example function use this in other parts of the app to access basin data
async function ExampleAccessBasinData() {

    // show progress
    let Progress_bar = document.getElementById("myBar");
    let btn_obj = document.getElementById("gen_cons_table_btn")
    btn_obj.style.color = "#ffffff"
    btn_obj.style.background = "#b83734"
    btn_obj.innerText = "Generating table, please wait..."

    // Get file maps and basin mappings
    const {unique_pts_files,unique_hl_files,unique_flow_files,pts_basin_map,hl_basin_map,flow_basin_map} = getFileMaps();

    // reset progress indicators
    if(unique_pts_files.length === 0){
        btn_obj.style.color = "black"
        btn_obj.style.background = "white"
        btn_obj.innerText = "Generate table"
        console.log('No basins selected or error occurred while getting file maps.');
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

    // reset progress indicators
    btn_obj.style.color = "black"
    btn_obj.style.background = "white"
    btn_obj.innerText = "Generate table"
    console.log('Processing completed successfully!');
    //Progress_bar.style.transition = 'width 1s ease-in-out';
    // Progress_bar.style.width = 20 + "%";

}

rbindBasinData = function(){
    // rbind data from global_pts_data, global_hl_data, global_flow_data
    // into a single data structure for further processing
    var pts_tmp = [];
    var hl_tmp = [];
    var flow_tmp = [];
    ib = Object.keys(global_pts_data);
    for(let i=0; i<ib.length; i++){
        let basin_id = ib[i];
        pts_tmp = pts_tmp.concat(global_pts_data[basin_id]);
        hl_tmp = hl_tmp.concat(global_hl_data[basin_id]);
        flow_tmp = flow_tmp.concat(global_flow_data[basin_id]);
    }
    console.log('Rbind completed: total pts rows:', pts_tmp.length);
    console.log('Rbind completed: total hl rows:', hl_tmp.length);
    console.log('Rbind completed: total flow rows:', flow_tmp.length);
    global_pts_data = pts_tmp;
    global_hl_data = hl_tmp;
    global_flow_data = flow_tmp;
    
}

function completeData(){
    ib = Object.keys(global_pts_data);
    for(let i=0; i<ib.length; i++){
        let basin_id = ib[i];
        for(let row=0; row<global_pts_data[basin_id].length; row++){
            global_pts_data[basin_id][row]["basin_id"] = basin_id; // ensure basin_id field is filled
            global_flow_data[basin_id][row]["basin_id"] = basin_id; // ensure basin_id field is filled
            fillMissingFields([global_pts_data[basin_id][row]]);
        }
        for(let row=0; row<global_hl_data[basin_id].length; row++){
            global_hl_data[basin_id][row]["basin_id"] = basin_id; // ensure basin_id field is filled
        }
    }
}

function fillMissingFields(dataArray) {

    const schema = {
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

    return dataArray.map(row => {
        for (const [key, type] of Object.entries(schema)) {
            if (!(key in row)) {
                if (type === 'str') {
                    row[key] = "";
                } else if (type === 'float') {
                    row[key] = NaN;
                } else if (type === 'Int64') {
                    row[key] = null;
                } else {
                    row[key] = null; // default for unknown types
                }
            }
        }
        return row;
    });
}

async function readptsFiles(unique_pts_files, pts_basin_map){
    // initialize global_pts_data
    global_pts_data = {}; 
    for(let idx=0; idx<unique_pts_files.length; idx++){
        let file = unique_pts_files[idx];
        let bidx = pts_basin_map[file];
        let ptsData = await loadBasinData(file, bidx);
        for(const [basin_id, data] of Object.entries(ptsData)){
            global_pts_data[basin_id] = data;
        }
        console.log('Loading basin data --> n basins loaded:', Object.keys(global_pts_data).length);
    }
    console.log('All pts data loaded into global_pts_data --> total basins:', Object.keys(global_pts_data).length);
    console.log(global_pts_data);
}

async function readhlFiles(unique_hl_files, hl_basin_map){
    // initialize global_hl_data
    global_hl_data = {}; 
    for(let idx=0; idx<unique_hl_files.length; idx++){
        let file = unique_hl_files[idx];
        let bidx = hl_basin_map[file];
        let hlData = await loadBasinData(file, bidx);
        for(const [basin_id, data] of Object.entries(hlData)){
            global_hl_data[basin_id] = data;
        }
        console.log('Loading basin data --> n basins loaded:', Object.keys(global_hl_data).length);
    }
    console.log('All hl data loaded into global_hl_data --> total basins:', Object.keys(global_hl_data).length);
    console.log(global_hl_data);
}

async function readflowFiles(unique_flow_files, flow_basin_map){
        // initialize global_flow_data
    global_flow_data = {}; 
    for(let idx=0; idx<unique_flow_files.length; idx++){
        let file = unique_flow_files[idx];
        let bidx = flow_basin_map[file];
        let flowData = await loadBasinData(file, bidx);
        for(const [basin_id, data] of Object.entries(flowData)){
            global_flow_data[basin_id] = data;
        }
        console.log('Loading basin data --> n basins loaded:', Object.keys(global_flow_data).length);
    }
    console.log('All flow data loaded into global_flow_data --> total basins:', Object.keys(global_flow_data).length);
    console.log(global_flow_data);
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
        let intdexStr = i.toString().padStart(6, '0');
        if(i<itstart){ 
            files["avg"].push("");
            files["ma"].push("");
            files["mi"].push("");
            files["hl"].push("");
            files["pts"].push("");
            continue; 
        }
        files["avg"].push(`${baseHydroDataPath}avg_${intdexStr}.js`);
        files["ma"].push(`${baseHydroDataPath}ma_${intdexStr}.js`);
        files["mi"].push(`${baseHydroDataPath}mi_${intdexStr}.js`);
        files["hl"].push(`${baseHydroDataPath}hl_${intdexStr}.js`);
        files["pts"].push(`${baseHydroDataPath}pts_${intdexStr}.js`);
    }
    //console.log("Constructed file paths:", files);

    // return file paths
    return files;

}
    

async function loadBasinData(filePath, basinIds){
    // console.log("Loading basin data from:", filePath, "for basin IDs:", basinIds);
    const module = await import(filePath);
    var basinData = module.data; // store globally
    // console.log('Loaded big data:', basinData);
    const filteredData = {};
    if(basinIds && basinIds.length > 0){
        for(let i=0; i<basinIds.length; i++){
            let basin_id = basinIds[i];
            if(basinData.hasOwnProperty(basin_id)){
                filteredData[basin_id] = basinData[basin_id];
            } else {
                // console.warn(`Basin ID ${basin_id} not found in data from ${filePath}`);
            }
        }
    }else{
        filteredData = basinData;
    }
    return filteredData;
}

getFileMaps = function(){
    
    const basinSetObj = document.getElementById('selectedBasinsDataFull');
    const basin_indx = basinSetObj.textContent;
    
    // no data check
    if(basin_indx == "{Undefined}"){
        console.log("No basins selected in AccessBasinDB");
        alert("No basins selected, please select at least one basin to generate the consumption data table");
        return {
            unique_pts_files: [],
            unique_hl_files: [],
            unique_flow_files: [],
            pts_basin_map: {},
            hl_basin_map: {},
            flow_basin_map: {}
        };
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

    unique_pts_files = [];
    unique_hl_files = [];
    unique_flow_files = [];
    for(let i=0; i<basin_file_idx_with_file.length; i++){
        let basin_entry = basin_file_idx_with_file[i];
        if(!unique_pts_files.includes(basin_entry.pts_file_path)){
            unique_pts_files.push(basin_entry.pts_file_path);
        }
        if(!unique_hl_files.includes(basin_entry.hl_file_path)){
            unique_hl_files.push(basin_entry.hl_file_path);
        }
        if(!unique_flow_files.includes(basin_entry.flow_file_path)){
            unique_flow_files.push(basin_entry.flow_file_path);
        }
    }
    // console.log("Unique pts files to process:", unique_pts_files);
    // console.log("Unique hl files to process:", unique_hl_files);
    // console.log("Unique flow files to process:", unique_flow_files);

    // get corrospoding basin IDs for each unique file
    const pts_basin_map = {};
    const hl_basin_map = {};
    const flow_basin_map = {};
    for(let i=0; i<basin_file_idx_with_file.length; i++){
        let basin_entry = basin_file_idx_with_file[i];
        if(!(basin_entry.pts_file_path in pts_basin_map)){
            pts_basin_map[basin_entry.pts_file_path] = [];
        }
        pts_basin_map[basin_entry.pts_file_path].push(basin_entry.basin_id);

        if(!(basin_entry.hl_file_path in hl_basin_map)){
            hl_basin_map[basin_entry.hl_file_path] = [];
        }
        hl_basin_map[basin_entry.hl_file_path].push(basin_entry.basin_id);

        if(!(basin_entry.flow_file_path in flow_basin_map)){
            flow_basin_map[basin_entry.flow_file_path] = [];
        }
        flow_basin_map[basin_entry.flow_file_path].push(basin_entry.basin_id);
    }
    console.log("Pts basin map:", pts_basin_map);
    console.log("Hl basin map:", hl_basin_map);
    console.log("Flow basin map:", flow_basin_map);

    return {
        unique_pts_files: unique_pts_files,
        unique_hl_files: unique_hl_files,
        unique_flow_files: unique_flow_files,
        pts_basin_map: pts_basin_map,
        hl_basin_map: hl_basin_map,
        flow_basin_map: flow_basin_map
    };
}