// import { dialog } from '@electron/remote'
// import fs from 'fs'
// const path = require('path');

function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

function quantile(numbers, q) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
}

function mean(numbers) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
}

// export default 
function CalculateBasinStatistics( ) {

    console.log("CalculateBasinStatistics")

    // retreive ePie results
    var pts = epie_results; // assuming ePie_results is an array of objects with x, y, and other properties

    // remove lake points
    console.log('Removing lake points ...');
    console.log('pts.length: ' + pts.length);
    pts = pts.filter(function(pt) {
        return pt.HylakId === -999;
    });
    console.log('pts.length: ' + pts.length);
    
    // stop if results are null or length 0
    if(pts === null){
        console.log('No ePiE results found!');
        alert('Unable to generate map, no results found. Please run ePiE first.');
        return;
    }           
    if(pts.length === 0){
        console.log('No ePiE results found!');
        alert('Unable to generate map, no results found. Please run ePiE first.');
        return;
    }

    // get unique basin IDs
    const unq_b_id = [];
    for(i=0; i<pts.length; i++){
        if(!unq_b_id.includes(pts[i].basin_ID)){
            unq_b_id.push(pts[i].basin_ID);
        }
    }
    console.log("unique basin IDs: ", unq_b_id.length, unq_b_id);
    const unique_basin_IDs = unq_b_id;

    let c_w = 0.0;
    let basin_ID = 0;
    let c_w_sum_per_basin = Array.apply(null, Array(unique_basin_IDs.length)).map(Number.prototype.valueOf,0.0);
    let n_per_basin = Array.apply(null, Array(unique_basin_IDs.length)).map(Number.prototype.valueOf,0.0);
    let values_per_basin = [[]];
    let values_per_basin_dnWWTP = [[]];
    for (let i = 1; i < pts.length; i++) {
        let line = pts[i];
        c_w = line.C_w;
        basin_ID = line.basin_ID;
        if (c_w === undefined || c_w === "") continue; // skip empty lines
        if (basin_ID === undefined || basin_ID === "") continue; // skip empty lines


        let basin_index = unq_b_id.indexOf(basin_ID);
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
    let c_w_95th_per_basin = [];
    let c_w_5th_per_basin = [];
    for (let i = 0; i < unique_basin_IDs.length; i++) {
        
        let tmp = (c_w_sum_per_basin[i] / n_per_basin[i]) * 1000 ; // convert from ug/L to ng/L
        tmp = Math.round(tmp * 100000) / 100000; // round to 2 decimal places
        c_w_mean_per_basin.push(tmp);

        let tmp2_test = mean(values_per_basin_dnWWTP[i]) * 1000 ; // convert from ug/L to ng/L
        tmp2_test = Math.round(tmp2_test * 100000) / 100000; // round to 2 decimal places
        c_w_mean_per_basin_dnWWTP.push(tmp2_test);

        let tmp_median = median(values_per_basin[i]) * 1000 ; // convert from ug/L to ng/L
        tmp_median = Math.round(tmp_median * 10000000) / 10000000; // round to 4 decimal places
        c_w_median_per_basin.push(tmp_median);

        let tmp_dnWWTP_median = median(values_per_basin_dnWWTP[i]) * 1000 ; // convert from ug/L to ng/L
        tmp_dnWWTP_median = Math.round(tmp_dnWWTP_median * 10000000) / 10000000; // round to 4 decimal places
        c_w_median_per_basin_dnWWTP.push(tmp_dnWWTP_median);

        let tmp_95th = quantile(values_per_basin[i], 0.95) * 1000 ; // convert from ug/L to ng/L
        tmp_95th = Math.round(tmp_95th * 10000000) / 10000000; // round to 4 decimal places
        c_w_95th_per_basin.push(tmp_95th);

        let tmp_5th = quantile(values_per_basin[i], 0.05) * 1000 ; // convert from ug/L to ng/L
        tmp_5th = Math.round(tmp_5th * 10000000) / 10000000; // round to 4 decimal places
        c_w_5th_per_basin.push(tmp_5th);

    }
    console.log("c_w_mean_per_basin: ", c_w_mean_per_basin);
    console.log("c_w_mean_per_basin_dnWWTP: ", c_w_mean_per_basin_dnWWTP);
    console.log("median_per_basin: ", c_w_median_per_basin);
    console.log("median_per_basin_dnWWTP: ", c_w_median_per_basin_dnWWTP);
    console.log("c_w_95th_per_basin: ", c_w_95th_per_basin);
    console.log("c_w_5th_per_basin: ", c_w_5th_per_basin);

    ///////////////////////////////////////////////
    let API_ID_index = document.querySelector("#name_row1").value;
    

    let header = `
      <tr>
          <th style="width: 100px;" class="basinStats tableHeaderStats"> <span class="firstSpan">API<br>(ID)<br></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Basin<br>(ID)<br></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Mean ng/L<br>(all)<br></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">5th Percentile ng/L<br>(all)<br></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Median ng/L<br>(all)<br></span> </th>
          <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">95th Percentile ng/L<br>(all)<br></span> </th>
          <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Mean ng/L<br>(downstream WWTP)<br></span> </th>
          <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Median ng/L<br>(downstream WWTP)<br></span> </th>
      </tr>`
    
    let data = "";
    for(let i = 0; i < unique_basin_IDs.length; i++) {
        data += `<tr>
        <td><input style="width: 100px;" class="tableHeaderStats" type="text" id="statcol" value="${API_ID_index}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${unique_basin_IDs[i]}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_mean_per_basin[i]}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_5th_per_basin[i]}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_median_per_basin[i]}" readonly /></td>
        <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_95th_per_basin[i]}" readonly /></td>
        <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_mean_per_basin_dnWWTP[i]}" readonly /></td>
        <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${c_w_median_per_basin_dnWWTP[i]}" readonly /></td>
        </tr>`
    }

    let elem = document.querySelector("#API_table_basinStats")
    innerHTML = header + data;
    elem.innerHTML = innerHTML;

    ///////////////////////////////////////////////

}


// export to global
window.CalculateBasinStatistics = CalculateBasinStatistics;