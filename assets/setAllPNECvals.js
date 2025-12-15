setAllPNECvals = function(idset=0) {

    // Get all elements with the class name "riskvalclass"
    const elems = document.getElementsByClassName("riskvalclass");
    
    // Get the risk value from the input field
    var riskValue = parseFloat(elems[idset].value);

    // round to 2 decimal places
    riskValue = Math.round(riskValue * 100) / 100;
    
    // Check if the input is a valid number
    if (isNaN(riskValue) || riskValue <= 0) {
        alert("Please enter a valid positive number for the risk threshold value.");
        return;
    }
    
    // Set the PNEC value for all APIs in the API_list
    for (var i = 0; i < elems.length; i++) {
        elems[i].value = riskValue;
    }
    
    console.log("All PNEC values set to: " + riskValue);
};