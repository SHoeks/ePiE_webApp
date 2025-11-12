 /* eslint-disable */
const fs = require('fs');
const path = require('path');

// Extract numeric values from the string (same as AccessBasinDB.js)
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

// Convert value to numeric, handling errors
function toNumeric(value, errors = 'coerce') {
    if (value === null || value === undefined || value === '' || value === 'NA') {
        return errors === 'coerce' ? null : value;
    }
    
    const num = parseFloat(value);
    return isNaN(num) && errors === 'coerce' ? null : num;
}

// Check if column exists, create with default value if not
function checkIfColumnExistsCreateEmpty(data, colname, defaultValue) {
    if (data.length === 0) return data;
    
    const hasColumn = data[0].hasOwnProperty(colname);
    if (!hasColumn) {
        data.forEach(row => {
            row[colname] = defaultValue;
        });
    }
    return data;
}

// Placeholder for SimpleTreat4_0 function
function simpleTreat40(classType, MW, Pv, S, pKa, KpPsN, KpAsN, kBioWwtpN, 
                      TAIR, Wind, Inh, EInDaily, uwwPrimary, uwwSeconda) {
    // This function needs to be implemented based on the original SimpleTreat4_0 R function
    // For now, returning a dict with f_rem as placeholder
    return { f_rem: 0.5 }; // Placeholder value
}

// Check consumption data availability
function checkConsumptionData(pts, chem, consData) {
    // Filter unique countries where Pt_type is 'WWTP' or 'Agglomerations' and drop NA
    const wwtpPoints = pts.filter(row => 
        (row.Pt_type === 'WWTP' || row.Pt_type === 'Agglomerations') && 
        row.rptMStateK && row.rptMStateK !== 'NA' && row.rptMStateK !== null
    );
    
    const countries = [...new Set(wwtpPoints.map(row => row.rptMStateK))];
    const cons = countries.map(country => ({ country }));
    
    for (let i = 0; i < chem.length; i++) {
        if (cons.length === 0) {
            const basinIds = [...new Set(pts.map(row => row.basin_id))];
            throw new Error(`Prediction not possible due to absence of contaminant source in the domains ${basinIds.join(',')}`);
        } else {
            // Initialize new column named after chem.API[i] with null
            const apiName = chem[i].API;
            
            for (let j = 0; j < cons.length; j++) {
                const country = cons[j].country;
                
                // Check if country is in consData.cnt and if API is a column in consData
                const countryRow = consData.find(row => row.cnt === country);
                if (countryRow && countryRow.hasOwnProperty(apiName)) {
                    cons[j][apiName] = countryRow[apiName];
                } else {
                    cons[j][apiName] = null;
                }
            }
            
            // If any null values in cons (after adding this API column), raise error
            if (cons.some(row => row[apiName] === null)) {
                throw new Error(`Prediction not possible due to insufficient consumption data for ${apiName}`);
            }
        }
    }
    
    return cons;
}

// Complete chemical properties
function completeChemProperties(chem) {
    let chemCopy = JSON.parse(JSON.stringify(chem)); // Deep copy
    
    // Ensure primary/secondary removal columns exist
    chemCopy = checkIfColumnExistsCreateEmpty(chemCopy, "custom_wwtp_primary_removal", null);
    chemCopy = checkIfColumnExistsCreateEmpty(chemCopy, "custom_wwtp_secondary_removal", null);
    
    // Tertiary columns
    const tertiaryCols = [
        "custom_wwtp_N_removal", "custom_wwtp_P_removal", "custom_wwtp_UV_removal",
        "custom_wwtp_Cl_removal", "custom_wwtp_O3_removal", "custom_wwtp_sandfilter_removal",
        "custom_wwtp_microfilter_removal"
    ];
    
    tertiaryCols.forEach(col => {
        chemCopy = checkIfColumnExistsCreateEmpty(chemCopy, col, 0);
    });
    
    // Validate primary/secondary removal logic
    for (let i = 0; i < chemCopy.length; i++) {
        const primary = chemCopy[i].custom_wwtp_primary_removal;
        const secondary = chemCopy[i].custom_wwtp_secondary_removal;
        
        if ((primary === null || primary === undefined) && (secondary === null || secondary === undefined)) {
            console.log(`WWTP primary and secondary removal rates evaluated with SimpleTreat 4.0 for ${chemCopy[i].API}`);
        } else if ((primary !== null && primary !== undefined) && (secondary !== null && secondary !== undefined)) {
            console.log(`Predefined WWTP primary and secondary removal rates used for ${chemCopy[i].API}`);
        } else {
            throw new Error(`Error: Primary or secondary WWTP removal rates are not valid for ${chemCopy[i].API}`);
        }
    }
    
    // Check for missing tertiary removals
    for (let i = 0; i < chemCopy.length; i++) {
        for (const col of tertiaryCols) {
            if (chemCopy[i][col] === null || chemCopy[i][col] === undefined) {
                throw new Error(`Error: One of the tertiary treatment removal is NA for ${chemCopy[i].API}`);
            }
        }
    }
    
    // Convert to numeric
    ['MW', 'pKa', 'KOW_n'].forEach(col => {
        chemCopy.forEach(row => {
            if (row[col] !== undefined) {
                row[col] = toNumeric(row[col]);
            }
        });
    });
    
    // Columns to ensure existence
    const checkCols = [
        "k_bio_wwtp_n", "f_u", "f_f", "f_uf", "k_bio_wwtp_alt",
        "Kp_ps_n", "Kp_as_n", "Kp_ps_alt", "k_bio_wwtp", "Kp_as_alt",
        "KOC_n", "KOC_alt", "k_bio_sw1_n", "k_bio_sw1_alt",
        "T_bio_sw_n", "T_bio_sw_alt", "T_bio_sd_n", "T_bio_sd_alt",
        "k_hydro_sw_n", "k_hydro_sw_alt", "T_hydro_sw_n", "T_hydro_sd_n",
        "T_hydro_sw_alt", "T_hydro_sd_alt", "k_photo12_sw_n",
        "k_photo12_sw_alt", "T_photo12_sw_n", "T_photo12_sw_alt",
        "alpha_n", "lambda_solar_n", "alpha_alt", "lambda_solar_alt",
        "fn_WWTP", "Kp_sd_n", "Kp_sd_alt"
    ];
    
    checkCols.forEach(col => {
        chemCopy = checkIfColumnExistsCreateEmpty(chemCopy, col, null);
    });
    
    return chemCopy;
}

// Set local parameters with custom removal (simplified version)
function setLocalParametersCustomRemovalFast3(pts, HL, cons, chem, chemIi) {
    // Make deep copies to avoid modifying original data
    let ptsCopy = JSON.parse(JSON.stringify(pts));
    let HLCopy = HL && HL.length > 0 ? JSON.parse(JSON.stringify(HL)) : null;
    
    const chemName = chem[chemIi].API;
    
    // Check for 'cnt' or 'country' columns
    let consChem = [];
    if (cons.some(row => row.hasOwnProperty('cnt'))) {
        consChem = cons.map(row => ({
            cnt: row.cnt,
            [chemName]: row[chemName]
        }));
    } else if (cons.some(row => row.hasOwnProperty('country'))) {
        consChem = cons.map(row => ({
            country: row.country,
            [chemName]: row[chemName]
        }));
    }
    
    // Handle metabolite
    if (chem[chemIi].API_metab && chem[chemIi].API_metab !== null && chem[chemIi].API_metab !== undefined) {
        const metabCol = chem[chemIi].API_metab;
        consChem.forEach((row, i) => {
            row.metab = cons[i][metabCol] || 0;
        });
    }
    
    const chemIdx = chemIi; // Using the provided index directly
    
    // Temperature conversion (Celsius to Kelvin)
    ptsCopy.forEach(row => {
        if (row.T_AIR !== null && row.T_AIR !== undefined) {
            row.T_AIR = row.T_AIR + 273.15;
        }
    });
    
    const defaultPH = 7.4;
    
    // Handle pH for pts
    ptsCopy.forEach(row => {
        if (!row.hasOwnProperty('pH') || row.pH === null || row.pH === undefined) {
            row.pH = defaultPH;
        }
    });
    
    // Handle HL DataFrame
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (row.T_AIR !== null && row.T_AIR !== undefined) {
                row.T_AIR = row.T_AIR + 273.15;
            }
            if (!row.hasOwnProperty('pH') || row.pH === null || row.pH === undefined) {
                row.pH = defaultPH;
            }
        });
    }
    
    // Set default parameters for pts
    ptsCopy.forEach(row => {
        row.BACT_sw = 1e+06;
        row.BACT_sed = 1e+05;
        row.T_sw = 285;
        row.f_light = 0.5;
        row.C_susp = 1.5e-05;
        row.C_DOC = 5e-06;
        row.H_sed = 0.03;
        row.v_mw_wsd = 2.778e-06;
        row.v_msd_wsd = 2.778e-08;
        row.poros = 0.8;
        row.rho_sd = 2.33165;
        row.v_set = 2.89e-05;
        row.v_sd_acc = 0;
        row.fOC_susp = 0.1;
        row.fOC_sd = 0.05;
    });
    
    // Set default parameters for HL
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.BACT_sw = 1e+06;
            row.BACT_sed = 1e+05;
            row.T_sw = 285;
            row.f_light = 0.5;
            row.C_OH_w = 1e-18;
            row.C_O2_w = 1e-14;
            row.C_susp = 1.5e-05;
            row.C_DOC = 5e-06;
            row.H_sed = 0.03;
            row.v_mw_wsd = 2.778e-06;
            row.v_msd_wsd = 2.778e-08;
            row.poros = 0.8;
            row.rho_sd = 2.1663;
            row.v_set = 2.89e-05;
            row.v_sd_acc = 0;
            row.fOC_susp = 0.1;
            row.fOC_sd = 0.05;
            
            if (!row.hasOwnProperty('H_av')) {
                row.H_av = row.Depth_avg;
            }
            if (row.Wind === null || row.Wind === undefined) {
                // Calculate mean of non-null Wind values
                const windValues = HLCopy.filter(r => r.Wind !== null && r.Wind !== undefined).map(r => r.Wind);
                const windMean = windValues.length > 0 ? windValues.reduce((a, b) => a + b, 0) / windValues.length : 0;
                row.Wind = windMean;
            }
        });
    }
    
    // Calculate Inh
    ptsCopy.forEach(row => {
        row.uwwLoadEnt = row.uwwLoadEnt || 0;
        row.uwwCapacit = row.uwwCapacit || 0;
        row.Inh = row.uwwLoadEnt;
        if (row.Inh === 0) {
            row.Inh = row.uwwCapacit;
        }
        if (row.Inh === 0 && row.Pt_type === 'WWTP') {
            row.Inh = 10000;
        }
    });
    
    // Create mapping dictionaries for consumption data
    const consDict = {};
    const metabDict = {};
    
    if (consChem.length > 0) {
        consChem.forEach(row => {
            const key = row.country || row.cnt;
            if (key) {
                consDict[key] = row[chemName] || 0;
                if (row.metab !== undefined) {
                    metabDict[key] = row.metab || 0;
                }
            }
        });
    }
    
    // Handle emission calculations
    if (!chem[chemIdx].API_metab || chem[chemIdx].API_metab === null || chem[chemIdx].API_metab === undefined) {
        ptsCopy.forEach(row => {
            const consumptionValue = consDict[row.rptMStateK] || 0;
            if (row.Pt_type === 'WWTP') {
                row.E_in = (consumptionValue * (chem[chemIdx].f_uf || 0)) * (row.f_STP || 0);
            } else {
                row.E_in = null;
            }
        });
    } else {
        const chemZz = chemIdx; // Simplified for now
        ptsCopy.forEach(row => {
            const consumptionValue = consDict[row.rptMStateK] || 0;
            const metabValue = metabDict[row.rptMStateK] || 0;
            if (row.Pt_type === 'WWTP') {
                row.E_in = (consumptionValue * (chem[chemIdx].f_uf || 0) + 
                           metabValue * (chem[chemIdx].metab || 0)) * (row.f_STP || 0);
            } else {
                row.E_in = null;
            }
        });
    }
    
    // Initialize removal efficiency
    ptsCopy.forEach(row => {
        row.f_rem_WWTP = null;
    });
    
    // Check if custom WWTP removal parameters exist
    const useSimpleTreat40 = (chem[chemIdx].custom_wwtp_primary_removal === null || 
                             chem[chemIdx].custom_wwtp_primary_removal === undefined ||
                             chem[chemIdx].custom_wwtp_secondary_removal === null ||
                             chem[chemIdx].custom_wwtp_secondary_removal === undefined);
    
    if (useSimpleTreat40) {
        // Use SimpleTreat4.0 model
        ptsCopy.forEach(row => {
            if (row.Pt_type === 'WWTP') {
                if (row.f_STP === 0) {
                    row.f_rem_WWTP = 0;
                } else {
                    const result = simpleTreat40(
                        chem[chemIdx].class,
                        chem[chemIdx].MW,
                        chem[chemIdx].Pv,
                        chem[chemIdx].S,
                        chem[chemIdx].pKa,
                        chem[chemIdx].Kp_ps_n,
                        chem[chemIdx].Kp_as_n,
                        chem[chemIdx].k_bio_wwtp_n,
                        row.T_AIR,
                        row.Wind,
                        row.Inh,
                        row.E_in / 365,
                        row.uwwPrimary,
                        row.uwwSeconda
                    );
                    row.f_rem_WWTP = result.f_rem;
                }
            }
        });
    } else {
        // Use custom removal parameters
        ptsCopy.forEach(row => {
            if (row.Pt_type === 'WWTP') {
                row.f_rem_WWTP = 0;
                row.f_leftover_WWTP = 1;
                
                // Primary treatment
                if (row.uwwPrimary === -1) {
                    row.f_leftover_WWTP = 1 - (chem[chemIdx].custom_wwtp_primary_removal || 0);
                }
                
                // Secondary treatment
                if (row.uwwSeconda === -1) {
                    row.f_leftover_WWTP = row.f_leftover_WWTP * (1 - (chem[chemIdx].custom_wwtp_secondary_removal || 0));
                }
                
                row.f_rem_WWTP = 1 - row.f_leftover_WWTP;
            }
        });
    }
    
    // Recalculate f_leftover_WWTP
    ptsCopy.forEach(row => {
        if (row.Pt_type === 'WWTP') {
            row.f_leftover_WWTP = 1 - (row.f_rem_WWTP || 0);
        } else {
            row.f_leftover_WWTP = null;
        }
    });
    
    // Ensure additional removal columns exist in chem
    const checkCols = ['custom_wwtp_N_removal', 'custom_wwtp_P_removal', 
                       'custom_wwtp_UV_removal', 'custom_wwtp_Cl_removal', 
                       'custom_wwtp_O3_removal', 'custom_wwtp_sandfilter_removal', 
                       'custom_wwtp_microfilter_removal'];
    
    checkCols.forEach(col => {
        if (!chem[chemIdx].hasOwnProperty(col)) {
            chem[chemIdx][col] = 0;
        }
    });
    
    // Apply additional removal treatments
    ptsCopy.forEach(row => {
        if (row.Pt_type === 'WWTP') {
            if (row.uwwNRemova === -1) {
                row.f_rem_WWTP += chem[chemIdx].custom_wwtp_N_removal || 0;
            }
            
            if (row.uwwPRemova === -1) {
                row.f_leftover_WWTP *= (1 - (chem[chemIdx].custom_wwtp_P_removal || 0));
            }
            
            if (row.uwwUV === -1) {
                row.f_leftover_WWTP *= (1 - (chem[chemIdx].custom_wwtp_UV_removal || 0));
            }
            
            if (row.uwwChlorin === -1) {
                row.f_leftover_WWTP *= (1 - (chem[chemIdx].custom_wwtp_Cl_removal || 0));
            }
            
            if (row.uwwOzonati === -1) {
                row.f_leftover_WWTP *= (1 - (chem[chemIdx].custom_wwtp_O3_removal || 0));
            }
            
            if (row.uwwSandFil === -1) {
                row.f_leftover_WWTP *= (1 - (chem[chemIdx].custom_wwtp_sandfilter_removal || 0));
            }
            
            if (row.uwwMicroFi === -1) {
                row.f_leftover_WWTP *= (1 - (chem[chemIdx].custom_wwtp_microfilter_removal || 0));
            }
            
            // Final removal calculation
            row.f_rem_WWTP = 1 - row.f_leftover_WWTP;
            row.f_rem_WWTP = Math.max(0, Math.min(1, row.f_rem_WWTP)); // Clip between 0 and 1
        }
    });
    
    // Remove temporary column
    ptsCopy.forEach(row => {
        delete row.f_leftover_WWTP;
    });
    
    // Calculate emissions to water
    if (!chem[chemIdx].API_metab || chem[chemIdx].API_metab === null || chem[chemIdx].API_metab === undefined) {
        ptsCopy.forEach(row => {
            const consumptionValue = consDict[row.rptMStateK] || 0;
            
            if (row.Pt_type === 'WWTP') {
                row.E_w = (row.E_in || 0) * (1 - (row.f_rem_WWTP || 0));
            } else if (row.Pt_type === 'Agglomerations') {
                row.E_w = (consumptionValue * (chem[chemIdx].f_uf || 0)) * (row.F_direct || 0);
            } else {
                row.E_w = 0;
            }
        });
    } else {
        ptsCopy.forEach(row => {
            const consumptionValue = consDict[row.rptMStateK] || 0;
            const metabValue = metabDict[row.rptMStateK] || 0;
            
            if (row.Pt_type === 'WWTP') {
                row.E_w = (row.E_in || 0) * (1 - (row.f_rem_WWTP || 0));
            } else if (row.Pt_type === 'Agglomerations') {
                row.E_w = (consumptionValue * (chem[chemIdx].f_uf || 0) + 
                          metabValue * (chem[chemIdx].metab || 0)) * (row.F_direct || 0);
            } else {
                row.E_w = 0;
            }
        });
    }
    
    // Handle HL (HydroLakes) data
    if (HLCopy && HLCopy.length > 0) {
        ptsCopy.forEach(row => {
            row.Hylak_id = row.HL_ID_new || row.Hylak_id;
            delete row.HL_ID_new;
        });
        
        HLCopy.forEach(hlRow => {
            hlRow.E_in = 0;
            const matchingPts = ptsCopy.filter(row => row.Hylak_id === hlRow.Hylak_id);
            hlRow.E_in = matchingPts.reduce((sum, row) => sum + (row.E_w || 0), 0);
        });
    }
    
    // Initialize additional variables
    ptsCopy.forEach(row => {
        row.E_up = 0;
        row.E_w_NXT = 0;
        row.C_w = null;
        row.C_sd = null;
        row.fin = 0;
        row.upcount = row.Freq || 0;
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.C_w = null;
            row.C_sd = null;
            row.fin = 0;
        });
    }
    
    // Calculate fraction of neutral species
    ptsCopy.forEach(row => {
        if (chem[chemIdx].class === 'neutral') {
            row.fn = 1;
        } else if (chem[chemIdx].class === 'acid') {
            row.fn = 1 / (1 + Math.pow(10, (row.pH - (chem[chemIdx].pKa || 0))));
        } else if (chem[chemIdx].class === 'base') {
            row.fn = 1 / (1 + Math.pow(10, ((chem[chemIdx].pKa || 0) - row.pH)));
        } else {
            row.fn = null;
        }
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (chem[chemIdx].class === 'neutral') {
                row.fn = 1;
            } else if (chem[chemIdx].class === 'acid') {
                row.fn = 1 / (1 + Math.pow(10, (row.pH - (chem[chemIdx].pKa || 0))));
            } else if (chem[chemIdx].class === 'base') {
                row.fn = 1 / (1 + Math.pow(10, ((chem[chemIdx].pKa || 0) - row.pH)));
            } else {
                row.fn = null;
            }
        });
    }
    
    // Check and create partition coefficient columns in chem
    const partitionCols = ['Kp_susp_n', 'Kp_susp_alt', 'Kp_DOC_n', 'Kp_DOC_alt', 
                           'Kp_sd_n', 'Kp_sd_alt', 'k_bio_sd1_n', 'k_bio_sd1_alt', 
                           'k_hydro_sd_n', 'k_hydro_sd_alt'];
    
    partitionCols.forEach(col => {
        if (!chem[chemIdx].hasOwnProperty(col)) {
            chem[chemIdx][col] = null;
        }
    });
    
    // Calculate partition coefficients for suspended matter
    ptsCopy.forEach(row => {
        if (chem[chemIdx].Kp_susp_n === null || chem[chemIdx].Kp_susp_n === undefined) {
            row.Kp_susp_n = (chem[chemIdx].KOC_n || 0) * row.fOC_susp;
        } else {
            row.Kp_susp_n = chem[chemIdx].Kp_susp_n;
        }
        
        if (chem[chemIdx].Kp_susp_alt === null || chem[chemIdx].Kp_susp_alt === undefined) {
            row.Kp_susp_alt = (chem[chemIdx].KOC_alt || 0) * row.fOC_susp;
        } else {
            row.Kp_susp_alt = chem[chemIdx].Kp_susp_alt;
        }
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (chem[chemIdx].Kp_susp_n === null || chem[chemIdx].Kp_susp_n === undefined) {
                row.Kp_susp_n = (chem[chemIdx].KOC_n || 0) * row.fOC_susp;
            } else {
                row.Kp_susp_n = chem[chemIdx].Kp_susp_n;
            }
            
            if (chem[chemIdx].Kp_susp_alt === null || chem[chemIdx].Kp_susp_alt === undefined) {
                row.Kp_susp_alt = (chem[chemIdx].KOC_alt || 0) * row.fOC_susp;
            } else {
                row.Kp_susp_alt = chem[chemIdx].Kp_susp_alt;
            }
        });
    }
    
    // Calculate partition coefficients for DOC
    ptsCopy.forEach(row => {
        if (chem[chemIdx].Kp_DOC_n === null || chem[chemIdx].Kp_DOC_n === undefined) {
            row.Kp_DOC_n = 0.08 * (chem[chemIdx].KOW_n || 0);
        } else {
            row.Kp_DOC_n = chem[chemIdx].Kp_DOC_n;
        }
        
        if (chem[chemIdx].Kp_DOC_alt === null || chem[chemIdx].Kp_DOC_alt === undefined) {
            row.Kp_DOC_alt = 0.08 * (chem[chemIdx].KOW_alt || 0);
        } else {
            row.Kp_DOC_alt = chem[chemIdx].Kp_DOC_alt;
        }
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (chem[chemIdx].Kp_DOC_n === null || chem[chemIdx].Kp_DOC_n === undefined) {
                row.Kp_DOC_n = 0.08 * (chem[chemIdx].KOW_n || 0);
            } else {
                row.Kp_DOC_n = chem[chemIdx].Kp_DOC_n;
            }
            
            if (chem[chemIdx].Kp_DOC_alt === null || chem[chemIdx].Kp_DOC_alt === undefined) {
                row.Kp_DOC_alt = 0.08 * (chem[chemIdx].KOW_alt || 0);
            } else {
                row.Kp_DOC_alt = chem[chemIdx].Kp_DOC_alt;
            }
        });
    }
    
    // Calculate partition coefficients for sediment
    ptsCopy.forEach(row => {
        if (chem[chemIdx].Kp_sd_n === null || chem[chemIdx].Kp_sd_n === undefined) {
            row.Kp_sd_n = (chem[chemIdx].KOC_n || 0) * row.fOC_sd;
        } else {
            row.Kp_sd_n = chem[chemIdx].Kp_sd_n;
        }
        
        if (chem[chemIdx].Kp_sd_alt === null || chem[chemIdx].Kp_sd_alt === undefined) {
            row.Kp_sd_alt = (chem[chemIdx].KOC_alt || 0) * row.fOC_sd;
        } else {
            row.Kp_sd_alt = chem[chemIdx].Kp_sd_alt;
        }
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (chem[chemIdx].Kp_sd_n === null || chem[chemIdx].Kp_sd_n === undefined) {
                row.Kp_sd_n = (chem[chemIdx].KOC_n || 0) * row.fOC_sd;
            } else {
                row.Kp_sd_n = chem[chemIdx].Kp_sd_n;
            }
            
            if (chem[chemIdx].Kp_sd_alt === null || chem[chemIdx].Kp_sd_alt === undefined) {
                row.Kp_sd_alt = (chem[chemIdx].KOC_alt || 0) * row.fOC_sd;
            } else {
                row.Kp_sd_alt = chem[chemIdx].Kp_sd_alt;
            }
        });
    }
    
    // Calculate dissolved fractions
    ptsCopy.forEach(row => {
        row.f_diss_n = 1 / (1 + row.Kp_susp_n * row.C_susp + row.Kp_DOC_n * row.C_DOC);
        row.f_diss_alt = 1 / (1 + row.Kp_susp_alt * row.C_susp + row.Kp_DOC_alt * row.C_DOC);
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.f_diss_n = 1 / (1 + row.Kp_susp_n * row.C_susp + row.Kp_DOC_n * row.C_DOC);
            row.f_diss_alt = 1 / (1 + row.Kp_susp_alt * row.C_susp + row.Kp_DOC_alt * row.C_DOC);
        });
    }
    
    // Calculate dissolved fractions in sediment
    ptsCopy.forEach(row => {
        row.f_diss_sed_n = 1 / (1 + row.Kp_sd_n * row.rho_sd * ((1 - row.poros) / row.poros));
        row.f_diss_sed_alt = 1 / (1 + row.Kp_sd_alt * row.rho_sd * ((1 - row.poros) / row.poros));
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.f_diss_sed_n = 1 / (1 + row.Kp_sd_n * row.rho_sd * ((1 - row.poros) / row.poros));
            row.f_diss_sed_alt = 1 / (1 + row.Kp_sd_alt * row.rho_sd * ((1 - row.poros) / row.poros));
        });
    }
    
    // Calculate biodegradation rates in water
    ptsCopy.forEach(row => {
        row.k_bio_w = (row.fn * ((chem[chemIdx].k_bio_sw2_n || 0) * row.BACT_sw * 
                                 row.f_diss_n * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_n || 0))/10))) + 
                       (1 - row.fn) * ((chem[chemIdx].k_bio_sw2_alt || 0) * row.BACT_sw * 
                                       row.f_diss_alt * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_alt || 0))/10))));
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.k_bio_w = (row.fn * ((chem[chemIdx].k_bio_sw2_n || 0) * row.BACT_sw * 
                                     row.f_diss_n * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_n || 0))/10))) + 
                           (1 - row.fn) * ((chem[chemIdx].k_bio_sw2_alt || 0) * row.BACT_sw * 
                                           row.f_diss_alt * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_alt || 0))/10))));
        });
    }
    
    // Calculate biodegradation rates in sediment
    ptsCopy.forEach(row => {
        if (chem[chemIdx].k_bio_sd1_n === null || chem[chemIdx].k_bio_sd1_n === undefined) {
            row.k_bio_sd_n = (chem[chemIdx].k_bio_sw2_n || 0) * row.BACT_sed * row.f_diss_sed_n * 
                              Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_n || 0))/10));
        } else {
            row.k_bio_sd_n = (chem[chemIdx].k_bio_sd1_n || 0) * row.f_diss_sed_n * 
                              Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sd_n || 0))/10));
        }
        
        if (chem[chemIdx].k_bio_sd1_alt === null || chem[chemIdx].k_bio_sd1_alt === undefined) {
            row.k_bio_sd_alt = (chem[chemIdx].k_bio_sw2_alt || 0) * row.BACT_sed * row.f_diss_sed_alt * 
                                Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_alt || 0))/10));
        } else {
            row.k_bio_sd_alt = (chem[chemIdx].k_bio_sd1_alt || 0) * row.f_diss_sed_alt * 
                                Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sd_alt || 0))/10));
        }
        
        row.k_bio_sd = row.fn * row.k_bio_sd_n + (1 - row.fn) * row.k_bio_sd_alt;
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (chem[chemIdx].k_bio_sd1_n === null || chem[chemIdx].k_bio_sd1_n === undefined) {
                row.k_bio_sd_n = (chem[chemIdx].k_bio_sw2_n || 0) * row.BACT_sed * row.f_diss_sed_n * 
                                  Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_n || 0))/10));
            } else {
                row.k_bio_sd_n = (chem[chemIdx].k_bio_sd1_n || 0) * row.f_diss_sed_n * 
                                  Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sd_n || 0))/10));
            }
            
            if (chem[chemIdx].k_bio_sd1_alt === null || chem[chemIdx].k_bio_sd1_alt === undefined) {
                row.k_bio_sd_alt = (chem[chemIdx].k_bio_sw2_alt || 0) * row.BACT_sed * row.f_diss_sed_alt * 
                                    Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sw_alt || 0))/10));
            } else {
                row.k_bio_sd_alt = (chem[chemIdx].k_bio_sd1_alt || 0) * row.f_diss_sed_alt * 
                                    Math.pow(2, ((row.T_sw - (chem[chemIdx].T_bio_sd_alt || 0))/10));
            }
            
            row.k_bio_sd = row.fn * row.k_bio_sd_n + (1 - row.fn) * row.k_bio_sd_alt;
        });
    }
    
    // Calculate hydrolysis rates in water
    ptsCopy.forEach(row => {
        row.k_hydro_w = (row.fn * ((chem[chemIdx].k_hydro_sw_n || 0) * 
                                   Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_n || 0))/10)) * row.f_diss_n) + 
                         (1 - row.fn) * ((chem[chemIdx].k_hydro_sw_alt || 0) * 
                                         Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_alt || 0))/10)) * row.f_diss_alt));
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.k_hydro_w = (row.fn * ((chem[chemIdx].k_hydro_sw_n || 0) * 
                                       Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_n || 0))/10)) * row.f_diss_n) + 
                             (1 - row.fn) * ((chem[chemIdx].k_hydro_sw_alt || 0) * 
                                             Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_alt || 0))/10)) * row.f_diss_alt));
        });
    }
    
    // Calculate hydrolysis rates in sediment
    ptsCopy.forEach(row => {
        if (chem[chemIdx].k_hydro_sd_n === null || chem[chemIdx].k_hydro_sd_n === undefined) {
            row.k_hydro_sd_n = (chem[chemIdx].k_hydro_sw_n || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_n || 0))/10)) * row.f_diss_sed_n;
        } else {
            row.k_hydro_sd_n = (chem[chemIdx].k_hydro_sd_n || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sd_n || 0))/10)) * row.f_diss_sed_n;
        }
        
        if (chem[chemIdx].k_hydro_sd_alt === null || chem[chemIdx].k_hydro_sd_alt === undefined) {
            row.k_hydro_sd_alt = (chem[chemIdx].k_hydro_sw_alt || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_alt || 0))/10)) * row.f_diss_sed_alt;
        } else {
            row.k_hydro_sd_alt = (chem[chemIdx].k_hydro_sd_alt || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sd_alt || 0))/10)) * row.f_diss_sed_alt;
        }
        
        row.k_hydro_sd = row.fn * row.k_hydro_sd_n + (1 - row.fn) * row.k_hydro_sd_alt;
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            if (chem[chemIdx].k_hydro_sd_n === null || chem[chemIdx].k_hydro_sd_n === undefined) {
                row.k_hydro_sd_n = (chem[chemIdx].k_hydro_sw_n || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_n || 0))/10)) * row.f_diss_sed_n;
            } else {
                row.k_hydro_sd_n = (chem[chemIdx].k_hydro_sd_n || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sd_n || 0))/10)) * row.f_diss_sed_n;
            }
            
            if (chem[chemIdx].k_hydro_sd_alt === null || chem[chemIdx].k_hydro_sd_alt === undefined) {
                row.k_hydro_sd_alt = (chem[chemIdx].k_hydro_sw_alt || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sw_alt || 0))/10)) * row.f_diss_sed_alt;
            } else {
                row.k_hydro_sd_alt = (chem[chemIdx].k_hydro_sd_alt || 0) * Math.pow(2, ((row.T_sw - (chem[chemIdx].T_hydro_sd_alt || 0))/10)) * row.f_diss_sed_alt;
            }
            
            row.k_hydro_sd = row.fn * row.k_hydro_sd_n + (1 - row.fn) * row.k_hydro_sd_alt;
        });
    }
    
    // Calculate photolysis rates in water
    ptsCopy.forEach(row => {
        const alphaFactor_n = chem[chemIdx].alpha_n ? 
            ((1 - Math.pow(10, (-1.2 * chem[chemIdx].alpha_n * 100 * (row.H || 1)))) /
             (Math.log(10) * 1.2 * chem[chemIdx].alpha_n * 100 * (row.H || 1))) : 1;
        const alphaFactor_alt = chem[chemIdx].alpha_alt ? 
            ((1 - Math.pow(10, (-1.2 * chem[chemIdx].alpha_alt * 100 * (row.H || 1)))) /
             (Math.log(10) * 1.2 * chem[chemIdx].alpha_alt * 100 * (row.H || 1))) : 1;
             
        row.k_photo_w = (row.fn * ((chem[chemIdx].k_photo12_sw_n || 0) * row.f_diss_n * row.f_light * 
                                   alphaFactor_n * 
                                   Math.pow(2, ((row.T_sw - (chem[chemIdx].T_photo12_sw_n || 0))/10))) + 
                         (1 - row.fn) * ((chem[chemIdx].k_photo12_sw_alt || 0) * row.f_diss_alt * row.f_light * 
                                         alphaFactor_alt * 
                                         Math.pow(2, ((row.T_sw - (chem[chemIdx].T_photo12_sw_alt || 0))/10))));
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            const alphaFactor_n = chem[chemIdx].alpha_n ? 
                ((1 - Math.pow(10, (-1.2 * chem[chemIdx].alpha_n * 100 * row.H_av))) /
                 (Math.log(10) * 1.2 * chem[chemIdx].alpha_n * 100 * row.H_av)) : 1;
            const alphaFactor_alt = chem[chemIdx].alpha_alt ? 
                ((1 - Math.pow(10, (-1.2 * chem[chemIdx].alpha_alt * 100 * row.H_av))) /
                 (Math.log(10) * 1.2 * chem[chemIdx].alpha_alt * 100 * row.H_av)) : 1;
                 
            row.k_photo_w = (row.fn * ((chem[chemIdx].k_photo12_sw_n || 0) * row.f_diss_n * row.f_light * 
                                       alphaFactor_n * 
                                       Math.pow(2, ((row.T_sw - (chem[chemIdx].T_photo12_sw_n || 0))/10))) + 
                             (1 - row.fn) * ((chem[chemIdx].k_photo12_sw_alt || 0) * row.f_diss_alt * row.f_light * 
                                             alphaFactor_alt * 
                                             Math.pow(2, ((row.T_sw - (chem[chemIdx].T_photo12_sw_alt || 0))/10))));
        });
    }
    
    // Calculate adsorption and desorption velocities
    ptsCopy.forEach(row => {
        row.v_ads = (row.fn * (((row.v_mw_wsd * row.v_msd_wsd) / 
                                (row.v_mw_wsd + row.v_msd_wsd)) * row.f_diss_n) + 
                     (1 - row.fn) * (((row.v_mw_wsd * row.v_msd_wsd) / 
                                      (row.v_mw_wsd + row.v_msd_wsd)) * row.f_diss_alt));
                                      
        row.v_des = (((row.v_mw_wsd * row.v_msd_wsd) / (row.v_mw_wsd + row.v_msd_wsd)) * 
                     (1 / (row.poros + (1 - row.poros) * row.rho_sd * 
                           (row.fn * row.Kp_sd_n + (1 - row.fn) * row.Kp_sd_alt))));
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.v_ads = (row.fn * (((row.v_mw_wsd * row.v_msd_wsd) / 
                                    (row.v_mw_wsd + row.v_msd_wsd)) * row.f_diss_n) + 
                         (1 - row.fn) * (((row.v_mw_wsd * row.v_msd_wsd) / 
                                          (row.v_mw_wsd + row.v_msd_wsd)) * row.f_diss_alt));
                                          
            row.v_des = (((row.v_mw_wsd * row.v_msd_wsd) / (row.v_mw_wsd + row.v_msd_wsd)) * 
                         (1 / (row.poros + (1 - row.poros) * row.rho_sd * 
                               (row.fn * row.Kp_sd_n + (1 - row.fn) * row.Kp_sd_alt))));
        });
    }
    
    // Calculate sedimentation velocities
    ptsCopy.forEach(row => {
        const settlingComponent = row.v_set * (row.C_susp / (row.poros + (1 - row.poros) * row.rho_sd));
        row.v_sd_gross = settlingComponent < row.v_sd_acc ? row.v_sd_acc : settlingComponent;
        
        row.v_sed = ((1 - row.poros) * row.rho_sd * 
                     (row.fn * row.Kp_susp_n * row.f_diss_n + 
                      (1 - row.fn) * row.Kp_susp_alt * row.f_diss_alt) * row.v_sd_gross);
                      
        row.v_res = row.v_sd_gross - row.v_sd_acc;
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            const settlingComponent = row.v_set * (row.C_susp / (row.poros + (1 - row.poros) * row.rho_sd));
            row.v_sd_gross = settlingComponent < row.v_sd_acc ? row.v_sd_acc : settlingComponent;
            
            row.v_sed = ((1 - row.poros) * row.rho_sd * 
                         (row.fn * row.Kp_susp_n * row.f_diss_n + 
                          (1 - row.fn) * row.Kp_susp_alt * row.f_diss_alt) * row.v_sd_gross);
                          
            row.v_res = row.v_sd_gross - row.v_sd_acc;
        });
    }
    
    // Calculate transfer rates between water and sediment
    ptsCopy.forEach(row => {
        row.k_ws = (row.v_ads + row.v_sed) / (row.H || 1);
        row.k_sw = (((row.v_ads + row.v_sed) / (row.H || 1)) * 
                    ((row.v_res + row.v_des) / row.H_sed)) / 
                   (((row.v_res + row.v_des + row.v_sd_acc) / row.H_sed) + 
                    row.k_bio_sd + row.k_hydro_sd);
        row.k_sed = row.k_ws - row.k_sw;
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.k_ws = (row.v_ads + row.v_sed) / row.H_av;
            row.k_sw = (((row.v_ads + row.v_sed) / row.H_av) * 
                        ((row.v_res + row.v_des) / row.H_sed)) / 
                       (((row.v_res + row.v_des + row.v_sd_acc) / row.H_sed) + 
                        row.k_bio_sd + row.k_hydro_sd);
            row.k_sed = row.k_ws - row.k_sw;
        });
    }
    
    // Calculate air-water mass transfer velocities
    ptsCopy.forEach(row => {
        row.v_ma_aw = 0.01 * (0.3 + 0.2 * (row.Wind || 0)) * Math.pow((18 / (chem[chemIdx].MW || 1)), (0.67 * 0.5));
        row.v_mw_aw = 0.01 * (4e-04 + 4e-05 * Math.pow((row.Wind || 0), 2)) * Math.pow((32 / (chem[chemIdx].MW || 1)), (0.5 * 0.5));
        
        // Calculate Henry's law constant
        row.Kaw = ((chem[chemIdx].Pv || 0) * (chem[chemIdx].MW || 1)) / 
                  ((chem[chemIdx].S || 1) * 8.314 * row.T_AIR);
                  
        // Calculate volatilization velocities
        row.v_vol = (row.fn * (((row.v_ma_aw * row.v_mw_aw) / 
                                (row.v_ma_aw * row.Kaw + row.v_mw_aw)) * 
                               row.Kaw * row.f_diss_n) + 
                     (1 - row.fn) * (((row.v_ma_aw * row.v_mw_aw) / 
                                      (row.v_ma_aw * row.Kaw + row.v_mw_aw)) * 
                                     row.Kaw * row.f_diss_alt));
                                     
        row.k_vol = row.v_vol / (row.H || 1);
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.v_ma_aw = 0.01 * (0.3 + 0.2 * row.Wind) * Math.pow((18 / (chem[chemIdx].MW || 1)), (0.67 * 0.5));
            row.v_mw_aw = 0.01 * (4e-04 + 4e-05 * Math.pow(row.Wind, 2)) * Math.pow((32 / (chem[chemIdx].MW || 1)), (0.5 * 0.5));
            
            // Calculate Henry's law constant
            row.Kaw = ((chem[chemIdx].Pv || 0) * (chem[chemIdx].MW || 1)) / 
                      ((chem[chemIdx].S || 1) * 8.314 * row.T_AIR);
                      
            // Calculate volatilization velocities
            row.v_vol = (row.fn * (((row.v_ma_aw * row.v_mw_aw) / 
                                    (row.v_ma_aw * row.Kaw + row.v_mw_aw)) * 
                                   row.Kaw * row.f_diss_n) + 
                         (1 - row.fn) * (((row.v_ma_aw * row.v_mw_aw) / 
                                          (row.v_ma_aw * row.Kaw + row.v_mw_aw)) * 
                                         row.Kaw * row.f_diss_alt));
                                         
            row.k_vol = row.v_vol / row.H_av;
        });
    }
    
    // Calculate total elimination rate constants
    ptsCopy.forEach(row => {
        row.k = row.k_bio_w + row.k_photo_w + row.k_hydro_w + row.k_sed + row.k_vol;
    });
    
    if (HLCopy && HLCopy.length > 0) {
        HLCopy.forEach(row => {
            row.k = row.k_bio_w + row.k_photo_w + row.k_hydro_w + row.k_sed + row.k_vol;
        });
    }
    
    // Calculate next segment rate constants
    ptsCopy.forEach(row => {
        row.k_NXT = row.k;
    });
    
    // Create mapping for next basin IDs
    const basinIdMap = {};
    ptsCopy.forEach((row, index) => {
        const basinId = `${row.ID}_${row.basin_id}`;
        basinIdMap[basinId] = index;
    });
    
    ptsCopy.forEach((row, index) => {
        const basinIdNxt = `${row.ID_nxt}_${row.basin_id}`;
        const nextIndex = basinIdMap[basinIdNxt];
        
        if (nextIndex !== undefined && 
            row.ID_nxt !== null && row.ID_nxt !== undefined &&
            row.Down_type !== 'Hydro_Lake' && 
            row.Down_type !== 'JNCT') {
            const kNxtTmp = ptsCopy[nextIndex].k;
            row.k_NXT = (row.k + kNxtTmp) / 2;
        }
    });
    
    return { pts: ptsCopy, hl: HLCopy };
}

// Compute environmental concentrations (simplified version)
// Compute environmental concentrations (JavaScript translation of Python function)
function computeEnvConcentrationsV4Test(pts, HL, verbose = true, Progress_bar, CMD_out_obj) {

    let progressTxtBackup = CMD_out_obj.innerText + " ";

    // Make deep copies to avoid modifying original data
    let ptsCopy = JSON.parse(JSON.stringify(pts));
    let HLCopy = HL && HL.length > 0 ? JSON.parse(JSON.stringify(HL)) : null;
    
    const HLEmpty = !HLCopy || HLCopy.length === 0;
    
    // Extract columns to variables (following Python structure)
    const ptsID = ptsCopy.map(row => row.ID);
    const ptsBasinId = ptsCopy.map(row => row.basin_id);
    const ptsIDNxt = ptsCopy.map(row => row.ID_nxt);
    let ptsFin = ptsCopy.map(row => row.fin || 0);
    let ptsUpcount = ptsCopy.map(row => row.upcount || 0);
    let ptsEw = ptsCopy.map(row => parseFloat(row.E_w) || 0);
    let ptsEup = ptsCopy.map(row => parseFloat(row.E_up) || 0);
    let ptsEwNXT = ptsCopy.map(row => parseFloat(row.E_w_NXT) || 0);
    const ptsQ = ptsCopy.map(row => parseFloat(row.Q) || 1);
    let ptsDistNxt = ptsCopy.map(row => parseFloat(row.dist_nxt) || 0);
    const ptsVNXT = ptsCopy.map(row => parseFloat(row.V_NXT) || 1);
    const ptsKNXT = ptsCopy.map(row => parseFloat(row.k_NXT) || 0);
    let ptsCw = ptsCopy.map(row => parseFloat(row.C_w) || 0);
    let ptsCsd = ptsCopy.map(row => parseFloat(row.C_sd) || 0);
    const ptsKsw = ptsCopy.map(row => parseFloat(row.k_sw) || 0.01);
    const ptsKws = ptsCopy.map(row => parseFloat(row.k_ws) || 0.001);
    const ptsH = ptsCopy.map(row => parseFloat(row.H) || 1);
    const ptsHSed = ptsCopy.map(row => parseFloat(row.H_sed) || 0.1);
    const ptsPoros = ptsCopy.map(row => parseFloat(row.poros) || 0.5);
    const ptsPtType = ptsCopy.map(row => row.Pt_type);
    const ptsX = ptsCopy.map(row => parseFloat(row.x));
    const ptsY = ptsCopy.map(row => parseFloat(row.y));
    const ptsFremWWTP = ptsCopy.map(row => parseFloat(row.f_rem_WWTP) || 0);
    const ptsRhoSd = ptsCopy.map(row => parseFloat(row.rho_sd) || 2.5);
    
    let ptsHylakId, ptsLakeOut;
    if (HLEmpty) {
        ptsHylakId = new Array(ptsID.length).fill(-999);
        ptsLakeOut = new Array(ptsID.length).fill(0);
    } else {
        ptsHylakId = ptsCopy.map(row => parseInt(row.Hylak_id) || -999);
        ptsLakeOut = ptsCopy.map(row => parseInt(row.lake_out) || 0);
    }
    
    // Replace NaN by 0 for dist_nxt
    ptsDistNxt = ptsDistNxt.map(val => isNaN(val) ? 0 : val);
    
    // Handle HL data
    let HLHylakId = [], HLFin = [], HLEin = [], HLVolTotal = [], HLK = [];
    let HLKws = [], HLKsw = [], HLDepthAvg = [], HLHSed = [], HLPoros = [];
    let HLRhoSd = [], HLCw = [], HLCsd = [], HLBasinId = [];
    
    if (!HLEmpty) {
        HLHylakId = HLCopy.map(row => parseInt(row.Hylak_id));
        HLFin = HLCopy.map(row => row.fin || 0);
        HLEin = HLCopy.map(row => parseFloat(row.E_in) || 0);
        HLVolTotal = HLCopy.map(row => parseFloat(row.Vol_total) || 1);
        HLK = HLCopy.map(row => parseFloat(row.k) || 0);
        HLKws = HLCopy.map(row => parseFloat(row.k_ws) || 0.001);
        HLKsw = HLCopy.map(row => parseFloat(row.k_sw) || 0.01);
        HLDepthAvg = HLCopy.map(row => parseFloat(row.Depth_avg) || 1);
        HLHSed = HLCopy.map(row => parseFloat(row.H_sed) || 0.1);
        HLPoros = HLCopy.map(row => parseFloat(row.poros) || 0.5);
        HLRhoSd = HLCopy.map(row => parseFloat(row.rho_sd) || 2.5);
        HLCw = HLCopy.map(row => parseFloat(row.C_w) || 0);
        HLCsd = HLCopy.map(row => parseFloat(row.C_sd) || 0);
        HLBasinId = HLCopy.map(row => row.basin_id);
    }
    
    const breakVec1 = [];
    
    // Create HL indices mapping
    let HLIndicesMatch = new Array(ptsID.length).fill(-999);
    if (!HLEmpty) {
        for (let i = 0; i < ptsID.length; i++) {
            const index = HLHylakId.indexOf(ptsHylakId[i]);
            if (index !== -1) {
                HLIndicesMatch[i] = index;
            }
        }
    }
    
    // Create merged IDs for downstream connections
    const ptsIdMerged = ptsBasinId.map((basin, i) => `${basin}_${ptsID[i]}`);
    const ptsIdNextMerged = ptsBasinId.map((basin, i) => `${basin}_${ptsIDNxt[i]}`);
    let ptsIndicesDown = new Array(ptsID.length).fill(-999);
    
    for (let i = 0; i < ptsID.length; i++) {
        const index = ptsIdMerged.indexOf(ptsIdNextMerged[i]);
        if (index !== -1) {
            ptsIndicesDown[i] = index;
        }
    }

    // console.log("ptsHylakId:",ptsHylakId)
    let npoints = ptsID.length;
    let nhl = HLEmpty ? 0 : HLHylakId.length;
    var progressstartPerc = 40;
    
    // Main calculation loop
    while (ptsFin.some(fin => fin === 0)) {
        if (verbose) {
            new Promise(resolve => setTimeout(resolve, 50));
            let nPtsPrint = ptsFin.filter(fin => fin === 0).length;
            let nHLPrint = HLEmpty ? 0 : HLFin.filter(fin => fin === 0).length;
            nPtsPrint = npoints-nPtsPrint;
            nHLPrint = nhl-nHLPrint;
            console.log("# points in pts:", nPtsPrint);
            console.log("# points in HL:", nHLPrint);
            CMD_out_obj.innerText = progressTxtBackup + `# points in pts: ${nPtsPrint}/${npoints}\n# points in HL: ${nHLPrint}/${nhl}`;
            CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
            let totalItems = npoints + nhl;
            let processedItems = nPtsPrint + nHLPrint;
            let progressPercent = totalItems === 0 ? 100 : (processedItems / totalItems) * 60;
            progressPercent = progressstartPerc+=progressPercent;
            Progress_bar.style.width = progressPercent + "%";
            new Promise(resolve => setTimeout(resolve, 50));
            // RunProgress = progressPercent;
        }
        
        breakVec1.push(ptsFin.filter(fin => fin === 0).length);
        if (breakVec1.length > 10) {
            let lastTen = breakVec1.slice(-10);
            let uniqueValues = [...new Set(lastTen)];
            if (uniqueValues.length === 1) break; // No progress, break infinite loop
        }
        
        // Find points to process (no upstream dependencies)
        let ptsToProcess = [];
        for (let i = 0; i < ptsFin.length; i++) {
            if (ptsFin[i] === 0 && ptsUpcount[i] === 0) {
                ptsToProcess.push(i);
            }
        }
        
        for (let j of ptsToProcess) {
            if (ptsUpcount[j] !== 0) continue;
            
            let HLIndexMatch = HLIndicesMatch[j];
            let ptsIndexDown = ptsIndicesDown[j];
            
            // Case 1: Point is in a lake basin and has lake output
            if (!HLEmpty && HLBasinId.includes(ptsBasinId[j]) && ptsLakeOut[j] === 1) {
                var ETotal = HLEin[HLIndexMatch] + ptsEw[j] + ptsEup[j];
                var V = HLVolTotal[HLIndexMatch] * 1e6;
                var k = HLK[HLIndexMatch];
                ptsCw[j] = (ETotal / (ptsQ[j] + k * V)) * 1e6 / (365 * 24 * 3600);
                
                let chemExchange = HLKws[HLIndexMatch] / HLKsw[HLIndexMatch];
                let HRatio = HLDepthAvg[HLIndexMatch] / HLHSed[HLIndexMatch];
                let densTransform = HLPoros[HLIndexMatch] + (1 - HLPoros[HLIndexMatch]) * HLRhoSd[HLIndexMatch];
                ptsCsd[j] = ptsCw[j] * chemExchange * HRatio * densTransform;
                
                HLCw[HLIndexMatch] = ptsCw[j];
                HLCsd[HLIndexMatch] = ptsCsd[j];
                HLFin[HLIndexMatch] = 1;
                
                ptsEwNXT[j] = ptsCw[j] * ptsQ[j] * 365 * 24 * 3600 / 1e6 * 
                              Math.exp(-ptsKNXT[j] * ptsDistNxt[j] / ptsVNXT[j]);
                
                if (ptsIndexDown !== -999) {
                    ptsEup[ptsIndexDown] += ptsEwNXT[j];
                    ptsUpcount[ptsIndexDown] = Math.max(0, ptsUpcount[ptsIndexDown] - 1);
                }
            }
            // Case 2: Point has no lake ID or has lake output
            else if (ptsHylakId[j] < 0 || ptsLakeOut[j] === 1) {
                var ETotal = ptsEw[j] + ptsEup[j];
                ptsCw[j] = (ETotal / ptsQ[j]) * 1e6 / (365 * 24 * 3600);
                // console.log("ETotal: ",ETotal)
                // console.log("ptsQ[j]: ",ptsQ[j])
                // console.log("ptsCw[j]: ",ptsCw[j])
                
                let chemExchange = ptsKws[j] / ptsKsw[j];
                let HRatio = ptsH[j] / ptsHSed[j];
                let densTransform = ptsPoros[j] + (1 - ptsPoros[j]) * ptsRhoSd[j];
                ptsCsd[j] = ptsCw[j] * chemExchange * HRatio * densTransform;
                
                let ENxt = ETotal * Math.exp(-ptsKNXT[j] * ptsDistNxt[j] / ptsVNXT[j]);
                ptsEwNXT[j] = ENxt;
                
                if (ptsIndexDown !== -999) {
                    ptsEup[ptsIndexDown] += ptsEwNXT[j];
                    ptsUpcount[ptsIndexDown] = Math.max(0, ptsUpcount[ptsIndexDown] - 1);
                }
            }
            // Case 3: Point flows into a lake (no concentration calculated)
            else {
                var ETotal = ptsEw[j] + ptsEup[j];
                ptsCw[j] = 0; // Could be NaN in original, but using 0 for JavaScript
                ptsCsd[j] = 0;
                ptsEwNXT[j] = ETotal;
                
                if (ptsIndexDown !== -999) {
                    ptsEup[ptsIndexDown] += ptsEwNXT[j];
                    ptsUpcount[ptsIndexDown] = Math.max(0, ptsUpcount[ptsIndexDown] - 1);
                }
            }
            
            ptsFin[j] = 1;
        }
    }

    let nPtsPrint = ptsFin.filter(fin => fin === 0).length;
    let nHLPrint = HLEmpty ? 0 : HLFin.filter(fin => fin === 0).length;
    nPtsPrint = npoints-nPtsPrint;
    nHLPrint = nhl-nHLPrint;
    console.log("# points in pts:", nPtsPrint);
    console.log("# points in HL:", nHLPrint);
    CMD_out_obj.innerText = progressTxtBackup + `# points in pts: ${nPtsPrint}/${npoints}\n# points in HL: ${nHLPrint}/${nhl}`;
    //Progress_bar.style.transition = 'width 0.1s ease-in-out';
    if (Progress_bar!=undefined && Progress_bar!=null) Progress_bar.style.width = "100%";
    CMD_out_obj.scrollTop = CMD_out_obj.scrollHeight;
    // CMD_out_obj.innerText += "\nDone!\n";
    
    // Prepare results
    const resultPts = ptsID.map((id, i) => ({
        ID: id,
        Pt_type: ptsPtType[i],
        ID_nxt: ptsIDNxt[i],
        basin_ID: ptsBasinId[i],
        HylakId: ptsHylakId[i],
        x: ptsX[i],
        y: ptsY[i],
        Q: ptsQ[i],
        Ew: ptsEw[i],
        C_w: ptsCw[i],
        C_sd: ptsCsd[i],
        WWTPremoval: ptsFremWWTP[i]
    }));
    
    if (!HLEmpty) {
        const resultHL = HLHylakId.map((id, i) => ({
            Hylak_id: id,
            C_w: HLCw[i],
            C_sd: HLCsd[i]
        }));
        return { pts: resultPts, HL: resultHL };
    } else {
        return { pts: resultPts };
    }
}

module.exports = {
    parseBasinVector,
    toNumeric,
    checkIfColumnExistsCreateEmpty,
    simpleTreat40,
    checkConsumptionData,
    completeChemProperties,
    setLocalParametersCustomRemovalFast3,
    computeEnvConcentrationsV4Test
};
