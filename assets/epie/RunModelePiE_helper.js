// /* eslint-disable */
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Read CSV file and return promise with data
export function readCsvFile(filePath, separator = ',', encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            resolve([]);
            return;
        }

        fs.createReadStream(filePath, { encoding })
            .pipe(csv({ separator }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Read JSON file (equivalent to reading feather files)
export function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            resolve([]);
            return;
        }

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseErr) {
                    reject(parseErr);
                }
            }
        });
    });
}

// Write data to CSV file
export function writeCsvFile(data, filePath, separator = ';') {
    return new Promise((resolve, reject) => {
        if (data.length === 0) {
            resolve();
            return;
        }

        const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
        const csvWriter = createCsvWriter({
            path: filePath,
            header: headers,
            fieldDelimiter: separator
        });

        csvWriter.writeRecords(data)
            .then(() => resolve())
            .catch(err => reject(err));
    });
}

// Convert numeric string to number, handling errors
export function toNumeric(value, errors = 'coerce') {
    if (value === null || value === undefined || value === '' || value === 'NA') {
        return errors === 'coerce' ? null : value;
    }
    
    const num = parseFloat(value);
    return isNaN(num) && errors === 'coerce' ? null : num;
}

// Get unique values from array column
export function getUniqueValues(data, column) {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
    return [...new Set(values)];
}

// Filter dataframe by column values
export function filterDataFrame(data, column, values) {
    return data.filter(row => values.includes(String(row[column])));
}

// Remove columns that start with "Unnamed"
export function removeUnnamedColumns(data) {
    if (data.length === 0) return data;
    
    const filteredData = data.map(row => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
            if (!key.startsWith('Unnamed')) {
                newRow[key] = value;
            }
        }
        return newRow;
    });
    
    return filteredData;
}

// Merge two datasets on specified columns
export function mergeDataFrames(pts, flow) {
    
    for( let i=0; i<pts.length; i++){
        pts[i]['tmpid_pts'] = String(pts[i]['basin_id']) + "_" + String(pts[i]['ID']);
        flow[i]['tmpid_flow'] = String(flow[i]['basin_id']) + "_" + String(pts[i]['ID']);
    }

    // console.log("Merging data on 'tmpid'...");
    // console.log("- pts length:", pts.length);
    // console.log("- flow length:", flow.length);
    // console.log("- pts", pts);
    // console.log("- flow", flow);

    const flowIndex = new Map();
    flow.forEach(row => {
        flowIndex.set(row['tmpid_flow'], row);
    });

    const merged = pts.map(ptsRow => {
        const flowRow = flowIndex.get(ptsRow['tmpid_pts']) || {};
        return { ...ptsRow, ...flowRow };
    });

    // Clean up temporary keys
    merged.forEach(row => {
        delete row['tmpid_pts'];
        delete row['tmpid_flow'];
    });

    // console.log("- merged", merged);
    return merged;
    
}

// module.exports = {
//     readCsvFile,
//     readJsonFile,
//     writeCsvFile,
//     toNumeric,
//     getUniqueValues,
//     filterDataFrame,
//     removeUnnamedColumns,
//     mergeDataFrames
// };

