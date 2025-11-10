function loadExcelData(){

  const uploadBtn = document.getElementById('uploadChemExcel');
  const output = document.getElementById('chemDataFull');
  const rowSelector = document.getElementById('rowExcelSelector');

  // Create a hidden file input
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'file';
  hiddenInput.accept = '.xlsx';
  hiddenInput.click();


  // placeholder for excel data
  let excelData = [];

  // When a file is chosen, read it
  hiddenInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Take the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to JSON object
      excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // remove all values in the excelData that contain __EMPTY
      excelData = excelData.map(row => {
        const newRow = {};
        for (const key in row) {
          if (!key.startsWith('__EMPTY')) {
            newRow[key] = row[key];
          }
        }
        return newRow;
      });

      // // convert NA to undifined
      // excelData = excelData.map(row => {
      //   const newRow = {};
      //   for (const key in row) {
      //     if (row[key] === "NA") {
      //       newRow[key] = undefined;
      //     } else {
      //       newRow[key] = row[key];
      //     }
      //   }
      //   return newRow;
      // });
      
      if (excelData.length === 0) {
        alert("The Excel file is empty!");
        return;
      }

      // Populate dropdown
      const firstColumnValues = excelData.map(row => row["API"]);
      rowSelector.innerHTML = '<option value="">-- Select --</option>';
      firstColumnValues.forEach((val, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = val || `(Row ${i + 1})`;
        rowSelector.appendChild(option);
      });

      selectorContainer.style.display = 'block';
      output.textContent = '';

      // See the JSON data in console
      console.log("Excel data:", excelData);
    };

    reader.readAsArrayBuffer(file);

    // Reset input so the same file can be selected again if needed
    hiddenInput.value = '';
  });

  // Handle selection change
  rowSelector.addEventListener('change', () => {
    const index = rowSelector.value;
    if (index === "") {
      output.textContent = "";
      return;
    }

    const selectedRow = excelData[index];
    setChemProperties(selectedRow);
    
  });

  console.log("Excel data:", excelData);

}
