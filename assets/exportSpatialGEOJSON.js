import { dialog } from '@electron/remote'
import fs from 'fs'
const isDevelopment = process.env.NODE_ENV !== 'production'

export default function exportSpatialGEOJSON(fullTempPathDir) {
    
    console.log("exportSpatialGEOJSON")
    
    // check path results file (goejson)
    var tmpdir = fullTempPathDir;
    var lastChar = tmpdir.substr(-1); 
    if (lastChar != '/') tmpdir = tmpdir + '/';
    let pts_file = tmpdir+'pts.geojson';
    if(isDevelopment) pts_file = tmpdir+'pts.geojson';
    console.log("pts_file: ",pts_file);

    // check if file exists
    if (!fs.existsSync(pts_file)) {
        console.log('File not found!');
        dialog.showMessageBox({
          title: 'No results found',
          message: 'Unable to generate map, no results found. Please run ePiE first.',
          buttons: ['OK']
        })
        return;
    }

    // output dialog options
    var options = {
        title: "Save result file",
        defaultPath : "ePiE_spatial_prediction.geojson",
        buttonLabel : "Save",
        filters :[
            {name: 'geojson', extensions: ['geojson']},
            {name: 'All Files', extensions: ['*']}
        ]
    };

    // show save dialog
    dialog.showSaveDialog(null, options).then(({ filePath }) => {
        if(filePath === undefined || filePath==""){
            console.log("No file selected");
            return;
        }else{
            if(fs.existsSync(pts_file)) {
                fs.copyFileSync(pts_file, filePath);
            }
        }
    });
}
