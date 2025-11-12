import saveTabValues from './saveTabValues.js';

export default function  removeLastAPItableRow(){

    saveTabValues();
    let n_rows_current = document.querySelector("#API_table > tbody:nth-child(1)").rows.length;
    if(n_rows_current>2){
      let tableobj = document.querySelector("#API_table > tbody");
      tableobj.removeChild(tableobj.lastChild);
      let tableobj2 = document.querySelector("#API_table2 > tbody");
      tableobj2.removeChild(tableobj2.lastChild);
    }

  }