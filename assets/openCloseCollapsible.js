function OpenCloseCollapsible(id_use) {

    var content = document.getElementById(id_use);
    if (content.style.display === "block") {
    content.style.display = "none";
    } else {
    content.style.display = "block";
    }

}