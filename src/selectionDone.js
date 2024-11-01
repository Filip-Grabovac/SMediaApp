const selectionDoneButton = document.querySelector(
  '.main-button.submit-selection'
);

selectionDoneButton.addEventListener('click', (e) => {
  fetchPlacesFromAllShapes(e);
});

function fetchPlacesFromAllShapes(e) {
  e.target.classList.remove('active');
  document.querySelector('.blue-loader').classList.remove('hidden');
  document.querySelector('.selected-cities__wrapper').innerHTML = '';

  let pendingRequests = 0; // Counter for pending API requests
  const displayedCities = new Set(); // Set to keep track of displayed city names

  // Define a reusable function to handle each layer type and send the Overpass API query
  function processLayer(layer) {
    let query;

    // Process polygons and rectangles
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      const latlngs = layer.getLatLngs()[0]; // Get the boundary points

      // Create a bounding box from the polygon/rectangle
      const bbox = `${Math.min(...latlngs.map((c) => c.lat))},${Math.min(
        ...latlngs.map((c) => c.lng)
      )},${Math.max(...latlngs.map((c) => c.lat))},${Math.max(
        ...latlngs.map((c) => c.lng)
      )}`;

      // Construct Overpass API query for bounding box
      query = `
        [out:json];
        (
          node["place"~"city|town"](${bbox});
          way["place"~"city|town"](${bbox});
          relation["place"~"city|town"](${bbox});
        );
        out body;`;
    } else if (layer instanceof L.Circle) {
      // Process circles
      const center = layer.getLatLng();
      const radius = layer.getRadius();

      // Construct Overpass API query for circle
      query = `
        [out:json];
        (
          node["place"~"city|town"](around:${radius}, ${center.lat}, ${center.lng});
          way["place"~"city|town"](around:${radius}, ${center.lat}, ${center.lng});
          relation["place"~"city|town"](around:${radius}, ${center.lat}, ${center.lng});
        );
        out body;`;
    } else if (layer instanceof L.GeoJSON) {
      // Process geoJSON layers
      const bounds = layer.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

      query = `
        [out:json];
        (
          node["place"~"city|town"](${bbox});
          way["place"~"city|town"](${bbox});
          relation["place"~"city|town"](${bbox});
        );
        out body;`;
    } else {
      console.warn(
        'Unsupported layer type. Only polygon, rectangle, circle, and geoJSON are supported.'
      );
      return;
    }

    pendingRequests++; // Increment counter for each layer
    sendOverpassQuery(query);
  }

  // Fetch places for all drawn items and non-editable items
  window.drawnItems.eachLayer(processLayer);
  window.nonEditableItems.eachLayer(processLayer);

  // Function to send the Overpass API query and handle results
  function sendOverpassQuery(query) {
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
      .then((response) => response.json())
      .then((data) => {
        // Filter and log city names
        const cities = data.elements.filter((el) => el.tags && el.tags.name);
        const citiesWrapper = document.querySelector(
          '.selected-cities__wrapper'
        );

        if (cities.length > 0) {
          cities.forEach((city) => {
            const cityName = city.tags.name;

            // Check if the city has already been displayed
            if (!displayedCities.has(cityName)) {
              // Mark the city as displayed
              displayedCities.add(cityName);

              // Create main city container div
              const cityContainer = document.createElement('div');
              cityContainer.classList.add('selected-city');

              // Create city text div
              const cityText = document.createElement('div');
              cityText.classList.add('selected-city__text');
              cityText.textContent = cityName; // Set the city name

              // Create checkbox input
              const cityCheckbox = document.createElement('input');
              cityCheckbox.type = 'checkbox';
              cityCheckbox.classList.add('selected-city__checkbox');
              cityCheckbox.checked = true;

              // Append text and checkbox to the city container
              cityContainer.appendChild(cityText);
              cityContainer.appendChild(cityCheckbox);

              // Append the city container to the wrapper
              citiesWrapper.appendChild(cityContainer);
            }
          });
        } else {
          console.log('No cities found in this area.');
        }
      })
      .catch((err) => {
        console.error('Error querying Overpass API:', err);
      })
      .finally(() => {
        pendingRequests--; // Decrement counter after each request completes
        if (pendingRequests === 0) {
          document.querySelector('.blue-loader').classList.add('hidden'); // Show loader when all requests are done
          toggleModal();
        }
      });
  }
}

document.querySelector('.close-modal').addEventListener('click', () => {
  toggleModal();
});
document.querySelector('.overlay.homepage').addEventListener('click', () => {
  toggleModal();
});
