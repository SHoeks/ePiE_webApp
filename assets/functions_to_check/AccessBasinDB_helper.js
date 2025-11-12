 /* eslint-disable */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Extract numeric values from the string
function parseBasinVector(s) {
    const match = s.match(/c\((.*?)\)/);
    if (match) {
        const contents = match[1];
        const arr = contents.split(',').map(item => item.trim());
        return arr;
    } else {
        return [];
    }
}

// Read CSV file and return promise with data
function readCsvFile(filePath, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            resolve([]);
            return;
        }

        fs.createReadStream(filePath, { encoding })
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Read multiple files and filter by basin IDs
async function readFilesAsPdSubsetByBasinId(files, basinIds) {
    const allData = [];
    
    for (const file of files) {
        if (fs.existsSync(file)) {
            try {
                const df = await readCsvFile(file);
                // Convert basin_id to string and filter
                const filteredData = df.filter(row => {
                    const basinId = String(row.basin_id);
                    return basinIds.includes(basinId);
                });
                allData.push(...filteredData);
            } catch (error) {
                console.error(`Error reading file ${file}:`, error);
            }
        }
    }
    
    return allData;
}

// Read multiple files with schema validation and filter by basin IDs
async function readFilesAsPdSubsetByBasinIdWithSchema(files, basinIds, schemaSelect) {
    const allData = [];
    
    for (const file of files) {
        if (fs.existsSync(file)) {
            try {
                const df = await readCsvFile(file);
                
                // Apply schema validation (convert types based on schema)
                const processedData = df.map(row => {
                    const processedRow = { ...row };
                    
                    for (const [key, type] of Object.entries(schemaSelect)) {
                        if (processedRow[key] !== undefined && processedRow[key] !== null && processedRow[key] !== '') {
                            if (type === 'string' || type === 'str') {
                                processedRow[key] = String(processedRow[key]);
                            } else if (type === 'float' || type === 'number') {
                                processedRow[key] = parseFloat(processedRow[key]);
                                if (isNaN(processedRow[key])) processedRow[key] = null;
                            } else if (type === 'Int64' || type === 'int') {
                                processedRow[key] = parseInt(processedRow[key]);
                                if (isNaN(processedRow[key])) processedRow[key] = null;
                            }
                        }
                    }
                    
                    return processedRow;
                });
                
                // Filter by basin IDs
                const filteredData = processedData.filter(row => {
                    const basinId = String(row.basin_id);
                    return basinIds.includes(basinId);
                });
                
                allData.push(...filteredData);
            } catch (error) {
                console.error(`Error reading file ${file}:`, error);
            }
        }
    }
    
    return allData;
}

// Write data to JSON file (equivalent to feather format)
function writeToJsonFile(data, filePath) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Get unique values from array
function getUniqueValues(arr) {
    return [...new Set(arr)];
}
module.exports = {
    parseBasinVector,
    readCsvFile,
    readFilesAsPdSubsetByBasinId,
    readFilesAsPdSubsetByBasinIdWithSchema,
    writeToJsonFile,
    getUniqueValues
};