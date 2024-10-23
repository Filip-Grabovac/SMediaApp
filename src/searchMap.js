// Get references to the input and dropdown
const input = document.getElementById('state-input');
const dropdown = document.getElementById('state-dropdown');

// Function to filter states based on input
function filterStates(query) {
  return statesData.features.filter((state) =>
    state.properties.name.toLowerCase().includes(query.toLowerCase())
  );
}

// Function to create dropdown items
function createDropdownItems(states) {
  dropdown.innerHTML = ''; // Clear previous items
  states.forEach((state) => {
    const item = document.createElement('div');
    item.textContent = state.properties.name;
    item.className = 'dropdown-item';
    item.addEventListener('click', () => {
      drawStatePolygon(state);
      input.value = state.properties.name; // Set input value to the selected state
      dropdown.style.display = 'none'; // Hide dropdown
    });
    dropdown.appendChild(item);
  });
  dropdown.style.display = states.length > 0 ? 'block' : 'none'; // Show/hide dropdown
}

// Event listener for input
input.addEventListener('input', (event) => {
  const query = event.target.value;
  const filteredStates = filterStates(query);
  createDropdownItems(filteredStates);
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
      // This is where we can add custom classes safely
      if (layer instanceof L.Polygon) {
        layer.on('add', () => {
          L.DomUtil.addClass(layer._path, 'custom-polygon'); // Add class to the polygon
        });
      }
    },
  }).addTo(window.map); // Add to the global map variable

  // Add the polygon to the drawnItems FeatureGroup
  window.drawnItems.addLayer(polygon); // Ensure drawnItems is accessible globally

  // Optional: Center and zoom the map to the polygon
  const bounds = polygon.getBounds();
  window.map.fitBounds(bounds);
}

// Hide dropdown when clicking outside
document.addEventListener('click', (event) => {
  if (!dropdown.contains(event.target) && event.target !== input) {
    dropdown.style.display = 'none';
  }
});
