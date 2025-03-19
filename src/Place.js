import Map from 'https://smediaapp.pages.dev/src/Map.js';
import Tool from 'https://smediaapp.pages.dev/src/Tool.js';

export default class Place {
  constructor() {
    this.displayedCities = new Set();
    this.pendingRequests = 0;
    this.map = new Map();
    this.tool = new Tool();

    // A queue to store each shape's request
    this.shapeQueue = [];
    // Flag to indicate if we're processing a shape right now
    this.isProcessing = false;

    // A single container for all notifications
    this.notificationWrapper = document.createElement('div');
    this.notificationWrapper.classList.add('notification-wrapper');
    document.body.appendChild(this.notificationWrapper);
  }

  processLayer(layer, shapeId, state, isZip) {
    // Enqueue shape info
    this.shapeQueue.push({ layer, shapeId, state, isZip });

    // If not already processing something, start now
    if (!this.isProcessing) {
      this.processNextShape();
    }
  }

  async processNextShape() {
    // No shapes left?
    if (this.shapeQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true; // We’re busy now

    // Get the next shape from the queue
    const { layer, shapeId, state, isZip } = this.shapeQueue.shift();

    // Process that shape fully (returns a Promise)
    await this._processSingleShape(layer, shapeId, state, isZip);

    // When done, move on to the next shape
    this.processNextShape();
  }

  _processSingleShape(layer, shapeId, state, isZip) {
    return new Promise((resolve, reject) => {
      let query = null;
      let isRecognized = false;

      // Build the Overpass query based on the shape type
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        isRecognized = true;
        let latlngs = layer.getLatLngs()[0];
        if (Array.isArray(latlngs[0])) {
          latlngs = latlngs[0];
        }

        const bbox = `${Math.min(...latlngs.map((c) => c.lat))},${Math.min(
          ...latlngs.map((c) => c.lng)
        )},${Math.max(...latlngs.map((c) => c.lat))},${Math.max(
          ...latlngs.map((c) => c.lng)
        )}`;

        if (isZip) {
          query = `
            [out:json];
            (
              node["place"~"city|town|village|neighbourhood|suburb"](${bbox});
            );
            out body;
          `;
        } else {
          query = `
            [out:json];
            (
              node["place"~"city|town|village"](${bbox});
            );
            out body;
          `;
        }
      } else if (layer instanceof L.Circle) {
        isRecognized = true;
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        query = `
          [out:json];
          (
            node["place"~"city|town|village"](around:${radius}, ${center.lat}, ${center.lng});
          );
          out body;
        `;
      } else if (layer instanceof L.GeoJSON) {
        isRecognized = true;
        const bounds = layer.getBounds();
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        query = `
          [out:json];
          (
            node["place"~"city|town|village"](${bbox});
          );
          out body;
        `;
      }

      // If shape is not recognized, just skip & resolve
      if (!isRecognized || !query) {
        console.warn('Unsupported or empty shape. Skipping.');
        resolve(); // Done processing this shape
        return;
      }

      // --- Create the shape-specific notification (only 1 at a time) ---
      const notification = document.createElement('div');
      notification.classList.add(
        'shape-notification',
        `shape-notification--${shapeId}`
      );
      notification.textContent = 'List is Generating...';

      // Append it into the wrapper
      this.notificationWrapper.appendChild(notification);

      // Actually do the Overpass fetch
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      })
        .then((response) => response.json())
        .then((data) => {
          const cities = data.elements.filter((el) => el.tags && el.tags.name);
          const citiesWrap = document.querySelector(
            `.states_wrap.${
              layer._path.classList.contains('excluded')
                ? 'excluded'
                : 'included'
            }`
          );

          // Process the returned places
          this.listPlaces(citiesWrap, cities, shapeId, state, notification)
            .then(() => resolve()) // Done with this shape
            .catch(() => resolve()); // or reject if you prefer
        })
        .catch((err) => {
          console.error('Error querying Overpass API:', err);
          notification.textContent = 'Error querying Overpass API.';
          setTimeout(() => {
            notification.remove();
            resolve();
          }, 3000);
        });
    });
  }

  async listPlaces(citiesWrap, cities, shapeId, stateName, notification) {
    return new Promise(async (resolve) => {
      if (citiesWrap && cities.length > 0) {
        const totalCities = cities.length;

        for (let i = 0; i < totalCities; i++) {
          const city = cities[i];
          console.log(city);
          const { tags } = city;
          const cityName = tags.name;
          let state;

          // (A) First fetch or set the state name
          if (tags.wikipedia) {
            state =
              tags.wikipedia.split(', ').length > 1
                ? tags.wikipedia.split(', ')[1]
                : tags.wikipedia.split(', ')[0].replaceAll('en:', '');
          } else {
            // Overpass query to fetch state
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
          }

          // (B) If a specific state was requested, skip if city is outside that state
          if (stateName && state !== stateName) {
            continue;
          }

          // (C) CHECK FOR DUPLICATES
          // Use any consistent unique key you like:
          // e.g. cityName + state or city.id or city.id + state
          const uniqueKey = `${cityName}--${state}`;
          if (this.displayedCities.has(uniqueKey)) {
            // Already listed - skip
            continue;
          }
          // Mark it as displayed
          this.displayedCities.add(uniqueKey);

          // (D) Create a new row in the citiesWrap
          const stateRow = document.createElement('div');
          stateRow.classList.add('state-row');
          stateRow.setAttribute('data-lat', city.lat);
          stateRow.setAttribute('data-lon', city.lon);
          stateRow.setAttribute('shapeId', shapeId);

          const stateNameText = document.createElement('div');
          stateNameText.classList.add('state-name-text');
          stateNameText.textContent = `${cityName}, ${state}`;

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

          stateRow.appendChild(stateNameText);
          stateRow.appendChild(svg);
          citiesWrap.appendChild(stateRow);

          // (E) Update progress for this shape
          const percentage = Math.round(((i + 1) / totalCities) * 100);
          notification.textContent = `List is generating - ${percentage}%`;
        }

        // Update placeholders
        document.querySelector('.included-num__placeholder').textContent =
          document.querySelectorAll('.states_wrap.included .state-row').length;
        document.querySelector('.excluded-num__placeholder').textContent =
          document.querySelectorAll('.states_wrap.excluded .state-row').length;
        document
          .querySelector('.excluded-included__section')
          .classList.remove('hidden');

        // Done - remove the notification or you can just say "Done!"
        notification.remove();
        resolve();
      } else {
        // No cities found
        if (notification.textContent !== 'List is generating - 100%') {
          notification.textContent = 'No cities found in this area.';
        }
        setTimeout(() => {
          notification.remove();
          resolve();
        }, 3000);
      }
    });
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
