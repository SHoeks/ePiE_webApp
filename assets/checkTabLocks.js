export default function checkTabLocks(lockedTabs) {

    console.log("checkTabLocks")
    console.log(lockedTabs)
    console.log(lockedTabs[0])
    var tabnames = Object.keys(lockedTabs);

    for (var i = 0; i < tabnames.length; i++) {
        if(lockedTabs[tabnames[i]]) {
            let tablinkid = "tablink_" + tabnames[i];
            let tablinkobj = document.getElementById(tablinkid);
            console.log(tablinkobj.className);
            if(!tablinkobj.className.includes("active")){
                tablinkobj.className += " locked";
            }
        }
    }


}