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
                    node["place"~"city|town"](${bbox});
                    way["place"~"city|town"](${bbox});
                    relation["place"~"city|town"](${bbox});
                );
                out body;`;
    } else if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      query = `
                [out:json];
                (
                    node["place"~"city|town"](around:${radius}, ${center.lat}, ${center.lng});
                    way["place"~"city|town"](around:${radius}, ${center.lat}, ${center.lng});
                    relation["place"~"city|town"](around:${radius}, ${center.lat}, ${center.lng});
                );
                out body;`;
    } else if (layer instanceof L.GeoJSON) {
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
        console.log(data);
        const cities = data.elements.filter(
          (el) => el.tags && el.type === 'node' && el.tags.name
        );
        console.log(cities);
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
      for (const city of cities) {
        const { tags } = city;

        // Check if the place is a "city" or "town"
        if (!tags.place || !['town', 'city'].includes(tags.place)) {
          continue;
        }

        const cityName = tags.name;
        let state;
        console.log(cityName);

        // Use Overpass API to fetch state information
        try {
          const query = `
            [out:json];
            is_in(${city.lat}, ${city.lon});
            area._[admin_level~"4"];
            out tags;
          `;
          const response = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
              query
            )}`
          );
          const data = await response.json();

          if (data.elements.length > 0) {
            // Find the most relevant administrative boundary
            const adminBoundary = data.elements.find(
              (element) => element.tags && element.tags.admin_level === '4'
            );
            state = adminBoundary?.tags?.name || 'State not found';
          } else {
            console.log(`No state found for ${cityName}.`);
            continue;
          }
        } catch (error) {
          console.error(`Error fetching state for ${cityName}:`, error);
          continue;
        }

        console.log(state);

        // Return if we are getting border places from another state
        if (
          typeof window.stateInputSearch !== 'undefined' &&
          state !== stateInputSearch
        ) {
          continue;
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
      }

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

  exportTable(filename = 'table-data.xlsx') {
    // Get the table element
    const table = document.getElementById('main-data-table');

    // Create a new workbook
    const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet 1' });

    // Write the workbook to a file with the provided filename
    XLSX.writeFile(wb, filename);
  }
}
