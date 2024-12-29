//import Tool from './Tool';

import Tool from 'https://smediaapp.pages.dev/src/Tool.js';

// User.js
export default class Map {
  constructor() {
    this.activeTool = null;
    this.updateButtonState = this.updateButtonState.bind(this);
    this.tool = new Tool(this);
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

  loadGeojson(geojson, place) {
    L.geoJSON(geojson, {
      onEachFeature: function (feature, layer) {
        place.processLayer(layer, feature.properties.shapeId);

        // Check the feature type to decide whether it's editable or not
        if (feature.properties && feature.properties.editable === false) {
          // Add non-editable shapes to nonEditableItems
          window.nonEditableItems.addLayer(layer);
        } else {
          // Add editable shapes to drawnItems
          window.drawnItems.addLayer(layer);
        }

        // Handle circle geometry (GeoJSON type: Point)
        if (feature.geometry && feature.geometry.type === 'Point') {
          const coordinates = feature.geometry.coordinates;
          const center = L.latLng(coordinates[1], coordinates[0]); // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
          const radius = feature.properties.radius; // Radius in meters (stored in properties)

          if (radius) {
            // Create a Leaflet circle
            const circle = L.circle(center, { radius });

            // Add the circle to the correct layer (editable or non-editable)
            if (feature.properties && feature.properties.editable === false) {
              window.nonEditableItems.addLayer(circle);
            } else {
              window.drawnItems.addLayer(circle);
            }

            // Set the shapeId and classes to the circle
            circle._path.setAttribute('shapeId', feature.properties.shapeId);
            if (feature.properties && feature.properties.classes) {
              circle._path.setAttribute(
                'class',
                feature.properties.classes.join(' ')
              );
            }
          }

          // Prevent Leaflet from creating a default marker for the point geometry
          return; // Return early to skip default marker creation
        }

        // For polygons, rectangles, and other shapes, handle the default layer creation
        if (feature.geometry && feature.geometry.type !== 'Point') {
          // Set the shapeId and classes to the layer (path element)
          if (feature.properties && feature.properties.shapeId) {
            layer._path.setAttribute('shapeId', feature.properties.shapeId);
          }
          if (feature.properties && feature.properties.classes) {
            layer._path.setAttribute(
              'class',
              feature.properties.classes.join(' ')
            );
          }
        }
      },
    }).addTo(window.map); // Add the loaded shapes to the map
  }

  drawMap(geojson, place, locations, geojsonPlace) {
    // Initialize the map
    this.loadMap();

    // Handle GeoJSON data
    if (geojson) {
      if (Object.keys(geojson).length !== 0) {
        this.loadGeojson(geojson, geojsonPlace); // Call loadGeoJSON to handle the GeoJSON shapes
      }
    }

    // Add pins to the map based on locations
    if (locations && locations.length > 0) {
      this.addPinsToMap(locations);
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
        this.tool.disableActiveTool();
        this.activeTool = new L.Draw.Polygon(window.map); // Activate the new tool
        this.activeTool.enable();
      }.bind(this)
    );

    // Square (Rectangle) draw control
    document.getElementById('square').addEventListener(
      'click',
      function () {
        this.tool.disableActiveTool();
        this.activeTool = new L.Draw.Rectangle(window.map); // Activate the new tool
        this.activeTool.enable();
      }.bind(this)
    );

    // Circle draw control
    document.getElementById('circle').addEventListener(
      'click',
      function () {
        this.tool.disableActiveTool();
        this.activeTool = new L.Draw.Circle(window.map); // Activate the new tool
        this.activeTool.enable();
      }.bind(this)
    );

    // Modify the custom trash control to delete shapes by selecting them
    document.getElementById('trash').addEventListener(
      'click',
      function () {
        this.tool.deleteElement();
      }.bind(this)
    );

    // Handle the draw:created event to keep the drawn shapes on the map
    window.map.on(
      L.Draw.Event.CREATED,
      function (e) {
        this.tool.drawElement(e, place);
      }.bind(this)
    );

    // Custom edit control to enable or disable editing for all layers
    document.getElementById('edit').addEventListener(
      'click',
      function () {
        this.tool.disableActiveTool();
        this.tool.edit();
      }.bind(this)
    );
  }

  addPinsToMap(locations) {
    let firstMarkerCoords = null; // Variable to store the first marker's coordinates
    var blackMarker = L.icon({
      iconUrl:
        'https://cdn.prod.website-files.com/66eab8d4420be36698ed221a/676ee2028ca7187507716eb1_black-marker.svg',

      iconSize: [21, 24.8], // size of the icon
      iconAnchor: [10.5, 24.8], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -29], // point from which the popup should open relative to the iconAnchor
    });

    locations.forEach((location, index) => {
      try {
        const locationData = JSON.parse(location.location.replace(/'/g, '"')); // Parse location JSON
        const lat = parseFloat(locationData.lan); // Extract latitude
        const lon = parseFloat(locationData.lon); // Extract longitude
        const address = locationData.office_address; // Extract address

        if (!isNaN(lat) && !isNaN(lon)) {
          // Add a circle marker with custom style
          const marker = L.marker([lat, lon], { icon: blackMarker }).addTo(
            window.map
          );
          marker.bindPopup(`<strong>${address}</strong>`); // Add popup with address

          // Save the first marker's coordinates
          if (index === 0) {
            firstMarkerCoords = [lat, lon];
          }
        }
      } catch (error) {
        console.error('Error parsing location:', location, error);
      }
    });

    // Zoom to the first marker if it exists
    // if (firstMarkerCoords) {
    //   window.map.setView(firstMarkerCoords, 10); // Set the map view (adjust zoom level as needed)
    // }
  }

  fetchCitySuggestions(query, townInput, townDropdown, place) {
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
          onSelect: () => this.tool.drawTownCircle(city, place), // Define the action on selection
        }));
        this.tool.createDropdown(
          suggestions,
          townDropdown,
          townInput,
          'city-dropdown__link',
          false
        ); // Call function to create the dropdown
      })
      .catch((error) => console.error('Error fetching cities:', error));
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
        this.tool.setupRadiusAdjustment(cityInfo);
      },
    }));

    this.tool.createDropdown(
      suggestions,
      townDropdown,
      townInput,
      'city-dropdown__link',
      true
    );

    document.querySelector('.town-radius__dropdown').classList.add('hidden');
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

      this.tool.createDropdown(
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

  hideDropdownOnClick(dropdown, input) {
    document.addEventListener('click', (event) => {
      if (
        !dropdown.contains(event.target) &&
        event.target !== input &&
        !event.target.classList.contains('search-input__arrow')
      ) {
        dropdown.style.display = 'none'; // Hide dropdown if clicking outside
      }
    });
  }

  disableTools() {
    if (map && map.dragging) {
      document.querySelectorAll('.tool-wrapper').forEach((wrapper) => {
        wrapper.classList.remove('active');
      });

      // Set the map to "hand" mode (replace with your map's hand mode function)
      map.dragging.enable();
      map.boxZoom.disable();
      map.doubleClickZoom.enable();
    }
  }

  updateButtonState() {
    const button = document.querySelector('.main-button.submit-selection');

    // Get the count of drawn items
    const drawnItemsCount = Object.keys(window.drawnItems._layers).length;

    // Get the count of non-editable items
    const nonEditableItemsCount = Object.keys(
      window.nonEditableItems._layers
    ).length;

    const hasItems = drawnItemsCount > 0 || nonEditableItemsCount > 0;

    if (hasItems) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }

  saveMapInDB() {
    const geojson = {
      type: 'FeatureCollection',
      features: [],
    };

    // Select all shapes with the class .leaflet-interactive
    const shapes = document.querySelectorAll('.leaflet-interactive');

    shapes.forEach((shape) => {
      // Retrieve shapeId and class attributes
      const shapeId = shape.getAttribute('shapeId');
      if (!shapeId) return; // Skip shapes without a shapeId

      const classes = shape.getAttribute('class');

      // Find the corresponding Leaflet layer
      const layer = Object.values(window.map._layers).find(
        (l) => l._path === shape
      );

      if (layer) {
        let geometry = null;
        let feature = {
          type: 'Feature',
          geometry: null,
          properties: {
            shapeId: shapeId,
            classes: classes ? classes.split(' ') : [],
            editable: true,
          },
        };

        const strokeColor = layer.options.color;
        if (strokeColor && strokeColor.toLowerCase() === 'blue') {
          feature.properties.editable = false; // Set editable to false for blue stroke
        }

        // Handle Polygons and Rectangles
        if (layer.getLatLngs) {
          const latlngs = layer.getLatLngs()[0]; // Use the first array for polygons
          geometry = {
            type: 'Polygon',
            coordinates: [
              latlngs.map((latlng) => [latlng.lng, latlng.lat]), // Format as [lng, lat]
            ],
          };
          feature.geometry = geometry;
        }

        // Handle Circles
        if (layer.getLatLng && layer._mRadius) {
          const center = layer.getLatLng(); // Center of the circle
          const radius = layer._mRadius; // Radius in meters

          geometry = {
            type: 'Circle', // Representing the center as a Point
            coordinates: [center.lng, center.lat], // GeoJSON uses [lng, lat]
          };

          // Store additional radius information in properties
          feature.geometry = geometry;
          feature.properties.radius = radius;
        }

        if (feature.geometry) {
          geojson.features.push(feature); // Add feature to GeoJSON
        }
      }
    });

    // Check if features are populated
    if (geojson.features.length === 0) {
      console.error('No shapes found with valid shapeId.');
      return;
    }

    // Construct the API request body
    const requestBody = {
      geojson_client_id: currentClientId,
      map: JSON.stringify(geojson),
    };

    // Call the API endpoint
    fetch(
      `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/geojson_maps/${currentClientId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`, // Retrieve authToken from localStorage
        },
        body: JSON.stringify(requestBody),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('Map saved successfully:', data);
      })
      .catch((error) => {
        console.error('Error saving map:', error);
      });
  }
}
