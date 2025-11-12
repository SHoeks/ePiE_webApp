async function generateConsumptionTableWrapper(){


    // check if current cons table is empty or not 
    let tableempty = document.querySelector("#API_table_consumption").innerHTML === "<tbody></tbody>"
    if(!tableempty) console.log("Table not empty");

    document.querySelector("#progress_gen_table_cons").style.display = "inline-block";
    
    // Get file maps and basin mappings
    const {unique_pts_files,unique_hl_files,unique_flow_files,pts_basin_map,hl_basin_map,flow_basin_map} = getFileMaps();

        // reset progress indicators
    if(unique_pts_files.length === 0){
        console.log("No basins selected");
        // alert("No basins selected, please select at least one basin to generate the consumption data table");
        document.querySelector("#progress_gen_table_cons").style.display = "none";
        return; // No basins selected or error occurred
    }

    // get requested consumption data type
    let cons_dat_type = document.querySelector("#cons_data_type_value_holder").innerText;
    console.log(cons_dat_type);

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
    
    // subset wwtp data from global_pts_data
    var filtered = global_pts_data.filter(row => row.Pt_type === "WWTP");
    // console.log("filtered pts data (wwtp only): ",filtered);
    var rptMStateK = [];
    rptMStateK.push(filtered.map(row => row.rptMStateK));
    rptMStateK = rptMStateK[0].filter(item => item !== "NA" && item !== "" && item !== null && item !== undefined); // remove NA
    console.log("rptMStateK: ",rptMStateK);
    let rptMStateK_count = {}; // get count per unique value in rptMStateK
    rptMStateK.forEach(function(i) { rptMStateK_count[i] = (rptMStateK_count[i]||0) + 1;});
    console.log("rptMStateK_count: ",rptMStateK_count);
    let rptMStateK_count_sorted = Object.entries(rptMStateK_count).sort((a,b) => b[1] - a[1]);
    console.log("rptMStateK_count_sorted: ",rptMStateK_count_sorted);

    // fill consumption table
    var out = 0;
    out = createConsTable(cons_dat_type,rptMStateK_count_sorted);
    
    // test population estimation country NL year 2024
    let test = populationPerCapConversion("NL",2024);
    console.log("test: ",test);
    
    // get countries from table and their population
    let countries = getCountriesConsPop();
    console.log(countries);

    // show loading info
    if(out==1) document.querySelector("#cons_edit_buttons").style.display = "inline-block";
    document.querySelector("#progress_gen_table_cons").style.display = "none";

    // copy over API_ID to other tables and set consumption to settings
    copyOverAPI_ID();
    setConsumptionToSettings();

}

function createConsTable(cons_dat_type,rptMStateK_count_sorted) {

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
            <th class="api_cons tableHeader5"> <span class="firstSpan">Ibuprofen<br><p>(kg/year)</p><span class="secondSpan"> Total yearly country-level consumption in kg </span></span> </th>
        </tr>`
    }else if(cons_dat_type=="country_percapitagram"){
        document.querySelector("#API_table_consumption > tbody:nth-child(1)").innerHTML += 
        `<tr>
              <th class="api_cons tableHeader5"> <span class="firstSpan">Country<br><p>(name)</p><span class="secondSpan"> Country name </span></span> </th>
              <th class="api_cons tableHeader5"> <span class="firstSpan">Country<br><p>(iso code)</p><span class="secondSpan"> Country 2-letter iso code </span></span> </th>
              <th class="api_cons tableHeader5"> <span class="firstSpan">WWTPs<br><p>(count)</p><span class="secondSpan"> Number of WWTPs selected within basin of interest </span></span> </th>
              <th class="api_cons tableHeader5"> <span class="firstSpan">Ibuprofen<br><p>(g/capita/year)</p><span class="secondSpan"> Total yearly country-level consumption in kg </span></span> </th>
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

function setPopulationYear(){
    let val = document.querySelector("#pop_year").value;
    console.log(val);
    let elem = document.querySelector("#pop_year_value_holder");
    elem.innerText = val;

    // calculate API total kg cons per country if value is set
    var percapfield = document.querySelector("#cPercapitaValue_row1");
    if(percapfield!=null){
    let val = percapfield.value;
    console.log(val);
    if(val!=""){
        let percapitakg = parseFloat(val)/1000.00;
        console.log(percapitakg);

        let countriesPop = getCountriesConsPop();
        console.log(countriesPop);

        for(let i = 0; i < countriesPop.countries.length; i++){
        let country = countriesPop.countries[i];
        let selector = countriesPop.selectors[i];
        selector = selector.replace("c_row","api1_row");
        let pop = countriesPop.poparray[i];
        console.log(country,selector,pop);
        let cons = (percapitakg * pop).toFixed(3);
        console.log(cons);
        //if(document.querySelector(selector).value===""){
            document.querySelector(selector).value = cons;
        //}
        }

    }
    }
}

setConsumptionToSettings = function(){

    // html objects
    let consCntTableRows = document.querySelector("#API_table_consumption").querySelectorAll("tr");
    let output = document.querySelector("#consumptionDataFull");
    
    // col indices
    let cnt_code = 1;
    let cons_value = 3;

    // check if table has data
    if(consCntTableRows.length <= 1){
        console.log("No table data to set consumption settings");
        output.textContent = "{Undefined}";
        return;
    }

    // extract settings
    var settings = {};
    for(let i=1; i < consCntTableRows.length; i++){ // skip header row
        let cols = consCntTableRows[i].getElementsByClassName("tableFieldCons");
        let country_code = cols[cnt_code].value;
        let cons_value_kgyear = parseFloat(cols[cons_value].value);
        settings[country_code] = cons_value_kgyear;
    }

    // output to settings div
    output.textContent = JSON.stringify(settings, null, 2);

}



