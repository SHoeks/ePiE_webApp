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
  var hl = epie_results_hl; // hydro lakes results
  
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
    alert('Unable to generate map, risk threshold is not valid. Please enter a valid risk threshold.');
    return;
  }

  // check size of pts files
  console.log(pts);
  console.log('pts.length: ' + pts.length);

  // // remove lake points
  // console.log('Removing lake points ...');
  // console.log('pts.length: ' + pts.length);
  // pts = pts.filter(function(pt) {
  //   return pt.HylakId === -999;
  // });
  // console.log('pts.length: ' + pts.length);

  // sample points if too many
  let sampleSize = 100000;
  function randomInt(maxIndex) {
    return Math.floor(Math.random() * (maxIndex + 1));
  }
  if(pts.length>sampleSize){
    console.log('Sampling points ...');
    console.log('pts.length before sampling: ' + pts.length);
    keep_idxs = [];
    for(let i=0; i<sampleSize; i++){
      let rand_idx = randomInt(pts.length-1);
      while(keep_idxs.includes(rand_idx)){
        rand_idx = randomInt(pts.length-1);
      }
      keep_idxs.push(rand_idx);
    }
    pts = pts.filter(function(pt, index) {
      return keep_idxs.includes(index);
    });
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

  // funnction for getting color
  function getColor(c_w_ngL, pnec) {
    const ratio = c_w_ngL / pnec;
    if (c_w_ngL === null || c_w_ngL === 0) {
      return "#888888"; // gray for null or zero values
    }else{
      return ratio > 10 ? colorsDiver[0] :
            ratio > 1  ? colorsDiver[1] :
            ratio > 0.1  ? colorsDiver[2] :
                        colorsDiver[3];
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

  L.tileLayer.wms('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    opacity: 0.6
  }).addTo(map)

  // var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  //   attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  //   maxZoom: 19
  // }).addTo(map);


  const pts2 = pts.map(pt => {
    return {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [pt.x, pt.y]
      },
      "properties": {
        "ID": pt.ID,
        "ID_nxt": pt.ID_nxt,
        "basin_ID": pt.basin_ID,
        "C_w": pt.C_w * 1000,
        "Pt_type": pt.Pt_type,
        "Color": pt.Color,
        "Alpha": pt.Alpha
      }
    };
  });

  // console.log(pts2[10]);

  // add id full to pts 
  pts = pts.map(pt => {
    return {
      ...pt,
      ID_full: pt.basin_ID + "_" + pt.ID,
      ID_nxt_full: pt.basin_ID + "_" + pt.ID_nxt
    };
  });

  // Create lookup table for coordinates by full ID
  const coordLookup = new Map(
    pts.map(pt => [pt.ID_full, [pt.x, pt.y]])
  );

  // Create line features from ID to ID_nxt
  const lines = pts
    .filter(pt => pt.ID_nxt != null && coordLookup.has(pt.ID_nxt_full))
    .map(pt => {
      return {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [pt.x, pt.y],                 // start: ID
            coordLookup.get(pt.ID_nxt_full)    // end: ID_nxt
          ]
        },
        "properties": {
          "ID": pt.ID,
          "ID_nxt": pt.ID_nxt,
          "C_w": pt.C_w * 1000, // convert from ug/L to ng/L
          "Ew": pt.Ew,
          "Pt_type": pt.Pt_type,
          "Color": pt.Color,
          "Alpha": pt.Alpha
        }
      };
    });

  // Function to determine the radius of plotted points based on zoom
  function getPointRadius() {
    let radius = Math.max(3, map.getZoom() - 7);
    // console.log("radius: ",radius);
    return radius;
  }

  // Function to determine width of plotted lines based on zoom
  function getLineWidth() {
    let linewidth = Math.max(3, map.getZoom() - 8);
    // console.log("linewidth: ",linewidth);
    return linewidth;
  }

  var geoJson = new L.geoJSON(pts2, {
      filter: function(feature) {return feature.properties.Pt_type === "WWTP" || feature.properties.Pt_type === "Agglomeration";}, // only show WWTP points
      pointToLayer: (feature) => {
          //return new L.Circle([feature.properties.latitude, feature.properties.longitude], 100);
          return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
          {
            renderer: myRenderer,
            color: feature.properties.Color,//gradientArray[0],
            fillColor: feature.properties.Color,//gradientArray[0],
            fillOpacity: feature.properties.Alpha,
            radius: getPointRadius()
          });
      },
      onEachFeature: function (feature, layer) {
          // layer.bindPopup('<p> ug/L: '+ feature.properties.C_w + ' ' + Math.log10(feature.properties.C_w));
          layer.bindPopup('<p> ng/L: '+ feature.properties.C_w);
      }
  });

  geoJson.addTo(map);

  // add lines to map
  var lineGeoJson = new L.geoJSON(lines, {
      style: function(feature) {
          return {
              renderer: myRenderer,
              color: feature.properties.Color,
              weight: getLineWidth(),
              opacity: feature.properties.Pt_type === "Hydro_Lake" ? 0.7 : 0.8
          };
      },
      onEachFeature: function (feature, layer) {
          layer.bindPopup(
              '<p>ID: ' + feature.properties.ID +
              '<br> Pt_type: ' + feature.properties.Pt_type + 
              // '<br>ID_nxt: ' + feature.properties.ID_nxt +
              '<br>Concentration (ng/L): ' + feature.properties.C_w +
              '<br>Emission (kg/yr): ' + feature.properties.Ew + 
              '</p>'
          );
      }
  });
  lineGeoJson.addTo(map);

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

  // Update lines when zoom changes
  map.on('zoomend', function() {
    lineGeoJson.setStyle({
        weight: getLineWidth()
    });
    geoJson.setStyle({
        radius: getPointRadius()
    });
  });


  // get all unique basin_ID from pts2
  const uniqueBasinIDs = [...new Set(pts2.map(pt => pt.properties.basin_ID))];
  console.log("Unique Basin IDs:", uniqueBasinIDs);

  // Create a lookup map for HylakId to C_w from hl
  const hlLookup = new Map(hl.map(item => [item.HylakId, item.C_w]));

  // load and plot lakes for the unique basin_IDs
  for (const basinID of uniqueBasinIDs) {
    const lakeFilePath = `../data/subsetted_lakes/lakes_${basinID}.js`;
    import(lakeFilePath)
        .then(module => {
            console.log(`Loaded ${lakeFilePath}`);
            const lakes = module.LakeData || module.default;

            const lakesWithCw = {
              ...lakes,
              features: lakes.features.map(feature => {
                const cw = hlLookup.get(feature.properties.Hylak_id);
                const cwNgL = cw != null ? cw * 1000 : null;
                return {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    C_w: cwNgL,
                    Color: getColor(cwNgL, pnec)
                  }
                };
              })
            };

            var lakesGeoJson = new L.geoJSON(lakesWithCw, {
                onEachFeature: function (feature, layer) {
                  layer.bindPopup(
                    '<p>Lake ID: ' + feature.properties.Hylak_id +
                    '<br>Lake Name: ' + feature.properties.Lake_name +
                    '<br>Concentration (ng/L): ' + (feature.properties.C_w != null ? feature.properties.C_w : 'N/A') +
                    '</p>'
                  );
                },
                style: function(feature) {
                    const fill = feature.properties.Color;
                    return {
                      color: fill,
                      fillColor: fill,
                      fillOpacity: 0.7,
                      weight: 1
                    };
                }
            });
            lakesGeoJson.addTo(map);
            console.log(module.LakeData);
        })
        .catch(err => console.error(err));
  }


}