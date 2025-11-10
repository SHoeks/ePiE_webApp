import fs from 'fs'
import { parse } from 'csv-parse/sync';
const pathModule = require('path');

export default function generateConsumptionTable(resourceDir, tempDir, selected_basins) {

    console.log("Generating Consumption Table JS");
    console.log(resourceDir);
    console.log(tempDir);

    // get requested consumption data type
    let cons_dat_type = document.querySelector("#cons_data_type_value_holder").innerText;
    console.log(cons_dat_type);

    //   #### JAVASCRIPT translation of basin data access python script

    let basinIndexPath = pathModule.join(resourceDir, "BasinIndex.csv");
    let BasinIndexText = fs.readFileSync(basinIndexPath, 'utf-8');
    let basinIndexRows = parse(BasinIndexText, { columns: true });
    let filtered = basinIndexRows.filter(row => selected_basins.includes(String(row.basin_id)));

    // get all basin_id into an array
    let basin_ids = filtered.map(row => row.basin_id);
    let file_index = filtered.map(row => row.file_index);
    console.log("basin_ids: ",basin_ids);
    console.log("file_index: ",file_index);

    // read a basin data pts file
    var rptMStateK_per_file = [];
    for (let i = 0; i < file_index.length; i++) {
        let pts_file = "pts_" + file_index[i] + ".csv";
        // console.log("pts_file: ",pts_file);
        let ptsPath = pathModule.join(resourceDir, pts_file);
        let ptsText = fs.readFileSync(ptsPath, 'utf-8');
        let ptsRows = parse(ptsText, { columns: true });
        let pts_filtered = ptsRows.filter(row => selected_basins.includes(String(row.basin_id)));
        pts_filtered = pts_filtered.filter(row => row.Pt_type === "WWTP"); // keep only wwtps
        // let pts_basin_ids = ptsRows.map(row => row.basin_id);
        // let pts_filtered_basin_ids = pts_filtered.map(row => row.basin_id);
        // console.log("n rows pts: ",pts_basin_ids.length);
        // console.log("n rows pts_filtered: ",pts_filtered_basin_ids.length);
        // console.log("pts_filtered: ",pts_filtered);
        rptMStateK_per_file.push(pts_filtered.map(row => row.rptMStateK));
    }

    let rptMStateK_all = [];
    for (let row of rptMStateK_per_file) for (let e of row) rptMStateK_all.push(e);
    // console.log("rptMStateK_all: ",rptMStateK_all);

    // get WWTP coutries (rptMStateK)
    rptMStateK_all = rptMStateK_all.filter(item => item !== "NA" && item !== "" && item !== null && item !== undefined); // remove NA
    // let rptMStateK_unique = [...new Set(rptMStateK_all)]; // get unique values
    // console.log("rptMStateK_unique: ",rptMStateK_unique);

    // get count per unique value in rptMStateK
    let rptMStateK_count = {};
    rptMStateK_all.forEach(function(i) { rptMStateK_count[i] = (rptMStateK_count[i]||0) + 1;});
    // console.log("rptMStateK_count: ",rptMStateK_count);

    // sort rptMStateK_count
    let rptMStateK_count_sorted = Object.entries(rptMStateK_count).sort((a,b) => b[1] - a[1]);
    console.log("rptMStateK_count_sorted: ",rptMStateK_count_sorted);

    //   ##################################################

    // clear previous table 
    document.querySelector("#API_table_consumption > tbody:nth-child(1)").innerHTML = "";

    // add header 
    // document.querySelector("#API_table_consumption > tbody:nth-child(1)").innerHTML += 
    // `<tr>
    //       <th class="api_cons tableHeader5"> <span class="firstSpan">Country name<span class="secondSpan">Country name</span></span> </th>
    //       <th class="api_cons tableHeader5"> <span class="firstSpan">Country code<span class="secondSpan">Country two letter ISO codes</span></span> </th>
    //       <th class="api_cons tableHeader5"> <span class="firstSpan">WWTPs<span class="secondSpan">Number of WWTPs selected within basin of interest</span></span> </th>
    //       <th class="api_cons tableHeader5"> <span class="firstSpan">Ibuprofen<span class="secondSpan">Yearly consumption<p class="hover_unit">kg/year</p></span></span> </th>
    // </tr>`
    if(cons_dat_type=="country_totalkgyear" || cons_dat_type=="euavg_percapitygram"){
        document.querySelector("#API_table_consumption > tbody:nth-child(1)").innerHTML += 
        `<tr>
            <th class="api_cons tableHeader5"> <span class="firstSpan">Country<br><p>(name)</p><span class="secondSpan"> Country name </span></span> </th>
            <th class="api_cons tableHeader5"> <span class="firstSpan">Country<br><p>(iso code)</p><span class="secondSpan"> Country 2-letter iso code </span></span> </th>
            <th class="api_cons tableHeader5"> <span class="firstSpan">WWTPs<br><p>(count)</p><span class="secondSpan"> Number of WWTPs selected within basin of interest </span></span> </th>
            <th class="api_cons tableHeader5"> <span class="firstSpan">Ibuprofen<br><p>(kg/year)</p><span class="secondSpan"> Total yearly consumption in kg </span></span> </th>
        </tr>`
    }else if(cons_dat_type=="country_percapitagram"){
        document.querySelector("#API_table_consumption > tbody:nth-child(1)").innerHTML += 
        `<tr>
              <th class="api_cons tableHeader5"> <span class="firstSpan">Country<br><p>(name)</p><span class="secondSpan"> Country name </span></span> </th>
              <th class="api_cons tableHeader5"> <span class="firstSpan">Country<br><p>(iso code)</p><span class="secondSpan"> Country 2-letter iso code </span></span> </th>
              <th class="api_cons tableHeader5"> <span class="firstSpan">WWTPs<br><p>(count)</p><span class="secondSpan"> Number of WWTPs selected within basin of interest </span></span> </th>
              <th class="api_cons tableHeader5"> <span class="firstSpan">Ibuprofen<br><p>(g/capita/year)</p><span class="secondSpan"> Total yearly consumption in kg </span></span> </th>
        </tr>`
    }

    
    for( let i = 0; i < rptMStateK_count_sorted.length; i++){

        
        // get data
        let ccode = rptMStateK_count_sorted[i][0];
        let cname = convert_code_to_name_country(ccode); 
        let wnumber = rptMStateK_count_sorted[i][1];
        
        //print
        // console.log(cname, ccode, wnumber);
        
        document.querySelector("#API_table_consumption > tbody:nth-child(1)").innerHTML +=
        `<tr>
        <td><input style="width: 120px;" class="tableFieldCons noteditable" type="text" id="cn_row${i+1}" value="${cname}"/></td>
        <td><input style="width: 120px;" class="tableFieldCons noteditable" type="text" id="c_row${i+1}" value="${ccode}"/></td>
        <td><input style="width: 120px;" class="tableFieldCons noteditable" type="text" id="w_row${i+1}" value="${wnumber}"/></td>
        <td><input onkeyup="setTableValues(this)" style="width: 120px;" class="tableFieldCons" type="text" id="api1_row${i+1}" value=""  /></td>
        </tr>`

    }

    document.getElementById("consHeaderHoverInfo").style.display = "block";

    if(cons_dat_type=="euavg_percapitygram"){
        document.querySelector("#avg_per_capita_cons_table").style.display = "block";
        document.querySelector("#div_container_pop_year").style.display = "block";

        document.querySelector("#API_table_consumption_avg_per_capita").innerHTML = "<tbody></tbody>";
        
        // add header
        document.querySelector("#API_table_consumption_avg_per_capita > tbody:nth-child(1)").innerHTML += 
        `<tr>
              <th class="api_cons tableHeader6"> <span class="firstSpan">API<br><p>(id)</p><span class="secondSpan"> API identifier </span></span> </th>
              <th class="api_cons tableHeader6"> <span class="firstSpan">Per capita consumption<br><p>(g/capita/year)</p><span class="secondSpan"> Average per capita consumption over all included basins and countries (g/capita/year) </span></span> </th>
        </tr>`

        // add data
        let api_n = 1;
        document.querySelector("#API_table_consumption_avg_per_capita > tbody:nth-child(1)").innerHTML += 
        `<tr>
        <td><input style="width: 120px;" class="tableFieldConsPerCapita noteditable" type="text" id="cPerCapitaAPIid_row${api_n}" value="Ibuprofen"/></td>
        <td><input style="width: 120px;" class="tableFieldConsPerCapita" type="text" id="cPercapitaValue_row${api_n}" value=""/></td>
        </tr>`


    }else{
        document.querySelector("#avg_per_capita_cons_table").style.display = "none";
    }
    
    if(cons_dat_type=="country_percapitagram") {
        document.querySelector("#div_container_pop_year").style.display = "block";
    }

    // turn of table edit view
    var fields = document.querySelectorAll("table input[type='text']");
    for (let i = 0; i < fields.length; i++) {
      fields[i].readOnly = true;
      fields[i].style.border = "none";
    }


    return 1;
}


function convert_code_to_name_country(code){
    const country_map = {
        "AT": "Austria",
        "BE": "Belgium",
        "BG": "Bulgaria",
        "CH": "Switzerland",
        "CY": "Cyprus",
        "CZ": "Czechia",
        "DE": "Germany",
        "DK": "Denmark",
        "EE": "Estonia",
        "ES": "Spain",
        "FR": "France",
        "GR": "Greece",
        "HR": "Croatia",
        "HU": "Hungary",
        "IE": "Ireland",
        "IT": "Italy",
        "LT": "Lithuania",
        "LU": "Luxembourg",
        "LV": "Latvia",
        "NL": "Netherlands",
        "PL": "Poland",
        "PT": "Portugal",
        "RO": "Romania",
        "SE": "Sweden",
        "SI": "Slovenia",
        "SK": "Slovakia",
        "UK": "United Kingdom",
        "FI": "Finland",
        "NO": "Norway"
    }
    if (code in country_map){
        return country_map[code];
    }else{
        return code;
    }
}
