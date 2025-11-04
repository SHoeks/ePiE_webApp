import { dialog } from '@electron/remote'
import fs from 'fs'
const path = require('path');

function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

function mean(numbers) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
}

export default function CalculateBasinStatistics(fullTempPathDir) {

    console.log("CalculateBasinStatistics")
    console.log(fullTempPathDir)
    var APICSVTemplateFullPath = path.join(fullTempPathDir, "pts_out.csv"); + 
    console.log(APICSVTemplateFullPath)
    
    // check if file exists
    if (!fs.existsSync(APICSVTemplateFullPath)) {
        console.log('File not found!');
        dialog.showMessageBox({
          title: 'No results found',
          message: 'Unable to generate file, no results found. Please run ePiE first.',
          buttons: ['OK']
        })
        return;
    }

    let elem = document.querySelector("#API_table_basinStats > tbody");
    let innerHTML = "";

    let read_stream = fs.readFileSync(APICSVTemplateFullPath); //
    let csv_string = read_stream.toString();
    csv_string = csv_string.split(/\r?\n|\r|\n/g);

    ///////////////////////////////////////////////
    
    let h = csv_string[0].split(";");
    let c_w_index = h.indexOf("C_w");
    let basin_ID_index = h.indexOf("basin_ID");
    let unique_basin_IDs = [];
    for (let i = 1; i < csv_string.length; i++) {
        let line = csv_string[i].split(";");
        let basin_ID = line[basin_ID_index];
        if (basin_ID === undefined || basin_ID === "") continue; // skip empty lines
        if(!unique_basin_IDs.includes(basin_ID)){
            unique_basin_IDs.push(basin_ID);
        }
    }
    console.log("unique_basin_IDs: ", unique_basin_IDs.length, unique_basin_IDs);



    console.log("c_w_index: ", c_w_index);
    let c_w = 0.0;
    let basin_ID = 0;
    let c_w_sum_per_basin = Array.apply(null, Array(unique_basin_IDs.length)).map(Number.prototype.valueOf,0.0);
    let n_per_basin = Array.apply(null, Array(unique_basin_IDs.length)).map(Number.prototype.valueOf,0.0);
    let values_per_basin = [[]];
    let values_per_basin_dnWWTP = [[]];
    for (let i = 1; i < csv_string.length; i++) {
        let line = csv_string[i].split(";");
        c_w = line[c_w_index];
        basin_ID = line[basin_ID_index];
        if (c_w === undefined || c_w === "") continue; // skip empty lines
        if (basin_ID === undefined || basin_ID === "") continue; // skip empty lines
        let basin_index = unique_basin_IDs.indexOf(basin_ID);
        c_w_sum_per_basin[basin_index] += parseFloat(c_w);
        n_per_basin[basin_index] += 1.0;
        
        if (values_per_basin[basin_index] === undefined) {
            values_per_basin[basin_index] = [];
        }
        values_per_basin[basin_index].push(parseFloat(c_w));
        
        if (values_per_basin_dnWWTP[basin_index] === undefined) {
            values_per_basin_dnWWTP[basin_index] = [];
        }
        if(c_w > 0.0) { // only add values greater than 0.0
            values_per_basin_dnWWTP[basin_index].push(parseFloat(c_w));
        }
    }
    // console.log("values_per_basin: ", values_per_basin);
    // console.log("c_w_sum_per_basin: ", c_w_sum_per_basin);
    // console.log("n_per_basin: ", n_per_basin);
    let c_w_mean_per_basin = [];
    let c_w_mean_per_basin_dnWWTP = [];
    let c_w_median_per_basin = [];
    let c_w_median_per_basin_dnWWTP = [];
    for (let i = 0; i < unique_basin_IDs.length; i++) {
        
        let tmp = (c_w_sum_per_basin[i] / n_per_basin[i]);
        tmp = Math.round(tmp * 100000) / 100000; // round to 2 decimal places
        c_w_mean_per_basin.push(tmp);

        let tmp2_test = mean(values_per_basin_dnWWTP[i]);
        tmp2_test = Math.round(tmp2_test * 100000) / 100000; // round to 2 decimal places
        c_w_mean_per_basin_dnWWTP.push(tmp2_test);

        let tmp_median = median(values_per_basin[i]);
        tmp_median = Math.round(tmp_median * 100000) / 100000; // round to 2 decimal places
        c_w_median_per_basin.push(tmp_median);

        let tmp_dnWWTP_median = median(values_per_basin_dnWWTP[i]);
        tmp_dnWWTP_median = Math.round(tmp_dnWWTP_median * 100000) / 100000; // round to 2 decimal places
        c_w_median_per_basin_dnWWTP.push(tmp_dnWWTP_median);
    }
    console.log("c_w_mean_per_basin: ", c_w_mean_per_basin);
    console.log("c_w_mean_per_basin_dnWWTP: ", c_w_mean_per_basin_dnWWTP);
    console.log("median_per_basin: ", c_w_median_per_basin);
    console.log("median_per_basin_dnWWTP: ", c_w_median_per_basin_dnWWTP);

    let API_ID_index = document.querySelector("#name_row1").value;
    
    ///////////////////////////////////////////////
    

    let header = `
      <tr>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">API<br>(ID)<br><span class="secondSpan">Explanation1</span></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Basin<br>(ID)<br><span class="secondSpan">Explanation1</span></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Mean ug/L<br>(all)<br><span class="secondSpan">Explanation3</span></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Median ug/L<br>(all)<br><span class="secondSpan">Explanation4</span></span> </th>
          <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Mean ug/L<br>(downstream WWTP)<br><span class="secondSpan">Explanation5</span></span> </th>
          <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Median ug/L<br>(downstream WWTP)<br><span class="secondSpan">Explanation6</span></span> </th>
      </tr>`
    
    let data = "";
    for(let i = 0; i < unique_basin_IDs.length; i++) {
        data += `<tr>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${API_ID_index}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${unique_basin_IDs[i]}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_mean_per_basin[i]}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_median_per_basin[i]}" readonly /></td>
        <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_mean_per_basin_dnWWTP[i]}" readonly /></td>
        <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_median_per_basin_dnWWTP[i]}" readonly /></td>
        </tr>`
    }

    innerHTML = header + data;
    elem.innerHTML = innerHTML;

}

