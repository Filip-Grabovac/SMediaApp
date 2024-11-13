!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("homepage",[],t):"object"==typeof exports?exports.homepage=t():e.homepage=t()}(this,(()=>(()=>{"use strict";const e=new class{authenticate(e="/",t="/login"){const n=localStorage.getItem("authToken");n?fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/me",{method:"GET",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}}).then((e=>e.json())).then((n=>{if("ERROR_CODE_UNAUTHORIZED"===n.code)localStorage.removeItem("authToken"),window.location.pathname!==t&&(window.location.href=t);else{if("/clients"===window.location.pathname)return;window.location.pathname!==e&&(window.location.href=e)}})).catch((e=>{console.error("Error:",e)})):window.location.pathname!==t&&(window.location.href=t)}logIn(e){fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then((e=>e.json())).then((e=>{if(e.authToken)localStorage.setItem("authToken",e.authToken),0===e.clients_length?window.location.href="/clients":window.location.href="/";else{const e=document.querySelector(".error-message"),t=document.querySelectorAll(".login-input");e.classList.remove("hidden"),t.forEach((e=>{e.classList.add("invalid")}))}})).catch((e=>{console.error("Error:",e)}))}logOut(){localStorage.removeItem("authToken"),window.location.href="/login"}toggleUserPassVisibility(e,t,n){"password"===e.type?(e.type="text",t.style.display="block",n.style.display="none"):(e.type="password",t.style.display="none",n.style.display="block")}},t=new class{constructor(){this.activeTool=null,this.deleteMode=null,this.editMode=!1,this.disableActiveTool=this.disableActiveTool.bind(this),this.drawElement=this.drawElement.bind(this),this.deleteElement=this.deleteElement.bind(this)}loadMap(){window.map=L.map("map",{zoomControl:!1}).setView([37.8,-96],4),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(window.map),window.drawnItems=new L.FeatureGroup,window.nonEditableItems=L.featureGroup().addTo(window.map),window.map.addLayer(window.drawnItems);const e=new L.Control.Draw({edit:!1,draw:{polygon:!1,rectangle:!1,circle:!1,marker:!1,polyline:!1,circlemarker:!1}});window.map.addControl(e)}disableActiveTool(){this.activeTool&&(this.activeTool.disable(),this.activeTool=null),this.deleteMode&&(this.deleteMode.disable(),this.deleteMode=null),this.editMode&&(window.drawnItems.eachLayer((function(e){e.editing&&e.editing.disable()})),this.editMode=!1),document.querySelector(".town-radius__dropdown").classList.add("hidden")}loadGeojson(e){L.geoJSON(e,{onEachFeature:function(e,t){e.properties&&!1===e.properties.editable?(window.nonEditableItems.addLayer(t),updateButtonState()):(window.drawnItems.addLayer(t),updateButtonState())}}).addTo(window.map)}deleteElement(){this.disableActiveTool(),this.deleteMode=new L.EditToolbar.Delete(window.map,{featureGroup:window.drawnItems}),this.deleteMode.enable(),window.drawnItems.eachLayer((function(e){e.on("click",(function(){removeLayer(e)}))})),window.nonEditableItems.eachLayer((function(e){e.on("click",(function(){removeLayer(e)}))}))}drawElement(e){const t=e.layer;window.drawnItems.addLayer(t),updateButtonState(),"polygon"===e.layerType?L.DomUtil.addClass(t._path,"custom-polygon"):"rectangle"===e.layerType?L.DomUtil.addClass(t._path,"custom-rectangle"):"circle"===e.layerType&&L.DomUtil.addClass(t._path,"custom-circle"),document.querySelectorAll(".tool-wrapper").forEach((function(e){e.classList.remove("active")}))}edit(){this.editMode?(window.drawnItems.eachLayer((function(e){e.editing&&e.editing.disable()})),this.editMode=!1):(window.drawnItems.eachLayer((function(e){e.editing&&(e.editing.enable(),e.on("edit",(function(){updateButtonState()})))})),this.editMode=!0)}drawMap(e){this.loadMap(),e&&0!==Object.keys(e).length&&this.loadGeojson(e),document.getElementById("zoom-in").addEventListener("click",(function(){window.map.zoomIn()})),document.getElementById("zoom-out").addEventListener("click",(function(){window.map.zoomOut()})),document.getElementById("polygon").addEventListener("click",function(){this.disableActiveTool(),this.activeTool=new L.Draw.Polygon(window.map),this.activeTool.enable()}.bind(this)),document.getElementById("square").addEventListener("click",function(){this.disableActiveTool(),this.activeTool=new L.Draw.Rectangle(window.map),this.activeTool.enable()}.bind(this)),document.getElementById("circle").addEventListener("click",function(){this.disableActiveTool(),this.activeTool=new L.Draw.Circle(window.map),this.activeTool.enable()}.bind(this)),document.getElementById("trash").addEventListener("click",function(){this.deleteElement()}.bind(this)),window.map.on(L.Draw.Event.CREATED,function(e){this.drawElement(e)}.bind(this)),document.getElementById("edit").addEventListener("click",function(){this.disableActiveTool(),this.edit()}.bind(this))}fetchCitySuggestions(e,t,n){const o=`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${e}, United States`)}&format=json&addressdetails=1&limit=10`;fetch(o).then((e=>{if(!e.ok)throw new Error("Network response was not ok");return e.json()})).then((e=>{const o=e.map((e=>({name:e.display_name,lat:e.lat,lon:e.lon,onSelect:()=>this.drawTownCircle(e)})));createDropdown(o,n,t,"city-dropdown__link",!1)})).catch((e=>console.error("Error fetching cities:",e)))}drawTownCircle(e){const t=e.lat,n=e.lon;window.map.setView([t,n],9);const o=L.circle([t,n],{color:"blue",fillColor:"#30f",fillOpacity:.3,radius:40233.5,editable:!1}).addTo(window.map);window.nonEditableItems.addLayer(o),updateButtonState();const i={circle:o,name:e.display_name,radius:25};window.drawnCities.push(i);const a=o.getElement();a&&L.DomUtil.addClass(a,"custom-circle__searched")}showDrawnCities(e,t){const n=window.drawnCities.map((n=>({name:n.name,lat:n.circle.getLatLng().lat,lon:n.circle.getLatLng().lng,onSelect:()=>{window.map.setView(n.circle.getLatLng(),9),t.value=n.name,e.style.display="none",this.setupRadiusAdjustment(n)}})));createDropdown(n,e,t,"city-dropdown__link",!0),document.querySelector(".town-radius__dropdown").classList.add("hidden")}setupRadiusAdjustment(e){const t=document.querySelector(".town-dropdown__range");t.value=e.radius,t.max=50,t.min=0,t.style.display="block",t.oninput=function(){const n=parseInt(t.value),o=1609.34*n;e.circle.setRadius(o),e.radius=n}}drawState(e){const t=L.geoJSON(e,{style:{color:"blue",weight:2},onEachFeature:(e,t)=>{t instanceof L.Polygon&&t.on("add",(()=>{L.DomUtil.addClass(t._path,"custom-polygon__searched")}))}}).addTo(window.map);window.nonEditableItems.addLayer(t),updateButtonState();const n=t.getBounds();window.map.fitBounds(n)}async searchZip(e,t){const n=e.value.trim();if(n.length<3)return t.innerHTML="",void(t.style.display="none");try{const o=await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${n}&countrycodes=us&format=json&addressdetails=1`),i=(await o.json()).map((t=>({name:t.display_name,onSelect:()=>{e.value=t.display_name}})));createDropdown(i,t,e,!1,"zip-dropdown__link")}catch(e){console.error("Error fetching location data:",e),t.style.display="none"}}},n=new class{constructor(){this.displayedCities=new Set,this.pendingRequests=0}processLayer(e){let t;if(e instanceof L.Polygon||e instanceof L.Rectangle){const n=e.getLatLngs()[0],o=`${Math.min(...n.map((e=>e.lat)))},${Math.min(...n.map((e=>e.lng)))},${Math.max(...n.map((e=>e.lat)))},${Math.max(...n.map((e=>e.lng)))}`;t=`\n                [out:json];\n                (\n                    node["place"~"city|town"](${o});\n                    way["place"~"city|town"](${o});\n                    relation["place"~"city|town"](${o});\n                );\n                out body;`}else if(e instanceof L.Circle){const n=e.getLatLng(),o=e.getRadius();t=`\n                [out:json];\n                (\n                    node["place"~"city|town"](around:${o}, ${n.lat}, ${n.lng});\n                    way["place"~"city|town"](around:${o}, ${n.lat}, ${n.lng});\n                    relation["place"~"city|town"](around:${o}, ${n.lat}, ${n.lng});\n                );\n                out body;`}else{if(!(e instanceof L.GeoJSON))return void console.warn("Unsupported layer type. Only polygon, rectangle, circle, and geoJSON are supported.");{const n=e.getBounds(),o=`${n.getSouth()},${n.getWest()},${n.getNorth()},${n.getEast()}`;t=`\n                [out:json];\n                (\n                    node["place"~"city|town"](${o});\n                    way["place"~"city|town"](${o});\n                    relation["place"~"city|town"](${o});\n                );\n                out body;`}}this.pendingRequests++,this.sendOverpassQuery(t)}sendOverpassQuery(e){fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:e}).then((e=>e.json())).then((e=>{const t=e.elements.filter((e=>e.tags&&e.tags.name)),n=document.querySelector(".selected-cities__wrapper");n&&t.length>0?t.forEach((e=>{const t=e.tags.name;if(!this.displayedCities.has(t)){this.displayedCities.add(t);const e=document.createElement("div");e.classList.add("selected-city");const o=document.createElement("div");o.classList.add("selected-city__text"),o.textContent=t;const i=document.createElement("input");i.type="checkbox",i.classList.add("selected-city__checkbox"),i.checked=!0,e.appendChild(o),e.appendChild(i),n.appendChild(e)}})):console.log("No cities found in this area.")})).catch((e=>{console.error("Error querying Overpass API:",e)})).finally((()=>{this.pendingRequests--,0===this.pendingRequests&&(document.querySelector(".blue-loader").classList.add("hidden"),toggleModal())}))}fetchPlacesFromAllShapes(e){e.target.classList.remove("active"),document.querySelector(".blue-loader").classList.remove("hidden"),document.querySelector(".selected-cities__wrapper").innerHTML="",this.pendingRequests=0,this.displayedCities=new Set,window.drawnItems.eachLayer(this.processLayer.bind(this)),window.nonEditableItems.eachLayer(this.processLayer.bind(this))}},o=document.querySelector(".logout-btn"),i=document.getElementById("town-input"),a=document.getElementById("town-dropdown"),d=document.querySelector(".search-input__arrow"),s=document.getElementById("state-input"),l=document.getElementById("state-dropdown"),c=document.getElementById("zip-input"),r=document.getElementById("zip-dropdown"),u=document.querySelector(".main-button.submit-selection");return window.drawnCities=[],e.authenticate(),o.addEventListener("click",(function(t){t.preventDefault(),e.logOut()})),i.addEventListener("focus",(()=>{disableTools(),document.querySelector(".town-radius__dropdown").classList.add("hidden")})),i.addEventListener("input",debounce((e=>{const n=e.target.value;if(""===n)return a.innerHTML="",void(a.style.display="none");t.fetchCitySuggestions(n,i,a)}),300)),d.addEventListener("click",(()=>{t.showDrawnCities(a,i)})),hideDropdownOnClick(a,i),s.addEventListener("focus",(()=>{disableTools(),document.querySelector(".town-radius__dropdown").classList.add("hidden")})),s.addEventListener("input",(e=>{const n=e.target.value;if(""===n)return void(dropdown.innerHTML="");const o=function(e){return statesData.features.filter((t=>t.properties.name.toLowerCase().includes(e.toLowerCase())))}(n),i=o.map((e=>({name:e.properties.name,onSelect:()=>t.drawState(e)})));createDropdown(i,l,s,!1,"state-dropdown__link"),disableTools()})),c.addEventListener("focus",(()=>{disableTools(),document.querySelector(".town-radius__dropdown").classList.add("hidden")})),c.addEventListener("input",debounce((async function(){await t.searchZip(c,r)}),300)),u.addEventListener("click",(e=>{n.fetchPlacesFromAllShapes(e)})),document.querySelector(".close-modal").addEventListener("click",(()=>{toggleModal()})),document.querySelector(".overlay.homepage").addEventListener("click",(()=>{toggleModal()})),{}})()));