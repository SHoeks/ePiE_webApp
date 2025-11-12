function getNrows(){
  for (var r = 1; r < 100; r++){
    if(document.getElementById("name_row" + r)==null){
      break
    }
  }
  r--;
  return r;
}

function copyOverAPI_ID(){
  
  let r = getNrows();
  let API_ids = [];
  for (let i = 1; i <= r; i++) API_ids.push(document.getElementById("name_row" + i).value);
  console.log("API_ids: ", API_ids);
  
  for (let i = 1; i <= r; i++) {
    // copy API_IDs on API properties tab
    document.getElementById("API_ID_tab2_row" + i).value = API_ids[i-1];
    document.getElementById("API_ID_tab2_row" + i).setAttribute('value',API_ids[i-1]);
    document.getElementById("API_ID_tab2alt_row" + i).value = API_ids[i-1];
    document.getElementById("API_ID_tab2alt_row" + i).setAttribute('value',API_ids[i-1]);

    // copy to WWTP removal tab
    document.querySelector("#API_table_degradation #API_ID_tab2_row" + i).value = API_ids[i-1];
    document.querySelector("#API_table_degradation #API_ID_tab2_row" + i).setAttribute('value',API_ids[i-1]);
    document.querySelector("#API_table_degradation2 #degr_col" + i).value = API_ids[i-1];
    document.querySelector("#API_table_degradation2 #degr_col" + i).setAttribute('value',API_ids[i-1]);

    // copy to API consumption tab
    if(document.querySelector("#cPerCapitaAPIid_row" + i)!=null){
      document.querySelector("#cPerCapitaAPIid_row" + i).value = API_ids[i-1];
      document.querySelector("#cPerCapitaAPIid_row" + i).setAttribute('value',API_ids[i-1]);
      
      let innertxt = " <span class=\"firstSpan\">"+API_ids[i-1]+"<br><p>(kg/year)</p><span class=\"secondSpan\"> Total yearly consumption in kg </span></span> "
      document.querySelector("#API_table_consumption > tbody > tr:nth-child(1) > th:nth-child("+(3+i)+")").innerHTML = innertxt;
    }
    
  }

}


