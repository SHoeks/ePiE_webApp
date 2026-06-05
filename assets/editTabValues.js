function editTabValues() {
    
  var fields = document.querySelectorAll("table input[type='text']");
  for (var i = 0; i < fields.length; i++) {
    if(fields[i].classList.contains("noteditable")) continue;
    fields[i].readOnly = false;
    fields[i].style.border = "1px solid #000";
  }

  document.getElementById("save").style.display = "inline-block";
  document.getElementById("save2").style.display = "inline-block";
  document.getElementById("save3").style.display = "inline-block";
  document.getElementById("save4").style.display = "inline-block";
  document.getElementById("save5").style.display = "inline-block";

  // hide scroll arrows if present
  var rightArrow = document.getElementById('scrollable_right_arrow');
  var leftArrow = document.getElementById('scrollable_left_arrow');
  rightArrow.style.display = 'none';
  leftArrow.style.display = 'none';

}