// Get references to the input and dropdown
const input = document.getElementById('state-input');
const dropdown = document.getElementById('state-dropdown');

input.addEventListener('focus', () => {
  disableTools();
  document.querySelector('.town-radius__dropdown').classList.add('hidden');
});

// Function to filter states based on input
function filterStates(query) {
  return statesData.features.filter((state) =>
    state.properties.name.toLowerCase().includes(query.toLowerCase())
  );
}

// Event listener for input
input.addEventListener('input', (event) => {
  const query = event.target.value;
  if (query === '') {
    dropdown.innerHTML = '';
    return;
  }

  const filteredStates = filterStates(query);
  const dropdownItems = filteredStates.map((state) => ({
    name: state.properties.name,
    onSelect: () => drawStatePolygon(state), // Define the action on selection
  }));
  createDropdown(dropdownItems, dropdown, input, false, "state-dropdown__link"); // Use the reusable function

  disableTools();
});

// Function to draw the polygon on the map
function drawStatePolygon(state) {
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

// Hide dropdown when clicking outside
hideDropdownOnClick(dropdown, input);
