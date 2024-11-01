!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("loadClientHomepage",[],t):"object"==typeof exports?exports.loadClientHomepage=t():e.loadClientHomepage=t()}(this,(()=>(()=>{"use strict";const e=localStorage.getItem("authToken"),t=new URLSearchParams(window.location.search).get("client-id"),n=new class{constructor(){this.activeTool=null,this.deleteMode=null,this.editMode=!1,this.disableActiveTool=this.disableActiveTool.bind(this),this.drawElement=this.drawElement.bind(this),this.deleteElement=this.deleteElement.bind(this)}loadMap(){window.map=L.map("map",{zoomControl:!1}).setView([37.8,-96],4),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(window.map),window.drawnItems=new L.FeatureGroup,window.nonEditableItems=L.featureGroup().addTo(window.map),window.map.addLayer(window.drawnItems);const e=new L.Control.Draw({edit:!1,draw:{polygon:!1,rectangle:!1,circle:!1,marker:!1,polyline:!1,circlemarker:!1}});window.map.addControl(e)}disableActiveTool(){this.activeTool&&(this.activeTool.disable(),this.activeTool=null),this.deleteMode&&(this.deleteMode.disable(),this.deleteMode=null),this.editMode&&(window.drawnItems.eachLayer((function(e){e.editing&&e.editing.disable()})),this.editMode=!1),document.querySelector(".town-radius__dropdown").classList.add("hidden")}loadGeojson(e){L.geoJSON(e,{onEachFeature:function(e,t){e.properties&&!1===e.properties.editable?(window.nonEditableItems.addLayer(t),updateButtonState()):(window.drawnItems.addLayer(t),updateButtonState())}}).addTo(window.map)}deleteElement(){this.disableActiveTool(),this.deleteMode=new L.EditToolbar.Delete(window.map,{featureGroup:window.drawnItems}),this.deleteMode.enable(),window.drawnItems.eachLayer((function(e){e.on("click",(function(){removeLayer(e)}))})),window.nonEditableItems.eachLayer((function(e){e.on("click",(function(){removeLayer(e)}))}))}drawElement(e){const t=e.layer;window.drawnItems.addLayer(t),updateButtonState(),"polygon"===e.layerType?L.DomUtil.addClass(t._path,"custom-polygon"):"rectangle"===e.layerType?L.DomUtil.addClass(t._path,"custom-rectangle"):"circle"===e.layerType&&L.DomUtil.addClass(t._path,"custom-circle"),document.querySelectorAll(".tool-wrapper").forEach((function(e){e.classList.remove("active")}))}edit(){this.editMode?(window.drawnItems.eachLayer((function(e){e.editing&&e.editing.disable()})),this.editMode=!1):(window.drawnItems.eachLayer((function(e){e.editing&&(e.editing.enable(),e.on("edit",(function(){updateButtonState()})))})),this.editMode=!0)}drawMap(e){this.loadMap(),e&&0!==Object.keys(e).length&&this.loadGeojson(e),document.getElementById("zoom-in").addEventListener("click",(function(){window.map.zoomIn()})),document.getElementById("zoom-out").addEventListener("click",(function(){window.map.zoomOut()})),document.getElementById("polygon").addEventListener("click",function(){this.disableActiveTool(),this.activeTool=new L.Draw.Polygon(window.map),this.activeTool.enable()}.bind(this)),document.getElementById("square").addEventListener("click",function(){this.disableActiveTool(),this.activeTool=new L.Draw.Rectangle(window.map),this.activeTool.enable()}.bind(this)),document.getElementById("circle").addEventListener("click",function(){this.disableActiveTool(),this.activeTool=new L.Draw.Circle(window.map),this.activeTool.enable()}.bind(this)),document.getElementById("trash").addEventListener("click",function(){this.deleteElement()}.bind(this)),window.map.on(L.Draw.Event.CREATED,function(e){this.drawElement(e)}.bind(this)),document.getElementById("edit").addEventListener("click",function(){this.disableActiveTool(),this.edit()}.bind(this))}fetchCitySuggestions(e,t,n){const o=`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${e}, United States`)}&format=json&addressdetails=1&limit=10`;fetch(o).then((e=>{if(!e.ok)throw new Error("Network response was not ok");return e.json()})).then((e=>{const o=e.map((e=>({name:e.display_name,lat:e.lat,lon:e.lon,onSelect:()=>this.drawTownCircle(e)})));createDropdown(o,n,t,"city-dropdown__link",!1)})).catch((e=>console.error("Error fetching cities:",e)))}drawTownCircle(e){const t=e.lat,n=e.lon;window.map.setView([t,n],9);const o=L.circle([t,n],{color:"blue",fillColor:"#30f",fillOpacity:.3,radius:40233.5,editable:!1}).addTo(window.map);window.nonEditableItems.addLayer(o),updateButtonState();const i={circle:o,name:e.display_name,radius:25};window.drawnCities.push(i);const a=o.getElement();a&&L.DomUtil.addClass(a,"custom-circle__searched")}showDrawnCities(e,t){const n=window.drawnCities.map((n=>({name:n.name,lat:n.circle.getLatLng().lat,lon:n.circle.getLatLng().lng,onSelect:()=>{window.map.setView(n.circle.getLatLng(),9),t.value=n.name,e.style.display="none",this.setupRadiusAdjustment(n)}})));createDropdown(n,e,t,"city-dropdown__link",!0),document.querySelector(".town-radius__dropdown").classList.add("hidden")}setupRadiusAdjustment(e){const t=document.querySelector(".town-dropdown__range");t.value=e.radius,t.max=50,t.min=0,t.style.display="block",t.oninput=function(){const n=parseInt(t.value),o=1609.34*n;e.circle.setRadius(o),e.radius=n}}};e?fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients_homepage",{method:"GET",headers:{Authorization:`Bearer ${e}`}}).then((e=>e.json())).then((e=>{const o=document.querySelector(".nav-clients.no-clients"),i=document.querySelector(".nav-clients.existing");if(null===e.geojson_map&&Array.isArray(e.homepage_clients)&&0===e.homepage_clients.length)o.style.display="flex",i.style.display="none";else{o.style.display="none",i.style.display="flex";const a=t?e.homepage_clients.find((e=>e.id===parseInt(t))):e.homepage_clients[0];n.drawMap(JSON.parse(a.geojson_map.map));const l=document.querySelector(".client-nav__name"),d=document.querySelector(".client-nav__image");document.querySelector(".clients-number").textContent=e.homepage_clients.length;const c=document.querySelector(".client-link.active .client-nav__image"),s=document.querySelector(".client-link.active .client-link__info"),r=document.querySelector(".client-link.active .client-link__company");l.textContent=a.full_name,d.src=a.image.url,c.src=a.image.url,s.innerHTML=`${a.full_name}<br>`,r.textContent=a.company_name,i.classList.remove("hidden");const m=document.querySelector(".clients-wrapper");m.innerHTML="",e.homepage_clients.forEach((n=>{if(t&&n.id==t||!t&&n.id==e.homepage_clients[0].id)return;const o=document.createElement("a");o.classList.add("client-link","not-selected"),o.setAttribute("client-id",n.id),o.href="?client-id="+n.id,o.innerHTML=`\n  ${n.image?`<img src="${n.image.url}" loading="lazy" alt="" class="client-nav__image">`:`<div class="client-avatar" style="background-color: ${colorRandomizer()} ;">${n.full_name.charAt(0).toUpperCase()}</div>`}\n  <p class="client-link__info">\n    ${n.full_name}<br>\n    <span class="client-link__company inactive">${n.company_name}</span>\n  </p>\n`,m.appendChild(o)}))}})).catch((e=>{console.error("Error fetching data:",e)})):console.error("authToken not found in local storage");const o=document.querySelector(".clients-dropdown"),i=document.querySelector(".close-clients");function a(e){e.stopPropagation(),document.querySelector(".clients-dropdown__menu").classList.toggle("open")}return o.addEventListener("click",(e=>a(e))),i.addEventListener("click",(e=>a(e))),{}})()));