function exportFullOutputExcelWrapper() {
  
    if(epie_results==undefined || Object.keys(epie_results).length === 0 || epie_results == null) {
      alert("No results to export");
      return;
    }

    // remove lakes
    epie_results_noLakes = epie_results.filter(x => x.Pt_type != "Hydro_Lake");

    // sort by C_w descending
    epie_results_noLakes.sort((a, b) => b.C_w - a.C_w);

    // remove unnecessary fields: Color and HylakId
    epie_results_noLakes = epie_results_noLakes.map(({Color, HylakId, ...rest}) => rest);

    // remove field C_sd
    epie_results_noLakes = epie_results_noLakes.map(({C_sd, ...rest}) => rest);

    // remove field Ew
    epie_results_noLakes = epie_results_noLakes.map(({Ew, ...rest}) => rest);

    // rename fields for better readability, C_w to Concentration_water_ugL
    epie_results_noLakes = epie_results_noLakes.map(({C_w, ...rest}) => ({...rest, Concentration_water_ugL: C_w}));

    // rename Q to Discharge_m3d
    epie_results_noLakes = epie_results_noLakes.map(({Q, ...rest}) => ({...rest, Discharge_m3d: Q}));

    // create a new workbook and worksheet
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(epie_results_noLakes);

    // add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "ePiE_results");

    // export the workbook as an Excel file
    var file_name = "ePiE_output_full_" + new Date().toISOString().slice(0,10) + "_" + new Date().toISOString().slice(11,19).replace(/:/g, "") + ".xlsx";
    XLSX.writeFile(wb, file_name);

}