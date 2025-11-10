import fs from 'fs'
import { dialog } from '@electron/remote'
var _ = require('underscore');
var appRootDir = require('app-root-dir').get();
const isDevelopment = process.env.NODE_ENV !== 'production'

export default function createOutputMap(varNcolorsCheck, gradientArray, fullTempPathDir) {

    console.log("createOutputMap")

    // var osm = require('osm');
    // var map = osm().position(47.88038, 10.6222475);
    // console.log(map.show())

    // var mapelem = document.querySelector("#osm_map");
    // if(mapelem.hasChildNodes()){
    //   mapelem.replaceChild(map.show(), mapelem.childNodes[0]);
    // }else{
    //   mapelem.appendChild(map.show());
    // }
    var L = require('leaflet');

    // check path results file (goejson)
    var tmpdir = fullTempPathDir;
    var lastChar = tmpdir.substr(-1); 
    if (lastChar != '/') tmpdir = tmpdir + '/';
    let pts_file = tmpdir+'pts.geojson';
    if(isDevelopment) pts_file = tmpdir+'pts.geojson';
    console.log(pts_file);
    
    if (!fs.existsSync(pts_file)) {
      console.log('File not found!');
      dialog.showMessageBox({
        title: 'No results found',
        message: 'Unable to generate map, no results found. Please run ePiE first.',
        buttons: ['OK']
      })
      return;
    }

    // read pts ePiE output
    let rawdata = fs.readFileSync(pts_file);
    let pts = JSON.parse(rawdata);

    // check size of pts files
    console.log('pts.features.length: ' + pts.features.length);

    // remove lake points
    console.log('Removing lake points ...');
    console.log('pts.features.length: ' + pts.features.length);
    pts.features = pts.features.filter(pt => pt.properties.HylakId === "-999");
    console.log('pts.features.length: ' + pts.features.length);

    // sample points if too many
    let sampleSize = 100000;
    if(pts.features.length>sampleSize){
      console.log('sampleSize: ' + sampleSize);
      console.log('pts.features.length > ',sampleSize);
      let tmpPts = [];
      tmpPts = _.sample(pts.features, sampleSize);
      pts.features = tmpPts;
      console.log('pts.features.length: ' + pts.features.length);
    }
    
    
    // get result stats
    var center_x = 0;
    var center_y = 0;
    var logCwmin = 0;
    var logCwmax = 0;
    var tmp = 0;
    for (let i = 0; i < pts.features.length; i++) {
      center_x += pts.features[i].geometry.coordinates[0];
      center_y += pts.features[i].geometry.coordinates[1];
      if(pts.features[i].properties.C_w === null || pts.features[i].properties.C_w === 0){
        continue;
      }
      tmp = Math.log10(pts.features[i].properties.C_w);
      if (tmp < logCwmin) logCwmin = tmp;
      if (tmp > logCwmax) logCwmax = tmp;
    }
    center_x = center_x / pts.features.length;
    center_y = center_y / pts.features.length;
    console.log('center_y:' + center_y + ' center_x:' + center_x);
    console.log('logCwmin:' + logCwmin + ' logCwmax:' + logCwmax);

    var logCwRange = Math.abs(logCwmax - logCwmin);
    console.log('logCwRange:' + logCwRange);

    var ColorStepsLog10 = logCwRange/varNcolorsCheck;
    console.log('ColorStepsLog10 (logCwRange/varNcolorsCheck):' + ColorStepsLog10);
    
    var ColorIdxs = 0;
    for (let i = 0; i < pts.features.length; i++) {
      if(pts.features[i].properties.C_w === null || pts.features[i].properties.C_w === 0){
        pts.features[i].properties.Color = gradientArray[0];//"#909090";
      }else{
        ColorIdxs = Math.floor((Math.log10(pts.features[i].properties.C_w) - logCwmin) / ColorStepsLog10);
        pts.features[i].properties.Color = gradientArray[ColorIdxs];
      }
    }

    console.log(pts.features[10]);

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

    //L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',{maxZoom:10}).addTo(map);
    if(isDevelopment){
      L.tileLayer(appRootDir+'/resources/tiles/{z}/{x}/{y}.png',{maxZoom:8, minZoom: 4,opacity: 0.5}).addTo(map);
    }else{
      L.tileLayer(appRootDir+'/tiles/{z}/{x}/{y}.png',{maxZoom:8, minZoom: 4,opacity: 0.5}).addTo(map);
    }

    var geoJson = new L.geoJSON(pts, {
        pointToLayer: (feature) => {
            //return new L.Circle([feature.properties.latitude, feature.properties.longitude], 100);
            return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
            {
              renderer: myRenderer,
              color: feature.properties.Color,//gradientArray[0],
              fillColor: feature.properties.Color,//gradientArray[0],
              fillOpacity: 0.5,
              radius: 2
            });
        },
        onEachFeature: function (feature, layer) {
            // layer.bindPopup('<p> ug/L: '+ feature.properties.C_w + ' ' + Math.log10(feature.properties.C_w));
            layer.bindPopup('<p> ug/L: '+ feature.properties.C_w + '<br> Pt_type: ' + feature.properties.Pt_type + '</p>');
        }
    })

    geoJson.addTo(map);

    // legend
    var legend = L.control({ position: "topright" });

    legend.onAdd = function() {
      var div = L.DomUtil.create("div", "legend");
      div.id = "outputmaplegend";
      div.innerHTML += "<h4>Legend</h4>";
      div.innerHTML += "<h5 style='font-size:0.8rem;'>Log10 concentration ug/L</h5>";

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

}