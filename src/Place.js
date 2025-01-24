// import Map from './Map';
// import Tool from './Tool';

import Map from 'https://smediaapp.pages.dev/src/Map.js';
import Tool from 'https://smediaapp.pages.dev/src/Tool.js';

export default class Place {
  constructor() {
    this.displayedCities = new Set();
    this.pendingRequests = 0;
    this.map = new Map();
    this.tool = new Tool();
  }

  processLayer(layer, shapeId) {
    this.tool.showNotification('List is Generating', true);
    let query;

    // Process polygons and rectangles
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      let latlngs = layer.getLatLngs()[0];

      // If it's array inside array, take it out (we need flat array)
      if (Array.isArray(latlngs[0])) {
        latlngs = latlngs[0];
      }

      const bbox = `${Math.min(...latlngs.map((c) => c.lat))},${Math.min(
        ...latlngs.map((c) => c.lng)
      )},${Math.max(...latlngs.map((c) => c.lat))},${Math.max(
        ...latlngs.map((c) => c.lng)
      )}`;

      query = `
                [out:json];
                (
                    node["place"~"city|town|village"](${bbox});
                    way["place"~"city|town|village"](${bbox});
                    relation["place"~"city|town|village"](${bbox});
                );
                out body;`;
    } else if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      query = `
                [out:json];
                (
                    node["place"~"city|town|village"](around:${radius}, ${center.lat}, ${center.lng});
                    way["place"~"city|town|village"](around:${radius}, ${center.lat}, ${center.lng});
                    relation["place"~"city|town|village"](around:${radius}, ${center.lat}, ${center.lng});
                );
                out body;`;
    } else if (layer instanceof L.GeoJSON) {
      const bounds = layer.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      query = `
                [out:json];
                (
                    node["place"~"city|town|village"](${bbox});
                    way["place"~"city|town|village"](${bbox});
                    relation["place"~"city|town|village"](${bbox});
                );
                out body;`;
    } else {
      console.warn(
        'Unsupported layer type. Only polygon, rectangle, circle, and geoJSON are supported.'
      );
      return;
    }

    this.pendingRequests++;
    this.sendOverpassQuery(query, shapeId, layer);
  }

  sendOverpassQuery(query, shapeId, layer) {
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
      .then((response) => response.json())
      .then((data) => {
        const cities = data.elements.filter(
          (el) => el.tags && el.type === 'node' && el.tags.name
        );
        // Check if new drawn shape needs to be added to incuded or excluded section
        const excludeButton = document.querySelector('.option_button.exclude');
        const citiesWrap = document.querySelector(
          `.states_wrap.${
            layer._path.classList.contains('excluded') ? 'excluded' : 'included'
          }`
        );

        this.listPlaces(citiesWrap, cities, shapeId);
      })
      .catch((err) => {
        console.error('Error querying Overpass API:', err);
      });
  }

  async listPlaces(citiesWrap, cities, shapeId) {
    if (citiesWrap && cities.length > 0) {
      const promises = cities.map(async (city) => {
        const { tags } = city;

        console.log(city);

        // Check if the place is a "city" or "town"
        if (!tags.place || !['town', 'city'].includes(tags.place)) {
          return;
        }

        const cityName = tags.name;
        let state;

        // Check if "wikipedia" is available
        if (tags.wikipedia) {
          state =
            tags.wikipedia.split(', ').length > 1
              ? tags.wikipedia.split(', ')[1]
              : tags.wikipedia.split(', ')[0].replaceAll('en:', '');
        } else {
          // Fetch state using Nominatim if "wikipedia" is missing
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                cityName
              )}&format=json&addressdetails=1`
            );
            const data = await response.json();

            if (data.length > 0) {
              // Find the closest place
              const closestPlace = data.reduce((closest, current) => {
                const currentDistance = this.getDistance(
                  city.lat,
                  city.lon,
                  parseFloat(current.lat),
                  parseFloat(current.lon)
                );
                const closestDistance = closest
                  ? this.getDistance(
                      city.lat,
                      city.lon,
                      parseFloat(closest.lat),
                      parseFloat(closest.lon)
                    )
                  : Infinity;

                return currentDistance < closestDistance ? current : closest;
              }, null);

              if (closestPlace) {
                state = closestPlace.address?.state || 'State not found';
              } else {
                console.log(`No closest state found for ${cityName}.`);
                return;
              }
            } else {
              console.log(`No state found for ${cityName}.`);
              return;
            }
          } catch (error) {
            console.error(`Error fetching state for ${cityName}:`, error);
            return;
          }
        }

        // Return if we are getting border places from another state
        if (
          typeof window.stateInputSearch !== 'undefined' &&
          state !== stateInputSearch
        ) {
          return;
        }

        // Create a new state-row element
        const stateRow = document.createElement('div');
        stateRow.classList.add('state-row');

        stateRow.setAttribute('data-lat', city.lat);
        stateRow.setAttribute('data-lon', city.lon);

        stateRow.setAttribute('shapeId', shapeId);

        // Create a div for the city name
        const stateNameText = document.createElement('div');
        stateNameText.classList.add('state-name-text');
        stateNameText.textContent = `${cityName}, ${state}`; // Add city name

        // Create the SVG element for the toggle arrow
        const svg = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', '0 0 12 18');
        svg.setAttribute('fill', 'none');
        svg.classList.add('toggle-arrow-svg');
        svg.innerHTML = `
                          <path d="M11.7578 12.393L7.67002 8.30518L6.96489 9.01031L10.4374 12.4828H0V13.4806H10.4374L6.96489 16.9531L7.67002 17.6582L11.7578 13.5704C12.0805 13.2478 12.0805 12.7189 11.7578 12.393Z" fill="currentColor"></path>
                          <path d="M0.242183 5.60752L4.32998 9.69531L5.03511 8.99018L1.56265 5.51771L12 5.51771V4.51988L1.56265 4.51988L5.03511 1.04741L4.32998 0.342276L0.242183 4.43007C-0.0804501 4.75271 -0.0804501 5.28156 0.242183 5.60752Z" fill="currentColor"></path>
                      `;

        // Append the name text and SVG to the state-row
        stateRow.appendChild(stateNameText);
        stateRow.appendChild(svg);

        // Append the state-row to the citiesWrap container
        citiesWrap.appendChild(stateRow);
      });

      // Wait for all promises to complete
      await Promise.all(promises);

      // Update the placeholders and show the section only after all cities are listed
      document.querySelector('.included-num__placeholder').textContent =
        document.querySelectorAll('.states_wrap.included .state-row').length;
      document.querySelector('.excluded-num__placeholder').textContent =
        document.querySelectorAll('.states_wrap.excluded .state-row').length;
      document
        .querySelector('.excluded-included__section')
        .classList.remove('hidden');

      document.querySelector('.notification').classList.add('hidden');
    } else {
      console.log('No cities found in this area.');
    }
  }

  // Haversine formula to calculate distance between two lat/lon coordinates
  getDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const R = 6371; // Radius of Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  searchIncludedExcludedPlaces(inputSelector, wrapperSelector) {
    const inputElement = document.querySelector(inputSelector);
    const wrapperElement = document.querySelector(wrapperSelector);

    if (inputElement && wrapperElement) {
      inputElement.addEventListener('input', () => {
        const searchValue = inputElement.value.toLowerCase();
        const stateRows = wrapperElement.querySelectorAll('.state-row');

        stateRows.forEach((row) => {
          const stateName =
            row.querySelector('.state-name-text')?.textContent.toLowerCase() ||
            '';
          // Show or hide based on matching text
          row.style.display = stateName.includes(searchValue) ? 'flex' : 'none';
        });
      });
    } else {
      console.warn(
        `Elements not found for selectors: ${inputSelector}, ${wrapperSelector}`
      );
    }
  }

  exportTable() {
    // Get the table element
    const table = document.getElementById('main-data-table');
    let csvContent = '';

    // Loop through each row in the table
    for (const row of table.rows) {
      const cells = Array.from(row.cells).map(
        (cell) => cell.textContent.replace(/"/g, '').trim() // Remove all double quotes and trim spaces
      );
      csvContent += cells.join(',') + '\n'; // Join cells with a comma and add a new line
    }

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv'; // File name for the CSV
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
