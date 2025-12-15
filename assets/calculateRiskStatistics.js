// export default 
function CalculateRiskStatistics( ) {

  console.log("calculateRiskStatistics")

  // define color ramp
  // const colorsDiver = ["#CC0000", "#e48646", "#8cb5e9", "#4570a8"];
  const riskVals = ["> 10", "1.0 - 10", "0.1 - 1.0", "< 0.1"];
  const colorsDiver = riskVals;

  // retreive ePie results
  var pts = epie_results; // assuming ePie_results is an array of objects with x, y, and other properties
  
  // stop if results are null or length 0
  if(pts === null){
    console.log('No ePiE results found!');
    alert('Unable to generate statistics, no results found. Please run ePiE first.');
    return;
  }           
  if(pts.length === 0){
    console.log('No ePiE results found!');
    alert('Unable to generate statistics, no results found. Please run ePiE first.');
    return;
  }

  // get pnec value
  let pnec = document.querySelector("#riskval").value;
  pnec = parseFloat(pnec);
  console.log('pnec: ' + pnec);
  
  // stop if pnec is NaN    
  if (isNaN(pnec)) {
    console.log('pnec is NaN!');
    alert('Unable to generate statistics, risk threshold is not valid. Please enter a valid risk threshold.');
    return;
  }

  // check size of pts files
  console.log(pts);
  console.log('pts.length: ' + pts.length);

  // remove lake points
  console.log('Removing lake points ...');
  console.log('pts.length: ' + pts.length);
  pts = pts.filter(function(pt) {
    return pt.HylakId === -999;
  });
  console.log('pts.length: ' + pts.length);


  // get result stats
  var center_x = 0;
  var center_y = 0;
  var logCwmin = 0;
  var logCwmax = 0;
  var tmp = 0;
  for (let i = 0; i < pts.length; i++) {
    center_x += pts[i].x;
    center_y += pts[i].y;
    if(pts[i].C_w === null || pts[i].C_w === 0){
      continue;
    }
    // tmp = Math.log10(pts.features[i].properties.C_w / pnec );
    tmp = (pts[i].C_w*1000) / pnec;
    if (tmp < logCwmin) logCwmin = tmp;
    if (tmp > logCwmax) logCwmax = tmp;
  }
  center_x = center_x / pts.length;
  center_y = center_y / pts.length;
  console.log('center_y:' + center_y + ' center_x:' + center_x);
  console.log('logCwmin:' + logCwmin + ' logCwmax:' + logCwmax);

  var logCwRange = Math.abs(logCwmax - logCwmin);
  console.log('logCwRange:' + logCwRange);

  // var ColorStepsLog10 = logCwRange/varNcolorsCheck;
  // console.log('ColorStepsLog10 (logCwRange/varNcolorsCheck):' + ColorStepsLog10);
  
  var ratio = 0;
  for (let i = 0; i < pts.length; i++) {
    if(pts[i].C_w === null || pts[i].C_w === 0){
      pts[i].Color = "#888888";
    }else{
      ratio = (pts[i].C_w*1000) / pnec;
      if(ratio>10) pts[i].Color = colorsDiver[0];
      if(ratio>1 & ratio<=10) pts[i].Color = colorsDiver[1];
      if(ratio<=1 & ratio>0.1) pts[i].Color = colorsDiver[2];
      if(ratio<=0.1) pts[i].Color = colorsDiver[3];

      if(pts[i].C_w===0){
        pts[i].Alpha = 0.01;
      }else{
        pts[i].Alpha = 0.5; //Math.log10(pts.features[i].properties.C_w / pnec) * 0.1;
      }
    }
  }

  console.log(pts[10]);

  // get unique basin IDs
  const unq_b_id = [];
  for(i=0; i<pts.length; i++){
      if(!unq_b_id.includes(pts[i].basin_ID)){
          unq_b_id.push(pts[i].basin_ID);
      }
  }
  console.log("unique basin IDs: ", unq_b_id.length, unq_b_id);
  const unique_basin_IDs = unq_b_id;

  // count per colorsDiver
  const nbasins = unique_basin_IDs.length;
  const ngroups = colorsDiver.length;
  const colorsDiverCount = new Array(nbasins).fill(0).map(() => new Array(ngroups).fill(0));
  for (let i = 0; i < pts.length; i++) {
      let line = pts[i];
      let basin_ID = line.basin_ID;
      let c_w = line.C_w;
      if (c_w === undefined || c_w === "") continue; // skip empty lines
      if (basin_ID === undefined || basin_ID === "") continue; // skip empty lines

      let basin_index = unq_b_id.indexOf(basin_ID);
      let ratio = (c_w*1000) / pnec;
      if(ratio>10) colorsDiverCount[basin_index][0] += 1;
      if(ratio>1 & ratio<=10) colorsDiverCount[basin_index][1] += 1;
      if(ratio<=1 & ratio>0.1) colorsDiverCount[basin_index][2] += 1;
      if(ratio<=0.1) colorsDiverCount[basin_index][3] += 1;
  }
  console.log("colorsDiverCount: ", colorsDiverCount);

  // convert to percentages
  for (let i = 0; i < nbasins; i++) {
      let total = colorsDiverCount[i].reduce((a, b) => a + b, 0);
      for (let j = 0; j < ngroups; j++) {
          if(total>0){
            colorsDiverCount[i][j] = Math.round((colorsDiverCount[i][j] / total) * 10000) / 100; // round to 2 decimal places
          }else{
            colorsDiverCount[i][j] = 0;
          }
      }
  }
  console.log("colorsDiverCount (%): ", colorsDiverCount);

  ///////////////////////////////////////////////
  let API_ID_index = document.querySelector("#name_row1").value;
  

  let header = `
    <tr>
        <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">API<br>(ID)<br></span> </th>
        <th style="width: 150px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Basin<br>(ID)<br></span> </th>
        <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Risk Quotient<br>${colorsDiver[3]}</span> </th>
        <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Risk Quotient<br>${colorsDiver[2]}</span> </th>
        <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Risk Quotient<br>${colorsDiver[1]}</span> </th>
        <th style="width: 200px;" class="basinStats tableHeaderStats"> <span class="firstSpan">Risk Quotient<br>${colorsDiver[0]}</span> </th>
    </tr>`
  
  let data = "";
  for(let i = 0; i < unique_basin_IDs.length; i++) {
      data += `<tr>
      <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${API_ID_index}" readonly /></td>
      <td><input style="width: 150px;" class="tableHeaderStats" type="text" id="statcol" value="${unique_basin_IDs[i]}" readonly /></td>
      <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${colorsDiverCount[i][3]}%" readonly /></td>
      <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${colorsDiverCount[i][2]}%" readonly /></td>
      <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${colorsDiverCount[i][1]}%" readonly /></td>
      <td><input style="width: 200px;" class="tableHeaderStats" type="text" id="statcol" value="${colorsDiverCount[i][0]}%" readonly /></td>
      </tr>`
  }

  let elem = document.querySelector("#API_table_RiskStats")
  innerHTML = header + data;
  elem.innerHTML = innerHTML;

  ///////////////////////////////////////////////


}

// export to global
window.CalculateRiskStatistics = CalculateRiskStatistics;

