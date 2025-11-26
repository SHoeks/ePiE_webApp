getAllSettings = function() {
    
    // gather all settings
    var set_basinsIDS = document.getElementById('selectedBasinsDataFull').textContent;
    var set_APIProperties = document.getElementById('chemDataFull').textContent;
    var set_wwtpRemovalData = document.getElementById('wwtpRemovalDataFull').textContent;
    var set_consumptionData = document.getElementById('consumptionDataFull').textContent;
    var set_flowSelection = document.getElementById('selectedFlowDataFull').textContent;

    // check basins selected
    if(set_basinsIDS === "{Undefined}"){
        console.log('getAllSettings, no basins selected.');
        alert("No basins selected, please select the basins of interest to proceed.");
        return; // No basins selected or error occurred
    }

    // check chem data
    if(set_APIProperties === "{Undefined}"){
        console.log('getAllSettings, no chemical data provided.');
        alert("No chemical data provided, please set the chemical data to proceed.");
        return; // No basins selected or error occurred
    }

    // check wwtp data
    if(set_wwtpRemovalData === "{Undefined}"){
        console.log('getAllSettings, no wwtp data provided.');
        alert("No WWTP removal data provided, please set the WWTP removal data to proceed.");
        return; // No basins selected or error occurred
    }
    
    // no consumption data check
    if(set_consumptionData === "{Undefined}"){
        console.log('getAllSettings, no consumption data provided.');
        alert("No consumption data provided, please set the consumption data to proceed.");
        return; // No basins selected or error occurred
    }
    
    // no consumption data check
    if(set_flowSelection === "{Undefined}"){
        console.log('getAllSettings, no flow selection provided.');
        alert("No flow selection provided, please set the flow selection to proceed.");
        return; // No basins selected or error occurred
    }

    // convert settings data
    set_basinsIDS = JSON.parse(set_basinsIDS);
    set_APIProperties = JSON.parse(set_APIProperties);
    set_wwtpRemovalData = JSON.parse(set_wwtpRemovalData);
    set_consumptionData = JSON.parse(set_consumptionData);
    set_flowSelection = JSON.parse(set_flowSelection);
    const settings = {
        basinIDs: set_basinsIDS,
        apiProperties: set_APIProperties,
        wwtpRemovalData: set_wwtpRemovalData,
        consumptionData: set_consumptionData,
        flowSelection: set_flowSelection
    };
    return settings;
}

downloadSettings = function() {

    // get settings
    const settings = getAllSettings();
    if(!settings){return;} // error occurred

    // create and trigger download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const file_name = "ePiE_settings_" + new Date().toISOString().slice(0,10) + "_" + new Date().toISOString().slice(11,19).replace(/:/g, "") + ".json";
    downloadAnchorNode.setAttribute("download", file_name);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
}

setSettingsFromFile = function() {

    // ask the user to upload a file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';

    fileInput.onchange = e => { 
        const file = e.target.files[0]; 
        const reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = readerEvent => {
            const content = readerEvent.target.result; // this is the content!
            try {
                const settings = JSON.parse(content);
                // set settings
                setChemProperties({...settings.apiProperties, ...settings.wwtpRemovalData}, true, false);
                document.getElementById('selectedBasinsDataFull').textContent = JSON.stringify(settings.basinIDs, null, 2);
                document.getElementById('consumptionDataFull').textContent = JSON.stringify(settings.consumptionData, null, 2);
                document.getElementById('selectedFlowDataFull').textContent = JSON.stringify(settings.flowSelection, null, 2);
                alert("Settings successfully loaded from file.");
                
                // set selected basins
                selected_basins = settings.basinIDs.selected_basins;
                selected_basins_names = settings.basinIDs.selected_basins_names;

                // update WWTP removal data in UI
                let pf = settings.wwtpRemovalData.custom_wwtp_primary_removal;
                let sf = settings.wwtpRemovalData.custom_wwtp_secondary_removal;
                let div1 = document.getElementById("primaryFrac_row1");
                let div2 = document.getElementById("secondaryFrac_row1");
                div1.value = pf;
                div2.value = sf;
                div1.setAttribute('value',pf); 
                div2.setAttribute('value',sf); 
                div1.style.color = "#000000ff";
                div2.style.color = "#000000ff";

            } catch (error) {
                console.error("Error parsing settings file: ", error);
                alert("Error loading settings from file. Please ensure the file is a valid ePiE settings file.");
            }
        }
    }

    fileInput.click();
}


setExampleSettings = function() {
    // set example chemical data
    fetch('example_settings.json')
    .then(response => response.json())
    .then(data => {
        console.log("Example settings loaded: ", data);
        // set settings
        setChemProperties({...data.apiProperties, ...data.wwtpRemovalData}, true, false);
        document.getElementById('selectedBasinsDataFull').textContent = JSON.stringify(data.basinIDs, null, 2);
        document.getElementById('consumptionDataFull').textContent = JSON.stringify(data.consumptionData, null, 2);
        document.getElementById('selectedFlowDataFull').textContent = JSON.stringify(data.flowSelection, null, 2);
        // alert("Example settings successfully loaded.");
        
        // set selected basins
        selected_basins = data.basinIDs.selected_basins;
        selected_basins_names = data.basinIDs.selected_basins_names;

        // update WWTP removal data in UI
        let pf = data.wwtpRemovalData.custom_wwtp_primary_removal;
        let sf = data.wwtpRemovalData.custom_wwtp_secondary_removal;
        let div1 = document.getElementById("primaryFrac_row1");
        let div2 = document.getElementById("secondaryFrac_row1");
        div1.value = pf;
        div2.value = sf;
        div1.setAttribute('value',pf); 
        div2.setAttribute('value',sf); 
        div1.style.color = "#000000ff";
        div2.style.color = "#000000ff";

    })
    .catch(error => {
        console.error("Error loading example settings: ", error);
        alert("Error loading example settings.");
    });



}