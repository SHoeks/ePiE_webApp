
function openTabWrapper(evt, tabName) {

  if(tabName=="API_properties") {
    console.log("check scroll buttons for API table")
    checkTableScrollButtons('API_table', 'API_table_form');
  }

  // check if tab is locked
  console.log("locked: " + tabName + " = " + lockedTabs[tabName]);
  
  var titleObj = document.querySelector("body > div.main > div.page-title");

  titleObj.innerHTML = "";
  if(tabName=="Welcome_screen") titleObj.innerHTML = "Welcome";
  if(tabName=="API_properties") titleObj.innerHTML = "API Properties";
  if(tabName=="Degradation") titleObj.innerHTML = "WWTP removal";
  if(tabName=="Basin_select") titleObj.innerHTML = "River Basin";
  if(tabName=="Consumption") titleObj.innerHTML = "Consumption data";
  if(tabName=="Run_process") titleObj.innerHTML = "Run ePiE";
  if(tabName=="Map_results") titleObj.innerHTML = "Map Results";
  if(tabName=="Basin_result_stats") titleObj.innerHTML = "Output statistics";
  if(tabName=="PNEC_Map_results") titleObj.innerHTML = "Map risks";
  if(tabName=="full_settings") titleObj.innerHTML = "View Settings";
  if(tabName=="Risk_result_stats") titleObj.innerHTML = "Risk statistics";

  // open tab if it is not locked
  if (!lockedTabs[tabName]) {
    openTab(evt, tabName);

    // create the basin map if the basin tab is opened
    console.log("basinMapCreated: " + basinMapCreated);
    if (tabName == 'Basin_select') {
      createBasinMap(selected_basins, selected_basins_names);
      basinMapCreated = true;
    }
    // if(tabName == 'Basin_select' && !basinMapCreated){
    //   createBasinMap(selected_basins,selected_basins_names);
    //   basinMapCreated = true;
    // }
  }

  // check if in edit mode
  let c1 = document.querySelector("#save").style.display != "none";
  let c2 = document.querySelector("#save2").style.display != "none";
  let c3 = document.querySelector("#save3").style.display != "none";
  let c4 = document.querySelector("#save4").style.display != "none";
  if (c1 | c2 | c3 | c4) {
    saveTabValues();
  }

}

function openTab(evt, tabName) {
  
  console.log(evt)
  console.log(tabName)
  console.log(evt.currentTarget)

  
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
  
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");
  
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  if(tabName=="API_properties") copyOverAPI_ID();
  
}

function openWelcomeTab(tabName, tabn) {

    var titleObj = document.querySelector("body > div.main > div.page-title");
    titleObj.innerHTML = "Welcome";
    console.log("openWelcomeTab called")
  
    console.log(tabName)
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
    
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");
    
    document.getElementById(tabName).style.display = "block";
    tablinks[tabn].className += " active"; 
    console.log(tablinks[tabn].className)
   
}



