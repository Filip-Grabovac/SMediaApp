// User.js
export default class Map {
  constructor() {
    this.activeTool = null;
    this.deleteMode = null;
    this.editMode = false;

    this.disableActiveTool = this.disableActiveTool.bind(this);
    this.drawElement = this.drawElement.bind(this);
    this.deleteElement = this.deleteElement.bind(this);
  }

  loadMap() {
    window.map = L.map('map', { zoomControl: false }).setView([37.8, -96], 4); // Centered over the US, default zoom control disabled

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(window.map);

    // Create a FeatureGroup to store the drawn shapes
    window.drawnItems = new L.FeatureGroup();
    window.nonEditableItems = L.featureGroup().addTo(window.map);
    window.map.addLayer(window.drawnItems);

    // Initialize Leaflet Draw control with all tools and editing functionality hidden
    const drawControl = new L.Control.Draw({
      edit: false, // Disable the default edit toolbar entirely
      draw: {
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
      },
    });
    window.map.addControl(drawControl);
  }

  disableActiveTool() {
    if (this.activeTool) {
      this.activeTool.disable();
      this.activeTool = null;
    }
    if (this.deleteMode) {
      this.deleteMode.disable(); // Disable delete mode if it's active
      this.deleteMode = null;
    }
    if (this.editMode) {
      window.drawnItems.eachLayer(function (layer) {
        if (layer.editing) {
          layer.editing.disable(); // Disable editing for each layer in the FeatureGroup
        }
      });
      this.editMode = false; // Reset edit mode state
    }

    document.querySelector('.town-radius__dropdown').classList.add('hidden');
  }

  loadGeojson(geojson) {
    L.geoJSON(geojson, {
      onEachFeature: function (feature, layer) {
        // Check the feature type to decide whether it's editable or not
        if (feature.properties && feature.properties.editable === false) {
          // Add non-editable shapes to nonEditableItems
          window.nonEditableItems.addLayer(layer);
          updateButtonState();
        } else {
          // Add editable shapes to drawnItems
          window.drawnItems.addLayer(layer);
          updateButtonState();
        }
      },
    }).addTo(window.map); // Add the loaded shapes to the map
  }

  deleteElement() {
    this.disableActiveTool();

    // Enable the delete mode, allowing users to click shapes for removal
    this.deleteMode = new L.EditToolbar.Delete(window.map, {
      featureGroup: window.drawnItems, // Include drawnItems for deletion
    });
    this.deleteMode.enable();

    // Listen for the 'click' event on each layer in drawnItems
    window.drawnItems.eachLayer(function (layer) {
      layer.on('click', function () {
        removeLayer(layer); // Call the function to remove from both groups and update dropdown
      });
    });

    // Also listen for the 'click' event on each layer in nonEditableItems
    window.nonEditableItems.eachLayer(function (layer) {
      layer.on('click', function () {
        removeLayer(layer); // Call the function to remove from both groups and update dropdown
      });
    });
  }

  drawElement(element) {
    const layer = element.layer;

    // Add the layer to the FeatureGroup
    window.drawnItems.addLayer(layer);
    updateButtonState();

    // Add a custom class based on the shape type
    if (element.layerType === 'polygon') {
      L.DomUtil.addClass(layer._path, 'custom-polygon'); // Add class to polygon
    } else if (element.layerType === 'rectangle') {
      L.DomUtil.addClass(layer._path, 'custom-rectangle'); // Add class to rectangle
    } else if (element.layerType === 'circle') {
      L.DomUtil.addClass(layer._path, 'custom-circle'); // Add class to circle
    }

    // ** Remove 'active' class from all .tool-wrapper elements when shape drawing is finished **
    document.querySelectorAll('.tool-wrapper').forEach(function (wrapper) {
      wrapper.classList.remove('active');
    });
  }

  edit() {
    if (this.editMode) {
      // If already in edit mode, disable it
      window.drawnItems.eachLayer(function (layer) {
        if (layer.editing) {
          layer.editing.disable(); // Disable editing for each layer in the editable group
        }
      });
      this.editMode = false; // Reset edit mode state
    } else {
      // Enable edit mode for drawnItems only
      window.drawnItems.eachLayer(function (layer) {
        if (layer.editing) {
          layer.editing.enable(); // Enable editing for editable layers only

          layer.on('edit', function () {
            updateButtonState();
          });
        }
      });
      this.editMode = true; // Set edit mode state
    }
  }

  drawMap(geojson) {
    // Initialize the map
    this.loadMap();

    // Handle GeoJSON data
    if (geojson) {
      if (Object.keys(geojson).length !== 0) {
        this.loadGeojson(geojson); // Call loadGeoJSON to handle the GeoJSON shapes
      }
    }

    // ** Custom Map Controls **
    // Zoom in control
    document.getElementById('zoom-in').addEventListener('click', function () {
      window.map.zoomIn();
    });

    // Zoom out control
    document.getElementById('zoom-out').addEventListener('click', function () {
      window.map.zoomOut();
    });

    // Polygon draw control
    document.getElementById('polygon').addEventListener(
      'click',
      function () {
        this.disableActiveTool();
        this.activeTool = new L.Draw.Polygon(window.map); // Activate the new tool
        this.activeTool.enable();
      }.bind(this)
    );

    // Square (Rectangle) draw control
    document.getElementById('square').addEventListener(
      'click',
      function () {
        this.disableActiveTool();
        this.activeTool = new L.Draw.Rectangle(window.map); // Activate the new tool
        this.activeTool.enable();
      }.bind(this)
    );

    // Circle draw control
    document.getElementById('circle').addEventListener(
      'click',
      function () {
        this.disableActiveTool();
        this.activeTool = new L.Draw.Circle(window.map); // Activate the new tool
        this.activeTool.enable();
      }.bind(this)
    );

    // Modify the custom trash control to delete shapes by selecting them
    document.getElementById('trash').addEventListener(
      'click',
      function () {
        this.deleteElement();
      }.bind(this)
    );

    // Handle the draw:created event to keep the drawn shapes on the map
    window.map.on(
      L.Draw.Event.CREATED,
      function (e) {
        this.drawElement(e);
      }.bind(this)
    );

    // Custom edit control to enable or disable editing for all layers
    document.getElementById('edit').addEventListener(
      'click',
      function () {
        this.disableActiveTool();
        this.edit();
      }.bind(this)
    );
  }

  fetchCitySuggestions(query, townInput, townDropdown) {
    const modifiedQuery = `${query}, United States`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      modifiedQuery
    )}&format=json&addressdetails=1&limit=10`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        const suggestions = data.map((city) => ({
          name: city.display_name, // Extract city names
          lat: city.lat, // Extract latitude
          lon: city.lon, // Extract longitude
          onSelect: () => this.drawTownCircle(city), // Define the action on selection
        }));
        createDropdown(
          suggestions,
          townDropdown,
          townInput,
          'city-dropdown__link',
          false
        ); // Call function to create the dropdown
      })
      .catch((error) => console.error('Error fetching cities:', error));
  }

  drawTownCircle(cityData) {
    const lat = cityData.lat;
    const lon = cityData.lon;

    window.map.setView([lat, lon], 9); // Center the map on the town

    const radiusMiles = 25; // Default radius in miles
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters

    const circle = L.circle([lat, lon], {
      color: 'blue',
      fillColor: '#30f',
      fillOpacity: 0.3,
      radius: radiusMeters,
      editable: false,
    }).addTo(window.map); // Add circle to the map

    window.nonEditableItems.addLayer(circle);
    updateButtonState();

    // Save the drawn circle along with the city name and radius
    const cityInfo = {
      circle: circle,
      name: cityData.display_name,
      radius: radiusMiles, // Store the radius in miles
    };

    window.drawnCities.push(cityInfo);

    // Optionally set a custom class to style the circle
    const pathElement = circle.getElement();
    if (pathElement) {
      L.DomUtil.addClass(pathElement, 'custom-circle__searched');
    }
  }

  showDrawnCities(townDropdown, townInput) {
    const suggestions = window.drawnCities.map((cityInfo) => ({
      name: cityInfo.name,
      lat: cityInfo.circle.getLatLng().lat,
      lon: cityInfo.circle.getLatLng().lng,
      onSelect: () => {
        window.map.setView(cityInfo.circle.getLatLng(), 9);
        townInput.value = cityInfo.name;
        townDropdown.style.display = 'none';

        // Display and set up radius adjustment for the selected city
        this.setupRadiusAdjustment(cityInfo);
      },
    }));

    createDropdown(
      suggestions,
      townDropdown,
      townInput,
      'city-dropdown__link',
      true
    );

    document.querySelector('.town-radius__dropdown').classList.add('hidden');
  }

  setupRadiusAdjustment(cityInfo) {
    const rangeInput = document.querySelector('.town-dropdown__range');
    rangeInput.value = cityInfo.radius; // Set initial value to current radius
    rangeInput.max = 50; // Max radius 50 miles
    rangeInput.min = 0; // Min radius 0 miles

    // Show the radius input and set event listener for change
    rangeInput.style.display = 'block'; // Ensure input is visible
    rangeInput.oninput = function () {
      const newRadiusMiles = parseInt(rangeInput.value);
      const newRadiusMeters = newRadiusMiles * 1609.34; // Convert miles to meters

      cityInfo.circle.setRadius(newRadiusMeters); // Update circle radius on the map
      cityInfo.radius = newRadiusMiles; // Update radius in city info object
    };
  }

  drawState(state) {
    // Create a GeoJSON layer for the state polygon
    const polygon = L.geoJSON(state, {
      style: {
        color: 'blue', // Set polygon color
        weight: 2,
      },
      onEachFeature: (feature, layer) => {
        if (layer instanceof L.Polygon) {
          layer.on('add', () => {
            L.DomUtil.addClass(layer._path, 'custom-polygon__searched'); // Add class to the polygon
          });
        }
      },
    }).addTo(window.map); // Add to the global map variable

    window.nonEditableItems.addLayer(polygon); // Add the polygon to the drawnItems FeatureGroup
    updateButtonState(); // Update the button state

    const bounds = polygon.getBounds();
    window.map.fitBounds(bounds); // Optional: Center and zoom the map to the polygon
  }

  async searchZip(zipInput, zipDropdown) {
    const query = zipInput.value.trim();

    if (query.length < 3) {
      zipDropdown.innerHTML = '';
      zipDropdown.style.display = 'none';
      return;
    }

    try {
      // Fetch matching locations based on the ZIP code
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${query}&countrycodes=us&format=json&addressdetails=1`
      );
      const results = await response.json();

      const suggestions = results.map((location) => ({
        name: location.display_name,
        onSelect: () => {
          zipInput.value = location.display_name;
        },
      }));

      createDropdown(
        suggestions,
        zipDropdown,
        zipInput,
        false,
        'zip-dropdown__link'
      );
    } catch (error) {
      console.error('Error fetching location data:', error);
      zipDropdown.style.display = 'none';
    }
  }
}
