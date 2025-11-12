const fs = require("fs");
export default function CSVtoGeoJSON(s,geojsonpath) {

    s = s.split(/\r?\n|\r|\n/g);
    let h = s[0].split(";");
    // console.log(h);
    // console.log(s);
    // find c_w in h
    let c_w_index = h.indexOf("C_w");
    // let ID_index = h.indexOf("ID");
    let Pt_type_index = h.indexOf("Pt_type");
    let ptsHylakId_index = h.indexOf("HylakId");
    let x_index = h.indexOf("x");
    let y_index = h.indexOf("y");
    console.log("c_w_index: ", c_w_index);
    console.log("x_index: ", x_index);
    console.log("y_index: ", y_index);
  
    let x = 0.0;
    let y = 0.0;
    let c_w = 0.0;
    // let ID = "?";
    let Pt_type = "?";
    let HylakId = 0;
  
    let header = `{
      "type": "FeatureCollection",
      "name": "pts.geojson",
      "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      "features": [`;
    let feature_template = ``;
    let footer = `]
    }`;
    let features = header + "\n";
    for (let i = 1; i < s.length; i++) {
      let line = s[i].split(";");
      x = line[x_index];
      y = line[y_index];
      c_w = line[c_w_index];
      // ID = line[ID_index];
      Pt_type = line[Pt_type_index];
      HylakId = line[ptsHylakId_index];
      if(c_w === undefined | c_w == "") c_w = null;
      if(x === undefined | x === "") continue;
      feature_template = `{ "type": "Feature", "properties": { "C_w": ${c_w}, "HylakId": "${HylakId}", "Pt_type": "${Pt_type}" }, "geometry": { "type": "Point", "coordinates": [ ${x}, ${y} ] } }`
      if(i == s.length - 2) {
        features += feature_template + "\n";
      }else{
        features += feature_template + "," + "\n";
      }
    }
    features += "\n" + footer;
    //console.log(features);
  
    // write to geojson file
    fs.writeFileSync(geojsonpath, features);
  
}