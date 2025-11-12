function getFlowSelection(){
    
    let val = document.querySelector("#flow").value;
    console.log(val);
    
    let elem = document.querySelector("#prnt_slct_flow");
    elem.innerText = "";
    
    if(val == "Average"){
    elem.innerText = `Average`;
    }else if(val == "Min"){
    elem.innerText = `Minimum`;
    }else if(val == "Max"){
    elem.innerText = `Maximum`;
    }else{
    elem.innerText = `Average`;
    }

    // write to settings tab
    var outdat = {"flow_condition": val};
    const output = document.getElementById('selectedFlowDataFull');
    output.textContent = JSON.stringify(outdat, null, 2);

}