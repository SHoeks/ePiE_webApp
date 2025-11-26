// import fs from 'fs'
// import { dialog } from '@electron/remote'
// var _ = require('underscore');
// var appRootDir = require('app-root-dir').get();
// const isDevelopment = process.env.NODE_ENV !== 'production'

// export default 
function createPNECOutputMap( ) {

  console.log("createPNECOutputMap")

  // define color ramp
  const colorsDiver = ["#CC0000", "#e48646", "#8cb5e9", "#4570a8"];
  const riskVals = [">10", "10-1", "1-0.1", "<0.1"];

  // retreive ePie results
  var pts = epie_results; // assuming ePie_results is an array of objects with x, y, and other properties
  
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

  // get pnec value
  let pnec = document.querySelector("#riskval").value;
  pnec = parseFloat(pnec);
  console.log('pnec: ' + pnec);
  
  // stop if pnec is NaN    
  if (isNaN(pnec)) {
    console.log('pnec is NaN!');
    alert('Unable to generate map, PNEC value is not valid. Please enter a valid PNEC value.');
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

  // sample points if too many
  let sampleSize = 100000;
  if(pts.length>sampleSize){
    console.log('Sampling points ...');
    console.log('pts.length before sampling: ' + pts.length);
    pts = _.sample(pts, sampleSize);
    console.log('pts.length after sampling: ' + pts.length);
  }
  
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
    tmp = pts[i].C_w / pnec;
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
      ratio = (pts[i].C_w / pnec);
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

  // destroy map if it exists
  var map_tmp = L.DomUtil.get('pnec_map')
  if (map_tmp.classList.contains("leaflet-container")) {
    console.log('destroy previous map');
    map_tmp.remove();
    map_tmp = null;
    document.getElementById('pnec_mapholder').innerHTML = '<div id="pnec_map"></div>';
  }
  
  var map = L.map('pnec_map').setView([center_y, center_x], 6);
  var myRenderer = L.canvas({ padding: 0.5 });

  // //L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',{maxZoom:10}).addTo(map);
  // if(isDevelopment){
  //   L.tileLayer(appRootDir+'/resources/tiles/{z}/{x}/{y}.png',{maxZoom:8, minZoom: 4,opacity: 0.5}).addTo(map);
  // }else{
  //   L.tileLayer(appRootDir+'/tiles/{z}/{x}/{y}.png',{maxZoom:8, minZoom: 4,opacity: 0.5}).addTo(map);
  // }

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  const pts2 = pts.map(pt => {
    return {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [pt.x, pt.y]
      },
      "properties": {
        "C_w": pt.C_w,
        "Pt_type": pt.Pt_type,
        "Color": pt.Color,
        "Alpha": pt.Alpha
      }
    };
  });

  console.log(pts2[10]);


  var geoJson = new L.geoJSON(pts2, {
      pointToLayer: (feature) => {
          //return new L.Circle([feature.properties.latitude, feature.properties.longitude], 100);
          return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
          {
            renderer: myRenderer,
            color: feature.properties.Color,//gradientArray[0],
            fillColor: feature.properties.Color,//gradientArray[0],
            fillOpacity: feature.properties.Alpha,
            radius: 2
          });
      },
      onEachFeature: function (feature, layer) {
          // layer.bindPopup('<p> ug/L: '+ feature.properties.C_w + ' ' + Math.log10(feature.properties.C_w));
          layer.bindPopup('<p> ug/L: '+ feature.properties.C_w);
      }
  });

  geoJson.addTo(map);

  // legend
  var legend = L.control({ position: "topright" });

  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "legend");
    div.id = "outputmaplegend";
    div.innerHTML += "<h4 style='margin: 2px 0px;'>Legend</h4>";
    div.innerHTML += "<h5 style='font-size:0.8rem;margin: 5px 0px;'>Risk Quotient</h5>";

    for (let i = 0; i < colorsDiver.length; i++) {
      div.innerHTML += `<div id="legendColorBox" style="background: ${colorsDiver[i]}"></div><span>${riskVals[i]}</span><br>`;
    }      
    // div.innerHTML += '<div id="legendColorBox" style="background: #448D40"></div><span>Forest</span><br>';
    // div.innerHTML += '<div id="legendColorBox" style="background: #E6E696"></div><span>Land</span><br>';
    // div.innerHTML += '<div id="legendColorBox" style="background: #E8E6E0"></div><span>Residential</span><br>';
    // div.innerHTML += '<div id="legendColorBox" style="background: #FFFFFF"></div><span>Ice</span><br>';
    return div;
  };

  legend.addTo(map);

}