saveStatsToExcel = function() {
    
    console.log("saveStatsToExcel");

    // check if the model has been run
    if(epie_results === null || epie_results.length === 0){
        alert("No results to save! Please run the model first.");
        return;
    }

    // run the CalculateBasinStatistics + CalculateRiskStatistics functions to ensure stats are up to date
    if(document.querySelector("#API_table_basinStats").innerHTML === "" || document.querySelector("#API_table_basinStats").innerHTML === '<tbody></tbody>'){
        console.log("Calculating basin statistics before saving to Excel...");
        CalculateBasinStatistics();
    }
    if(document.querySelector("#API_table_RiskStats").innerHTML === "" || document.querySelector("#API_table_RiskStats").innerHTML === '<tbody></tbody>'){
        console.log("Calculating risk statistics before saving to Excel...");
        CalculateRiskStatistics();
    }

    // Get the table element
    var basinStats = document.getElementById("API_table_basinStats");
    
    // get all th within basinStats table
    var header = basinStats.querySelectorAll("th");
    var headers = [];
    header.forEach(function(th) {
        let tmp = th.innerText.replace(/\n/g, " ");
        tmp = tmp.trim(); // remove trailing spaces
        headers.push(tmp);
    });

    // get all tr within basinStats table
    var rows = basinStats.querySelectorAll("tr");
    var table = [];
    rows.forEach(function(tr, index) {
        // skip the header row
        if(index === 0) return;
        var cells = tr.querySelectorAll("input");
        var rowData = {};
        cells.forEach(function(td, cellIndex) {
            rowData[headers[cellIndex]] = td.value;
        });
        table.push(rowData);
    });

    // Get the table element
    var riskStats = document.getElementById("API_table_RiskStats");

    // risks header
    var riskHeader = riskStats.querySelectorAll("th");
    var riskHeaders = [];
    riskHeader.forEach(function(th) {
        let tmp = th.innerText.replace(/\n/g, " ");
        tmp = tmp.trim(); // remove trailing spaces
        riskHeaders.push(tmp);
    });

    // get all tr within riskStats table
    var pnec_value = document.querySelector("#riskval").value;
    console.log("pnec_value: " + pnec_value);
    var riskRows = riskStats.querySelectorAll("tr");
    var riskTable = [];
    riskRows.forEach(function(tr, index) {
        // skip the header row
        if(index === 0) return;
        var cells = tr.querySelectorAll("input");
        var rowData = {};
        cells.forEach(function(td, cellIndex) {
            let tmp = td.value.replace("%", "");
            rowData[riskHeaders[cellIndex]] = tmp;
        });
        rowData["Risk threshold (ng/L)"] = pnec_value;
        riskTable.push(rowData);
    });

    // Create a new workbook
    var wb = XLSX.utils.book_new();

    // Convert the basin statistics table to a worksheet
    var basinWs = XLSX.utils.json_to_sheet(table);

    // Append the basin worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, basinWs, "Basin Statistics");

    // Convert the risk statistics table to a worksheet
    var riskWs = XLSX.utils.json_to_sheet(riskTable);

    // Append the risk worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, riskWs, "Risk Statistics");
    
    // Generate Excel file and trigger download
    var file_name = "ePiE_output_stats_" + new Date().toISOString().slice(0,10) + "_" + new Date().toISOString().slice(11,19).replace(/:/g, "") + ".xlsx";
    XLSX.writeFile(wb, file_name);

}