/* eslint-disable */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Read CSV file and return promise with data
function readCsvFile(filePath, separator = ',', encoding = 'utf8') {
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
function readJsonFile(filePath) {
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
function writeCsvFile(data, filePath, separator = ';') {
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
function toNumeric(value, errors = 'coerce') {
    if (value === null || value === undefined || value === '' || value === 'NA') {
        return errors === 'coerce' ? null : value;
    }
    
    const num = parseFloat(value);
    return isNaN(num) && errors === 'coerce' ? null : num;
}

// Get unique values from array column
function getUniqueValues(data, column) {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
    return [...new Set(values)];
}

// Filter dataframe by column values
function filterDataFrame(data, column, values) {
    return data.filter(row => values.includes(String(row[column])));
}

// Remove columns that start with "Unnamed"
function removeUnnamedColumns(data) {
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
function mergeDataFrames(left, right, onColumns, how = 'left') {
    const result = [];
    
    for (const leftRow of left) {
        let matched = false;
        
        for (const rightRow of right) {
            // Check if all join columns match
            const matches = onColumns.every(col => 
                String(leftRow[col]) === String(rightRow[col])
            );
            
            if (matches) {
                // Merge the rows
                const mergedRow = { ...leftRow };
                for (const [key, value] of Object.entries(rightRow)) {
                    if (!onColumns.includes(key)) {
                        mergedRow[key] = value;
                    }
                }
                result.push(mergedRow);
                matched = true;
                break;
            }
        }
        
        if (!matched && how === 'left') {
            // Add the left row with null values for right columns
            const mergedRow = { ...leftRow };
            if (right.length > 0) {
                for (const key of Object.keys(right[0])) {
                    if (!onColumns.includes(key)) {
                        mergedRow[key] = null;
                    }
                }
            }
            result.push(mergedRow);
        }
    }
    
    return result;
}

module.exports = {
    readCsvFile,
    readJsonFile,
    writeCsvFile,
    toNumeric,
    getUniqueValues,
    filterDataFrame,
    removeUnnamedColumns,
    mergeDataFrames
};