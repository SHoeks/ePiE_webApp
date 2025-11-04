
function openTabWrapper(evt, tabName) {

  // check if tab is locked
  console.log("locked: " + tabName + " = " + lockedTabs[tabName]);

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



