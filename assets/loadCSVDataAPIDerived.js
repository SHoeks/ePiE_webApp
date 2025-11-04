const fs = require("fs");
const { join } = require('path');

export default function loadCSVDataAPIDerived(dirpath, filename){

    console.log('loadFile csv data');
    let csv_path = join(dirpath, filename)

    let read_stream = fs.readFileSync(csv_path); //
    let csv_string = read_stream.toString();
    
    // split string by ;
    let csv_rows = csv_string.split('\n');
    let csv_data = [];
    for (let i = 0; i < csv_rows.length; i++) {
        let row = csv_rows[i].split(';');
        csv_data.push(row);
    }

    return csv_data;
}