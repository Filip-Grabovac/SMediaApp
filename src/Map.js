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
        place.processLayer(
          layer,
          feature.properties.shapeId,
          feature.properties.state
        );

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

        // For polygons and rectangles, handle the default layer creation
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
          onSelect: () =>
            this.tool.drawCityBorder(city, place, this.updateButtonState), // Define the action on selection
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
  }

  async searchZip(zipInput, zipDropdown, place) {
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
        'zip-dropdown__link',
        '#0c0b0e',
        place
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
      const state = shape.getAttribute('state');
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
            state: state ? state : null,
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
            type: 'Point', // Representing the center as a Point
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

  formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }
    return number.toLocaleString('en-US');
  }

  preLoadTable(table, currentClientId) {
    // Fetch the data from the API
    fetch(
      `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients_places?client_id=${currentClientId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.length === 0) {
          return;
        }

        // Variables to calculate min and max for normalization
        let minDistance = Infinity;
        let maxDistance = -Infinity;

        // Iterate through the data to find min and max distance
        data.forEach((item) => {
          if (!item) return;
          const distanceMatch = item.closest_office?.match(/([\d.]+) miles$/);
          const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
          if (distance < minDistance) minDistance = distance;
          if (distance > maxDistance) maxDistance = distance;
        });

        // Iterate through the fetched data and populate the table
        data.forEach((item) => {
          if (!item) return;
          const distanceMatch = item.closest_office?.match(/([\d.]+) miles$/);
          const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;

          // Normalize the distance
          const normalizedDistance =
            maxDistance !== minDistance
              ? (distance - minDistance) / (maxDistance - minDistance)
              : 0;

          table.row
            .add([
              '',
              item.place, // City
              item.state, // State
              this.formatNumber(Number(item.population)), // Population
              item.household_income, // Avg. Household Income
              this.formatNumber(Number(item.s_family_home)), // Approx. # of Single Family Homes
              item.avg_home_value, // Avg. Home Value
              item.avg_home_value === 'No data'
                ? 'No data'
                : `$${this.formatNumber(
                    Number(
                      item.avg_home_value.replace('$', '').replace(/,/g, '')
                    ) * Number(item.s_family_home)
                  )}`, // Total Home Value
              item.closest_office, // Closest Office
              '', // % of Total Pop
              '', // Cumulative Pop %
              '', // Total Population
              '', // Norm. Pop
              '', // Norm. Avg. Household Income
              '', // Norm. Approx. # of Single Family Homes
              '', // Norm. Avg. Home Value
              normalizedDistance || 0, // Norm. Distance
              '', // Weighted Score
            ])
            .draw();
        });

        this.calculateAndNormalizeTableData(table);
      })
      .catch((error) => {
        console.error('Error preloading data:', error);
      });
  }

  calculateAndNormalizeTableData(table) {
    // Initialize variables for min and max values
    let totalPopulation = 0;
    let minPopulation = Infinity;
    let maxPopulation = -Infinity;
    let minAvgIncome = Infinity;
    let maxAvgIncome = -Infinity;
    let minSingleFamilyHomes = Infinity;
    let maxSingleFamilyHomes = -Infinity;
    let minAvgHomeValue = Infinity;
    let maxAvgHomeValue = -Infinity;

    const dataRows = table.rows().data();

    // Calculate min/max values and total population
    dataRows.each((row) => {
      const population = parseInt(row[3].replace(/,/g, ''), 10);
      const avgHouseholdIncome = parseInt(row[4].replace(/[^0-9]/g, ''), 10);
      const singleFamilyHomes = parseInt(row[5].replace(/,/g, ''), 10);
      const avgHomeValue = parseInt(row[6].replace(/[^0-9]/g, ''), 10);

      totalPopulation += population;

      if (population < minPopulation) minPopulation = population;
      if (population > maxPopulation) maxPopulation = population;

      if (avgHouseholdIncome < minAvgIncome) minAvgIncome = avgHouseholdIncome;
      if (avgHouseholdIncome > maxAvgIncome) maxAvgIncome = avgHouseholdIncome;

      if (singleFamilyHomes < minSingleFamilyHomes)
        minSingleFamilyHomes = singleFamilyHomes;
      if (singleFamilyHomes > maxSingleFamilyHomes)
        maxSingleFamilyHomes = singleFamilyHomes;

      if (avgHomeValue < minAvgHomeValue) minAvgHomeValue = avgHomeValue;
      if (avgHomeValue > maxAvgHomeValue) maxAvgHomeValue = avgHomeValue;
    });

    document.querySelector(
      '.total-population-element'
    ).textContent = `(${totalPopulation.toLocaleString('en-US')})`;

    // Normalize data and compute weighted scores
    let cumulativePercentage = 0;

    table.rows().every(function () {
      const data = this.data();

      const population = parseInt(data[3].replace(/,/g, ''), 10);
      const avgHouseholdIncome = parseInt(data[4].replace(/[^0-9]/g, ''), 10);
      const singleFamilyHomes = parseInt(data[5].replace(/,/g, ''), 10);
      const avgHomeValue = parseInt(data[6].replace(/[^0-9]/g, ''), 10);

      const percentage = population / totalPopulation;
      cumulativePercentage += percentage;

      const normalizedPopulation =
        (population - minPopulation) / (maxPopulation - minPopulation);
      const normalizedAvgIncome =
        (avgHouseholdIncome - minAvgIncome) / (maxAvgIncome - minAvgIncome);
      const normalizedSingleFamilyHomes =
        (singleFamilyHomes - minSingleFamilyHomes) /
        (maxSingleFamilyHomes - minSingleFamilyHomes);
      const normalizedAvgHomeValue =
        (avgHomeValue - minAvgHomeValue) / (maxAvgHomeValue - minAvgHomeValue);

      const weightedScore =
        userFactors.population_factor * (normalizedPopulation || 0) +
        userFactors.avg_household_income_factor * (normalizedAvgIncome || 0) +
        userFactors.single_family_homes_factor *
          (normalizedSingleFamilyHomes || 0) +
        userFactors.avg_home_value_factor * (normalizedAvgHomeValue || 0);

      data[9] = `${(percentage * 100).toFixed(2)}%`; // % of Total Pop
      data[10] = `${(cumulativePercentage * 100).toFixed(2)}%`; // Cumulative Pop %
      data[12] = normalizedPopulation; // Norm. Pop
      data[13] = normalizedAvgIncome; // Norm. Avg. Household Income
      data[14] = normalizedSingleFamilyHomes; // Norm. Single Family Homes
      data[15] = isNaN(normalizedAvgHomeValue)
        ? 'No data'
        : normalizedAvgHomeValue; // Norm. Avg. Home Value
      data[17] = weightedScore || 0; // Weighted Score

      this.data(data);
    });

    // Sort table by weighted score
    table.order([17, 'desc']).draw();
  }

  toggleStateRow() {
    // Attach event listener to the SVG icon within each state-row
    $(document).on('click', '.state-row .toggle-arrow-svg', function () {
      const stateRow = $(this).closest('.state-row'); // Get the clicked state-row element
      const includedWrapper = $('.states_wrap.included');
      const excludedWrapper = $('.states_wrap.excluded');

      const lat = parseFloat(stateRow.attr('data-lat'));
      const lon = parseFloat(stateRow.attr('data-lon'));

      const shapeId = `excluded-${stateRow.attr('shapeid')}`; // Unique ID for the circle

      if (stateRow.closest('.states_wrap').hasClass('included')) {
        // Move the state-row to the excluded wrapper
        excludedWrapper.append(stateRow);

        // Add a red circle to the map
        if (typeof map.addLayer === 'function') {
          const circle = L.circle([lat, lon], {
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.5,
            radius: 500, // Adjust radius as needed
          }).addTo(map);

          // Store the circle on the stateRow for easy removal
          stateRow.data('circle', circle);
        }

        // Update included and excluded numbers
        updateCount();
      } else {
        // Move the state-row back to the included wrapper
        includedWrapper.append(stateRow);

        // Remove the red circle from the map if it exists
        const circle = stateRow.data('circle');
        if (circle) {
          map.removeLayer(circle);
          stateRow.removeData('circle'); // Clear the reference
        }

        // Update included and excluded numbers
        updateCount();
      }
    });

    // Function to update the counts of included and excluded state rows
    function updateCount() {
      const includedCount = $('.states_wrap.included .state-row').length;
      const excludedCount = $('.states_wrap.excluded .state-row').length;

      // Update the placeholder numbers
      $('.included-num__placeholder').text(includedCount);
      $('.excluded-num__placeholder').text(excludedCount);
    }
  }
}
