/**
 * THIS FILE HANDLES ALL REPETATIVE AND SMALL FUNCTIONS
 */

const icons = document.querySelectorAll(
  '.tool-wrapper .map-manipulation__icon'
);

function colorRandomizer() {
  let userColors = [
    '#CBE4F9',
    '#CDF5F6',
    '#EFF9DA',
    '#F9EBDF',
    '#F9D8D6',
    '#D6CDEA',
  ];

  return userColors[Math.floor(Math.random() * userColors.length)];
}

window.colorRandomizer = colorRandomizer;

// Add click event to map tool
icons.forEach(function (icon) {
  icon.addEventListener('click', function () {
    // Remove 'active' class from all .tool-wrapper elements
    document.querySelectorAll('.tool-wrapper').forEach(function (wrapper) {
      wrapper.classList.remove('active');
    });

    // Add 'active' class to the parent .tool-wrapper of the clicked icon
    this.closest('.tool-wrapper').classList.add('active');
  });
});

// Function to handle dropdown creation and visibility
function createDropdown(
  items,
  dropdown,
  input,
  isSelectedCity,
  dropdownItemClass,
  highlightColor = '#0c0b0e'
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
          zipDraw(itemData);
        });
      }

      // Handle city selection
      item.addEventListener('click', () => {
        itemData.onSelect(); // Draw the town circle on map
        if (isSelectedCity) {
          document
            .querySelector('.town-radius__dropdown')
            .classList.toggle('hidden');
        }

        // Here, we pass the specific cityInfo of the clicked item
        const selectedCityInfo = window.drawnCities.find(
          (city) => city.name === itemData.name
        );

        // Adjust the radius for the selected city
        if (selectedCityInfo) {
          setupRadiusAdjustment(selectedCityInfo);
        }

        input.value = itemData.name; // Set input value to selected city
        dropdown.style.display = 'none'; // Hide dropdown
        input.value = ''; // Clear input after selection
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
        if (item.classList.contains('selected-city')) {
          document
            .querySelector('.town-radius__dropdown')
            .classList.toggle('hidden');
        }

        // Here, we pass the specific cityInfo of the clicked item
        const selectedCityInfo = window.drawnCities.find(
          (city) => city.name === itemData.name
        );

        // Adjust the radius for the selected city
        if (selectedCityInfo) {
          setupRadiusAdjustment(selectedCityInfo);
        }

        input.value = itemData.name; // Set input value to selected city
        dropdown.style.display = 'none'; // Hide dropdown
        input.value = ''; // Clear input after selection
      });

      dropdown.appendChild(item);
    });
  }

  dropdown.style.display = items.length > 0 ? 'block' : 'none';
}

// Function to hide dropdown when clicking outside
function hideDropdownOnClick(dropdown, input) {
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

// Attach functions to the window object for global access
window.createDropdown = createDropdown;
window.hideDropdownOnClick = hideDropdownOnClick;

function disableTools() {
  if (map && map.dragging) {
    // Remove "active" class from all tool wrappers
    document.querySelectorAll('.tool-wrapper').forEach((wrapper) => {
      wrapper.classList.remove('active');
    });

    // Set the map to "hand" mode (replace with your map's hand mode function)
    map.dragging.enable(); // Enables dragging for "hand" mode if using Leaflet
    map.boxZoom.disable(); // Disable box zoom or other tools if enabled
    map.doubleClickZoom.enable(); // Enable double-click zoom for "hand" mode
  }
}

window.disableTools = disableTools;

function setupRadiusAdjustment(cityInfo) {
  const rangeInput = document.querySelector('.town-dropdown__range');
  const tooltip = document.querySelector('.town-radius__tooltip');

  rangeInput.value = cityInfo.radius; // Set initial value to current radius
  rangeInput.max = 50; // Max radius 50 miles
  rangeInput.min = 0; // Min radius 0 miles

  // Initialize tooltip position and content based on current radius
  tooltip.textContent = `${cityInfo.radius} mi`;
  updateTooltipPosition(rangeInput, tooltip);

  // Show the radius input and set event listener for change
  rangeInput.style.display = 'block'; // Ensure input is visible
  rangeInput.oninput = function () {
    const newRadiusMiles = parseInt(rangeInput.value);
    const newRadiusMeters = newRadiusMiles * 1609.34; // Convert miles to meters

    // Update circle radius on the map and radius in city info object
    cityInfo.circle.setRadius(newRadiusMeters);
    cityInfo.radius = newRadiusMiles;

    // Update tooltip content and position
    tooltip.textContent = `${newRadiusMiles} mi`;
    updateTooltipPosition(rangeInput, tooltip);
    updateButtonState();
  };
}

// Helper function to position the tooltip above the slider thumb
function updateTooltipPosition(rangeInput, tooltip) {
  // Width of the range input and tooltip
  const rangeWidth = rangeInput.offsetWidth;
  const tooltipWidth = tooltip.offsetWidth;

  // Calculate the thumb position based on the range value and width
  const thumbPosition = (rangeInput.value / rangeInput.max) * (rangeWidth - 20); // -20 to account for thumb width

  // Center the tooltip above the thumb
  tooltip.style.left = `${thumbPosition - tooltipWidth / 2 + 33}px`; // +10 centers it relative to the thumb
}

document.querySelector('.close-town__dropdown') &&
  document
    .querySelector('.close-town__dropdown')
    .addEventListener('click', function () {
      document.querySelector('.town-radius__dropdown').classList.add('hidden');
    });

// Function to remove a layer from both the map and the dropdown list
function removeLayer(layer) {
  // Check if the layer is part of drawnItems
  if (window.drawnItems.hasLayer(layer)) {
    window.drawnItems.removeLayer(layer);
  }

  // Check if the layer is part of nonEditableItems
  if (window.nonEditableItems.hasLayer(layer)) {
    window.nonEditableItems.removeLayer(layer);
  }

  // Also remove the layer from the map
  window.map.removeLayer(layer);

  // Remove the city from the drawnCities array if it matches the deleted layer
  window.drawnCities = window.drawnCities.filter(
    (cityInfo) => cityInfo.circle !== layer
  );

  updateButtonState();
}

window.removeLayer = removeLayer;

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
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

window.debounce = debounce;

function zipDraw(itemData) {
  const zipCode = itemData.name.match(/^\d+/)?.[0];
  const authToken = localStorage.getItem('authToken');

  if (zipCode) {
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

          boundaryPolygon
            .getElement()
            .classList.add('custom-polygon__searched');

          // Fit map bounds to the polygon and add to non-editable items
          map.fitBounds(boundaryPolygon.getBounds());
          window.nonEditableItems.addLayer(boundaryPolygon);
          updateButtonState();
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

function updateButtonState() {
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

window.updateButtonState = updateButtonState;

function toggleModal() {
  const overlay = document.querySelector('.overlay.homepage');
  const modal = document.querySelector('.selected-area__modal');

  if (overlay.style.display === 'block' && modal.style.display === 'block') {
    // Hide the overlay and modal
    overlay.style.opacity = '0';
    modal.style.opacity = '0';

    // Use a timeout to wait for the opacity transition before setting display to none
    setTimeout(() => {
      overlay.style.display = 'none';
      modal.style.display = 'none';
    }, 300); // Adjust based on your CSS transition duration
  } else {
    // Show the overlay and modal
    overlay.style.display = 'block';
    modal.style.display = 'block';

    // Force a reflow to apply the opacity transition
    setTimeout(() => {
      overlay.style.opacity = '1';
      modal.style.opacity = '1';
    }, 10);
  }
}

window.toggleModal = toggleModal;
