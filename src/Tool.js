export default class Tool {
  constructor(mapInstance, place) {
    this.mapInstance = mapInstance;
    this.disableActiveTool = this.disableActiveTool.bind(this);
    this.createDropdown = this.createDropdown.bind(this);
    this.updateTooltipPosition = this.updateTooltipPosition.bind(this);

    this.deleteMode = null;
    this.editMode = false;

    this.deleteElement = this.deleteElement.bind(this);
    this.drawElement = this.drawElement.bind(this);

    this.excludedBtn = document.querySelector('.option_button.exclude');
    this.place = place;
    this.drawCityBorder = this.drawCityBorder.bind(this);
  }

  disableActiveTool() {
    if (this.mapInstance.activeTool) {
      this.mapInstance.activeTool.disable();
      this.mapInstance.activeTool = null;
    }

    if (this.deleteMode) {
      this.deleteMode.disable();
      this.deleteMode = null;
    }

    if (this.editMode) {
      window.drawnItems.eachLayer(function (layer) {
        if (layer.editing) {
          layer.editing.disable();
        }
      });
      this.editMode = false;
    }

    document.querySelector('.town-radius__dropdown').classList.add('hidden');
  }

  deleteElement() {
    this.disableActiveTool();

    // Enable the delete mode, allowing users to click shapes for removal
    this.deleteMode = new L.EditToolbar.Delete(window.map, {
      featureGroup: window.drawnItems, // Include drawnItems for deletion
    });
    this.deleteMode.enable();

    // Listen for the 'click' event on each layer in drawnItems
    window.drawnItems.eachLayer((layer) => {
      // Use arrow function
      layer.on('click', () => {
        // Use arrow function here too
        this.removeLayer(layer); // 'this' now refers to the Map instance
      });
    });

    // Also listen for the 'click' event on each layer in nonEditableItems
    window.nonEditableItems.eachLayer((layer) => {
      // Use arrow function
      layer.on('click', () => {
        // Use arrow function here too
        this.removeLayer(layer); // 'this' now refers to the Map instance
      });
    });
  }

  removeLayer(layer) {
    // Check if the layer is part of drawnItems
    if (window.drawnItems.hasLayer(layer)) {
      window.drawnItems.removeLayer(layer);
    }

    // Check if the layer is part of nonEditableItems
    if (window.nonEditableItems.hasLayer(layer)) {
      window.nonEditableItems.removeLayer(layer);
    }

    // Remove the layer from the map
    window.map.removeLayer(layer);

    // Remove the city from the drawnCities array if it matches the deleted layer
    window.drawnCities = window.drawnCities.filter(
      (cityInfo) => cityInfo.circle !== layer
    );

    let shapeId;

    // Handle individual layers or groups
    if (layer._path) {
      // Single shape (e.g., a polygon, rectangle, or circle)
      shapeId = layer.shapeId || layer._path.getAttribute('shapeId');
    } else if (layer._layers) {
      // Grouped layers (e.g., GeoJSON with multiple features)
      Object.values(layer._layers).forEach((subLayer) => {
        if (subLayer._path) {
          shapeId = subLayer.shapeId || subLayer._path.getAttribute('shapeId');
          // Perform any cleanup for subLayer here if needed
        }
      });
    }

    if (shapeId) {
      // Find and remove all state-row elements with the same shapeId
      const rows = document.querySelectorAll(
        `.state-row[shapeId="${shapeId}"]`
      );
      rows.forEach((row) => row.remove());
    }

    // Update the placeholders for included and excluded items
    document.querySelector('.included-num__placeholder').textContent =
      document.querySelectorAll('.states_wrap.included .state-row').length;
    document.querySelector('.excluded-num__placeholder').textContent =
      document.querySelectorAll('.states_wrap.excluded .state-row').length;

    this.mapInstance.updateButtonState();
  }

  drawElement(element, place) {
    const layer = element.layer;

    // Generate a unique shapeId
    const shapeId = `shape-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Add the layer to the FeatureGroup
    window.drawnItems.addLayer(layer);
    this.mapInstance.updateButtonState();

    // Add a custom class and shapeId attribute based on the shape type
    if (element.layerType === 'polygon') {
      L.DomUtil.addClass(layer._path, 'custom-polygon'); // Add class to polygon
    } else if (element.layerType === 'rectangle') {
      L.DomUtil.addClass(layer._path, 'custom-rectangle'); // Add class to rectangle
    } else if (element.layerType === 'circle') {
      L.DomUtil.addClass(layer._path, 'custom-circle'); // Add class to circle
    }

    // Assign the unique shapeId to the layer
    layer._path.setAttribute('shapeId', shapeId);

    if (this.excludedBtn.classList.contains('active')) {
      L.DomUtil.addClass(layer._path, 'excluded');
    }

    // Remove 'active' class from all .tool-wrapper elements when shape drawing is finished
    document.querySelectorAll('.tool-wrapper').forEach(function (wrapper) {
      wrapper.classList.remove('active');
    });

    // Save shapeId to layer for reference
    layer.shapeId = shapeId;

    place.processLayer(layer, shapeId);
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
            this.mapInstance.updateButtonState();
          });
        }
      });
      this.editMode = true; // Set edit mode state
    }
  }

  drawTownCircleOLD(cityData, place) {
    const lat = cityData.lat;
    const lon = cityData.lon;
    const shapeId = `shape-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

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
    this.mapInstance.updateButtonState();

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
      pathElement.setAttribute('shapeId', shapeId);
      if (this.excludedBtn.classList.contains('active')) {
        L.DomUtil.addClass(pathElement, 'excluded');
      }
    }

    // Process the circle with the provided shapeId
    place.processLayer(circle, shapeId);
  }

  drawCityBorder(cityData, place, updateButtonState) {
    // Extract the name and osm_id from cityData
    const { name, osm_id } = cityData;

    // Generate a unique shapeId for this city boundary
    const shapeId = `shape-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Fetch the city's boundary from Nominatim API (using the name extracted)
    const url = `https://nominatim.openstreetmap.org/search?q=${name}&format=json&addressdetails=1&polygon_geojson=1`;

    // Fetch the data
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          const geoJson = data[0].geojson; // Get the GeoJSON for the city boundary

          // Create a GeoJSON layer for the city boundary polygon
          const polygon = L.geoJSON(geoJson, {
            style: {
              color: 'blue', // Set polygon color
              weight: 2,
            },
            onEachFeature: (feature, layer) => {
              if (layer instanceof L.Polygon) {
                // Add class and shapeId when the layer is added to the map
                layer.on('add', () => {
                  L.DomUtil.addClass(layer._path, 'custom-circle__searched'); // Add class to the polygon
                  layer._path.setAttribute('shapeId', shapeId); // Set the shapeId attribute

                  // Optionally, handle exclusions
                  if (this.excludedBtn.classList.contains('active')) {
                    L.DomUtil.addClass(layer._path, 'excluded');
                  }
                });

                // Call `processLayer` method on the place object (if required)
                place.processLayer(layer, shapeId);
              }
            },
          }).addTo(window.map); // Add to the global map variable

          // Add the polygon to the drawnItems FeatureGroup (if needed)
          window.nonEditableItems.addLayer(polygon);

          // Center and zoom the map to the polygon's bounds
          const bounds = polygon.getBounds();
          window.map.fitBounds(bounds); // Fit the map to the boundary

          // Optionally, update the button state after drawing
          updateButtonState();
        } else {
          console.error('City boundary data not found or unavailable.');
        }
      })
      .catch((error) => {
        console.error('Error fetching city boundary:', error);
      });
  }

  drawState(state, map) {
    const shapeId = `shape-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

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
            layer._path.setAttribute('shapeId', shapeId);
            layer._path.setAttribute('state', window.stateInputSearch);

            if (this.excludedBtn.classList.contains('active')) {
              L.DomUtil.addClass(layer._path, 'excluded');
            }
          });
          console.log(state);
          this.place.processLayer(layer, shapeId, state);
        }
      },
    }).addTo(window.map); // Add to the global map variable

    window.nonEditableItems.addLayer(polygon); // Add the polygon to the drawnItems FeatureGroup
    map.updateButtonState();

    const bounds = polygon.getBounds();
    window.map.fitBounds(bounds); // Center and zoom the map to the polygon
  }

  createDropdown(
    items,
    dropdown,
    input,
    isSelectedCity,
    dropdownItemClass,
    highlightColor = '#0c0b0e',
    place
  ) {
    dropdown.innerHTML = ''; // Clear previous items
    const query = input.value.trim(); // Get current input value

    if (query.length > 0) {
      const regex = new RegExp(`(${query})`, 'gi'); // Case-insensitive regex for matching query

      items.forEach((itemData) => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.classList.add(dropdownItemClass);

        const parts = itemData.name.split(regex);

        parts.forEach((part) => {
          const span = document.createElement('span');
          if (part.toLowerCase() === query.toLowerCase()) {
            span.style.color = highlightColor;
            span.textContent = part;
          } else {
            span.textContent = part;
          }
          item.appendChild(span);
        });

        if (item.classList.contains('zip-dropdown__link')) {
          item.addEventListener('click', () => {
            this.zipDraw(itemData, place);
          });
        }

        // Handle city selection
        item.addEventListener('click', () => {
          // if (isSelectedCity) {
          //   document
          //     .querySelector('.town-radius__dropdown')
          //     .classList.toggle('hidden');
          // }

          // Here, we pass the specific cityInfo of the clicked item
          const selectedCityInfo = window.drawnCities.find(
            (city) => city.name === itemData.name
          );

          // Adjust the radius for the selected city
          if (selectedCityInfo) {
            this.setupRadiusAdjustment(selectedCityInfo);
          }

          if (item.classList.contains('state-dropdown__link')) {
            // Get the full text content of the element
            let stateInputSearch = item.textContent.trim(); // Remove any leading/trailing whitespace

            // Save it to the window object
            window.stateInputSearch = stateInputSearch;
          }

          itemData.onSelect();

          input.value = itemData.name;
          dropdown.style.display = 'none';
          input.value = '';
        });

        dropdown.appendChild(item);
      });
    } else {
      items.forEach((itemData) => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        if (isSelectedCity) item.classList.add('selected-city');
        item.textContent = itemData.name;

        item.addEventListener('click', () => {
          itemData.onSelect(); // Draw the town circle on map

          // if (item.classList.contains('selected-city')) {
          //   document
          //     .querySelector('.town-radius__dropdown')
          //     .classList.toggle('hidden');
          // }

          // Here, we pass the specific cityInfo of the clicked item
          const selectedCityInfo = window.drawnCities.find(
            (city) => city.name === itemData.name
          );

          // Adjust the radius for the selected city
          if (selectedCityInfo) {
            this.setupRadiusAdjustment(selectedCityInfo);
          }

          input.value = itemData.name;
          dropdown.style.display = 'none';
          input.value = '';
        });

        dropdown.appendChild(item);
      });
    }

    dropdown.style.display = items.length > 0 ? 'block' : 'none';
  }

  setupRadiusAdjustment(cityInfo) {
    const rangeInput = document.querySelector('.town-dropdown__range');
    const tooltip = document.querySelector('.town-radius__tooltip');

    rangeInput.value = cityInfo.radius; // Set initial value to current radius
    rangeInput.max = 50; // Max radius 50 miles
    rangeInput.min = 0; // Min radius 0 miles

    // Initialize tooltip position and content based on current radius
    tooltip.textContent = `${cityInfo.radius} mi`;
    this.updateTooltipPosition(rangeInput, tooltip);

    // Show the radius input and set event listener for change
    rangeInput.style.display = 'block'; // Ensure input is visible
    rangeInput.oninput = () => {
      // Use arrow function to preserve 'this'
      const newRadiusMiles = parseInt(rangeInput.value);
      const newRadiusMeters = newRadiusMiles * 1609.34; // Convert miles to meters

      // Update circle radius on the map and radius in city info object
      cityInfo.circle.setRadius(newRadiusMeters);
      cityInfo.radius = newRadiusMiles;

      // Update tooltip content and position
      tooltip.textContent = `${newRadiusMiles} mi`;
      this.updateTooltipPosition(rangeInput, tooltip);
      this.mapInstance.updateButtonState();
    };
  }

  updateTooltipPosition(rangeInput, tooltip) {
    // Width of the range input and tooltip
    const rangeWidth = rangeInput.offsetWidth;
    const tooltipWidth = tooltip.offsetWidth;

    // Calculate the thumb position based on the range value and width
    const thumbPosition =
      (rangeInput.value / rangeInput.max) * (rangeWidth - 20); // -20 to account for thumb width

    // Center the tooltip above the thumb
    tooltip.style.left = `${thumbPosition - tooltipWidth / 2 + 33}px`; // +10 centers it relative to the thumb
  }

  zipDraw(itemData, place) {
    console.log(itemData);

    const zipCode = itemData.name.match(/^\d+/)?.[0];
    const authToken = localStorage.getItem('authToken');

    if (zipCode) {
      // Generate unique shapeId
      const shapeId = `shape-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Fetch ZIP code boundary data from Xano
      fetch(
        `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/get_zip_geojson?zipCode=${zipCode}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              'Network response was not ok: ' + response.statusText
            );
          }
          return response.json();
        })
        .then((data) => {
          // Check if the response has the expected structure
          if (
            data.response &&
            data.response.result &&
            data.response.result.features &&
            data.response.result.features.length > 0
          ) {
            // Extract coordinates from the response
            const coordinates =
              data.response.result.features[0].geometry.coordinates[0];

            // Convert coordinates to [latitude, longitude] format for Leaflet
            const latLngs = coordinates.map((coord) => [coord[1], coord[0]]);

            // Create and add polygon to the map
            const boundaryPolygon = L.polygon(latLngs, {
              color: 'blue',
              fillColor: '#3388ff',
              fillOpacity: 0.3,
            }).addTo(map);

            // Add class and set shapeId for the polygon element
            boundaryPolygon
              .getElement()
              .classList.add('custom-polygon__searched');
            boundaryPolygon.getElement().setAttribute('shapeId', shapeId);

            if (this.excludedBtn.classList.contains('active')) {
              boundaryPolygon.getElement().classList.add('excluded');
            }

            // Process the layer using the shapeId
            place.processLayer(boundaryPolygon, shapeId);

            // Fit map bounds to the polygon and add to non-editable items
            map.fitBounds(boundaryPolygon.getBounds());
            window.nonEditableItems.addLayer(boundaryPolygon);
          } else {
            console.error('No features found in the response data');
          }
        })
        .catch((error) => {
          console.error('Error fetching ZIP code boundaries from Xano:', error);
        });
    } else {
      console.error('ZIP code not found in itemData name');
    }
  }

  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId); // Clear the previous timeout
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args); // Call the original function with the latest arguments
      }, delay);
    };
  }

  showNotification(text, manual) {
    const notificationText = localStorage.getItem('notification') || text;

    if (notificationText) {
      const notificationElement = document.querySelector('.notification');

      if (notificationElement) {
        notificationElement.textContent = notificationText;

        notificationElement.classList.remove('hidden');

        localStorage.removeItem('notification');

        if (!manual) {
          setTimeout(() => {
            notificationElement.classList.add('hidden');
          }, 3500);
        }
      } else {
        console.error('Notification element not found in DOM.');
      }
    }
  }
}
