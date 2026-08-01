// import fs from 'fs'
// import { dialog } from '@electron/remote'
// var _ = require('underscore');
// var appRootDir = require('app-root-dir').get();
// const isDevelopment = process.env.NODE_ENV !== 'production'

function createOutputMap() {

  console.log("createOutputMap")

  // define color ramp
  // const gradientArray = [ "#3f2caf",
  //                         "#503cab",
  //                         "#624ba7",
  //                         "#735ba3",
  //                         "#856b9f",
  //                         "#967a9c",
  //                         "#a78a98",
  //                         "#b99a94",
  //                         "#caaa90",
  //                         "#dcb98c",
  //                         "#edbd85",
  //                         "#ecb183",
  //                         "#eca580",
  //                         "#ec997d",
  //                         "#eb8d7a",
  //                         "#eb8078",
  //                         "#ea7475",
  //                         "#ea6872",
  //                         "#ea5c6f",
  //                         "#e9506d" ];
  
  // similar gradiet but more intese red
  const gradientArray = [ "#3f2caf",
                          "#503cab",
                          "#624ba7",
                          "#735ba3",
                          "#856b9f",
                          "#967a9c",
                          "#a78a98",
                          "#b99a94",
                          "#caaa90",
                          "#dcb98c",
                          "#ed9e76",
                          "#ed8c65",
                          "#ed7a54",
                          "#ec6843",
                          "#ec572f",
                          "#eb451c",
                          "#eb3409",
                          "#ea2200",
                          "#ea1100",
                          "#e90000" ];

  
  var varNcolorsCheck = gradientArray.length;

  console.log("createOutputMap")
  console.log("varNcolorsCheck: ",varNcolorsCheck);
  console.log("gradientArray: ",gradientArray);

  // retreive ePie results
  var pts = epie_results; // assuming ePie_results is an array of objects with x, y, and other properties
  var hl = epie_results_hl; // hl results (hydro lakes)
  
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

  // check size of pts files
  console.log(pts);
  console.log('pts.length: ' + pts.length);

  // remove lake points
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
    tmp = Math.log10(pts[i].C_w * 1000); // convert from ug/L to ng/L
    if (tmp < logCwmin) logCwmin = tmp;
    if (tmp > logCwmax) logCwmax = tmp;
  }
  center_x = center_x / pts.length;
  center_y = center_y / pts.length;
  console.log('center_y:' + center_y + ' center_x:' + center_x);
  console.log('logCwmin:' + logCwmin + ' logCwmax:' + logCwmax);

  var logCwRange = Math.abs(logCwmax - logCwmin);
  console.log('logCwRange:' + logCwRange);

  var ColorStepsLog10 = logCwRange/varNcolorsCheck;
  console.log('ColorStepsLog10 (logCwRange/varNcolorsCheck):' + ColorStepsLog10);
  
  var ColorIdxs = 0;
  for (let i = 0; i < pts.length; i++) {
    if(pts[i].C_w === null || pts[i].C_w === 0){
      pts[i].Color = gradientArray[0];//"#909090";
    }else{
      ColorIdxs = Math.floor((Math.log10(pts[i].C_w * 1000) - logCwmin) / ColorStepsLog10);
      pts[i].Color = gradientArray[ColorIdxs];
    }
  }

  console.log(pts[10]);

  // destroy map if it exists
  var map_tmp = L.DomUtil.get('map')
  if (map_tmp.classList.contains("leaflet-container")) {
    console.log('destroy previous map');
    map_tmp.remove();
    map_tmp = null;
    document.getElementById('mapholder').innerHTML = '<div id="map"></div>';
  }
  
  var map = L.map('map').setView([center_y, center_x], 6);
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
        "C_w": pt.C_w * 1000 , // convert from ug/L to ng/L
        "Ew": pt.Ew,
        // "f_rem_WWTP": pt.f_rem_WWTP,
        // "rptMStateK": pt.rptMStateK,
        "basin_ID": pt.basin_ID,
        "ID": pt.ID,
        "Pt_type": pt.Pt_type,
        "Color": pt.Color
      }
    };
  });

  // add id full to pts 
  pts = pts.map(pt => {
    return {
      ...pt,
      ID_full: pt.basin_ID + "_" + pt.ID,
      ID_nxt_full: pt.basin_ID + "_" + pt.ID_nxt
    };
  });

  // Create lookup table for coordinates by ID
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
          "Color": pt.Color
        }
      };
    });

  // console.log(pts2[10]);

  // add pts2 to map
  var geoJson = new L.geoJSON(pts2, {
      filter: function(feature) {return feature.properties.Pt_type === "WWTP" || feature.properties.Pt_type === "Agglomeration";}, // only show WWTP points
      pointToLayer: (feature) => {
          //return new L.Circle([feature.properties.latitude, feature.properties.longitude], 100);
          return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
          {
            renderer: myRenderer,
            color: feature.properties.Color,//gradientArray[0],
            fillColor: feature.properties.Color,//gradientArray[0],
            fillOpacity: 0.5,
            radius: getPointRadius()
          });
      },
      onEachFeature: function (feature, layer) {
          layer.bindPopup( 
            '<p> Pt_type: ' + feature.properties.Pt_type + 
            '<br> Concentration (ng/L): '+ feature.properties.C_w + 
            '<br> Emission (kg/yr): ' + feature.properties.Ew + 
            // '<br> ID: ' + feature.properties.ID +
            // '<br> Ew: ' + feature.properties.Ew + 
            '</p>'
          );
      }
  })
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
    div.innerHTML += "<h5 style='font-size:0.8rem;margin: 5px 0px;'>Log10 concentration ng/L</h5>";

    let colors = [];
    let values = [];
    let minValCeil = Math.ceil(logCwmin);
    let maxValCeil = Math.ceil(logCwmax);
    let diff = maxValCeil - minValCeil;
    let startval = minValCeil-1.00;
    startval = startval.toFixed(2)
    colors.push(gradientArray[0]);
    values.push(startval);

    let legval = 0.00;
    for (let i = 0; i < diff; i++) {
      legval = minValCeil + (i * 1)
      ColorIdxs = Math.floor((legval - logCwmin) / ColorStepsLog10);
      let color = gradientArray[ColorIdxs];
      let value = legval.toFixed(2);
      colors.push(color);
      values.push(value);
    }

    for (let i = 0; i < colors.length; i++) {
      div.innerHTML += `<div id="legendColorBox" style="background: ${colors[i]}"></div><span>${values[i]}</span><br>`;
    }      
    // div.innerHTML += '<div id="legendColorBox" style="background: #448D40"></div><span>Forest</span><br>';
    // div.innerHTML += '<div id="legendColorBox" style="background: #E6E696"></div><span>Land</span><br>';
    // div.innerHTML += '<div id="legendColorBox" style="background: #E8E6E0"></div><span>Residential</span><br>';
    // div.innerHTML += '<div id="legendColorBox" style="background: #FFFFFF"></div><span>Ice</span><br>';
    return div;
  };

  legend.addTo(map);

  // Function to determine width of plotted lines based on zoom
  function getLineWidth() {
    let linewidth = Math.max(3, map.getZoom() - 8);
    // console.log("linewidth: ",linewidth);
    return linewidth;
  }

  // Function to determine the radius of plotted points based on zoom
  function getPointRadius() {
    let radius = Math.max(3, map.getZoom() - 7);
    // console.log("radius: ",radius);
    return radius;
  }

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

  function getGradientColor(cw_ngl) {
    if (cw_ngl == null || cw_ngl === 0) return gradientArray[0];
    let idx = Math.floor((Math.log10(cw_ngl) - logCwmin) / ColorStepsLog10);
    idx = Math.max(0, Math.min(idx, gradientArray.length - 1));
    return gradientArray[idx];
  }
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
                    Color: getGradientColor(cwNgL)
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
                    const fill = feature.properties.Color || getGradientColor(feature.properties.C_w);
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