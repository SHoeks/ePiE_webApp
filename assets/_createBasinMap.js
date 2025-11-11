function createBasinMapWrapper(){
  createBasinMap(selected_basins,selected_basins_names);
}

function createBasinMap(selected_basins,selected_basins_names){

    console.log("createBasinMap")
    // var L = require('leaflet');
    var hooveringBasinDiv = document.getElementById('hooveringBasinDiv');
    hooveringBasinDiv.style.opacity = 0.0;

    // destroy map if it exists
    let elem = document.getElementById("mapBasin");
    if(elem != null) {
      var map_tmp = L.DomUtil.get('mapBasin')
      if (map_tmp.classList.contains("leaflet-container")) {
        console.log('destroy previous map');
        map_tmp.remove();
        map_tmp = null;
        document.getElementById('mapBasinholder').innerHTML = '<div id="mapBasin"></div>';
      }
    }

    var map = L.map('mapBasin').setView([50, 8], 6);

    var myRenderer = L.canvas({ padding: 0.5 });

    // //L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',{maxZoom:10}).addTo(map);
    // if(isDevelopment){
    //   L.tileLayer(appRootDir+'/resources/tiles/{z}/{x}/{y}.png',{maxZoom:8, minZoom: 4,opacity: 0.5}).addTo(map);
    // }else{
    //   L.tileLayer(appRootDir+'/tiles/{z}/{x}/{y}.png',{maxZoom:8, minZoom: 4,opacity: 0.5}).addTo(map);
    // }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    // var rawdata = fs.readFileSync('resources/basin_geo/Basin.geojson');
    var basinBorders= BasinSHP;
    console.log(basinBorders.features.length);

    var geoJson = new L.geoJSON(basinBorders, {
      pointToLayer: (feature) => {
        let elem = 0;
        if(length(feature.geometry.coordinates)!=2) {
          elem = L.polygon([0, 0],{renderer: myRenderer});
        }
        return new elem;
      },
      onEachFeature: function (feature, layer) {
          // layer.bindPopup('<p> BASIN_ID: '+ feature.properties.BASIN_ID + '</p>' + '<p> BASIN_NAME: '+ feature.properties.name + '</p>');
          // layer._leaflet_id = feature.properties.BASIN_ID;
          let basin_id = feature.properties.BASIN_ID;
          if( selected_basins.includes(basin_id) ) {
            layer.setStyle({color: 'red', zIndex: 50, opacity: basin_id});
          }

          layer.on('mouseover',function() {
            // layer.openPopup();
            hooveringBasinDiv.style.opacity = 1.0;
            hooveringBasinDiv.innerHTML = '<div id="basinhoveridbox">' + feature.properties.BASIN_ID + ':' + feature.properties.name +  '</div>' ;
          });
          
          layer.on('mouseout',function() {
            hooveringBasinDiv.innerHTML = '<div id="basinhoveridbox">' + "None" + '</div>';
            // hooveringBasinDiv.style.opacity = 0.0;
            // console.log('mouseout');
          });
          
          layer.on('click', function () {

            console.log("leaflet_id:"+ layer._leaflet_id);
            
            let basin_id = feature.properties.BASIN_ID;
            let basin_name = feature.properties.name;
              
              if( selected_basins.includes(basin_id) ) {
                let index = selected_basins.indexOf(basin_id);
                if(index > -1) {
                  selected_basins.splice(index, 1)
                  selected_basins_names.splice(index, 1);
                }
                console.log('basin #' + basin_id + ' deselected');
                layer.setStyle({color: 'rgb(51, 136, 255)', zIndex: -1});
                //layer.setStyle({color: 'rgb(151, 136, 255)', zIndex: 25});
              }else{
                console.log('basin #' + basin_id + ' selected');
                layer.remove();layer.addTo(map); // readd to avoid overlapping in plotting
                layer.setStyle({color: 'red', zIndex: 25, opacity: basin_id});
                selected_basins.push(basin_id);
                selected_basins_names.push(basin_name);
              }       
              console.log('Selected_basins: ' + selected_basins);
              console.log('selected_basins_names: ' + selected_basins_names);
              setBasinSelectSettings(selected_basins,selected_basins_names);
              // let selected_basins_str = selected_basins.join(', ');
              // document.getElementById('selected_basins_p').innerText = 'Selected basins IDs ' + selected_basins_str;
              let list = document.getElementById('selected_basins_list');
              while (list.firstChild) list.removeChild(list.firstChild);

              selected_basins.forEach(x => {
                let x_index = selected_basins.indexOf(x);
                let x_name = selected_basins_names[x_index];
                let node = document.createElement("li");
                node.style.display = "inline-block;"
                let textnode = document.createTextNode(x + ':' + x_name);
                node.appendChild(textnode);
                node.onclick = function(self) {
                  let id = self.target.innerText;
                  id = id.split(':')[0]; // get only the basin id
                  console.log("removing: " + id);
                  let index = selected_basins.indexOf((id));
                  console.log('index: ' + index);
                  if(index > -1) selected_basins.splice(index, 1)
                  if(index > -1) selected_basins_names.splice(index, 1)
          
                  let polylayers = document.querySelectorAll('#mapBasin > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g > path');

                  polylayers.forEach(layerIt => {
                    if(layerIt.getAttribute('stroke-opacity') === id){
                      console.log('removing layer');
                      layerIt.setAttribute('stroke', 'rgb(51, 136, 255)');
                      layerIt.setAttribute('fill', 'rgb(51, 136, 255)');
                      layerIt.setAttribute('stroke-opacity', '1');

                      //console.log(layerIt);
                    }
                  });

                  list.removeChild(node);
                  console.log('Selected_basins: ' + selected_basins);
                  console.log('selected_basins_names: ' + selected_basins_names);
                  selected_basins
                  setBasinSelectSettings(selected_basins,selected_basins_names);
   
                };
                list.appendChild(node);
              });



            
          });
      }
    })


    geoJson.addTo(map);
          
}

function setBasinSelectSettings(selected_basins,selected_basins_names){

  var htmlbasinselectdata = document.getElementById('selectedBasinsDataFull'); 
  var basin_js_obj = {selected_basins: selected_basins, selected_basins_names: selected_basins_names};
  htmlbasinselectdata.textContent = JSON.stringify(basin_js_obj, null, 2);

}



