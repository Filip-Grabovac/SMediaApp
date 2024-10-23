function loadClientMap(geojson) {
  // Initialize the map
  window.map = L.map('map', { zoomControl: false }).setView([37.8, -96], 4); // Centered over the US, default zoom control disabled

  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(window.map);

  // Create a FeatureGroup to store the drawn shapes
  window.drawnItems = new L.FeatureGroup();
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
  window.map.addControl(drawControl); // This will now manage the editing but show no default draw or edit tools

  // Function to draw the map based on the provided GeoJSON
  function drawGeoJSONMap(geojson) {
    L.geoJSON(geojson).addTo(window.map);
  }

  // Handle GeoJSON data
  if (geojson) {
    if (Object.keys(geojson).length !== 0) {
      drawGeoJSONMap(geojson);
    }
  }

  // Store the currently active drawing tool and delete tool
  let activeTool = null;
  let deleteMode = null;
  let editMode = false; // Track if edit mode is active

  // Disable the active tool (if any)
  function disableActiveTool() {
    if (activeTool) {
      activeTool.disable();
      activeTool = null;
    }
    if (deleteMode) {
      deleteMode.disable(); // Disable delete mode if it's active
      deleteMode = null;
    }
    if (editMode) {
      window.drawnItems.eachLayer(function (layer) {
        if (layer.editing) {
          layer.editing.disable(); // Disable editing for each layer in the FeatureGroup
        }
      });
      editMode = false; // Reset edit mode state
    }
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
  document.getElementById('polygon').addEventListener('click', function () {
    disableActiveTool(); // Disable the previous tool
    activeTool = new L.Draw.Polygon(window.map); // Activate the new tool
    activeTool.enable();
  });

  // Square (Rectangle) draw control
  document.getElementById('square').addEventListener('click', function () {
    disableActiveTool(); // Disable the previous tool
    activeTool = new L.Draw.Rectangle(window.map); // Activate the new tool
    activeTool.enable();
  });

  // Circle draw control
  document.getElementById('circle').addEventListener('click', function () {
    disableActiveTool(); // Disable the previous tool
    activeTool = new L.Draw.Circle(window.map); // Activate the new tool
    activeTool.enable();
  });

  // Custom trash control to delete shapes by selecting them
  document.getElementById('trash').addEventListener('click', function () {
    disableActiveTool(); // Disable any active draw tools

    // Enable the delete mode, allowing users to click shapes for removal
    deleteMode = new L.EditToolbar.Delete(window.map, {
      featureGroup: window.drawnItems,
    });
    deleteMode.enable();

    // Listen for the 'click' event on each layer in drawnItems
    window.drawnItems.eachLayer(function (layer) {
      layer.on('click', function () {
        // Remove the clicked shape from drawnItems
        window.drawnItems.removeLayer(layer);
      });
    });
  });

  // Handle the draw:created event to keep the drawn shapes on the map
  window.map.on(L.Draw.Event.CREATED, function (e) {
    const layer = e.layer;

    // Add the layer to the FeatureGroup
    window.drawnItems.addLayer(layer);

    // Add a custom class based on the shape type
    if (e.layerType === 'polygon') {
      L.DomUtil.addClass(layer._path, 'custom-polygon'); // Add class to polygon
    } else if (e.layerType === 'rectangle') {
      L.DomUtil.addClass(layer._path, 'custom-rectangle'); // Add class to rectangle
    } else if (e.layerType === 'circle') {
      L.DomUtil.addClass(layer._path, 'custom-circle'); // Add class to circle
    }

    // ** Remove 'active' class from all .tool-wrapper elements when shape drawing is finished **
    document.querySelectorAll('.tool-wrapper').forEach(function (wrapper) {
      wrapper.classList.remove('active');
    });
  });

  // Custom edit control to enable or disable editing for all layers
  document.getElementById('edit').addEventListener('click', function () {
    if (editMode) {
      // If already in edit mode, disable it
      window.drawnItems.eachLayer(function (layer) {
        if (layer.editing) {
          layer.editing.disable(); // Disable editing for each layer in the FeatureGroup
        }
      });
      editMode = false; // Reset edit mode state
    } else {
      // Enable edit mode
      window.drawnItems.eachLayer(function (layer) {
        if (!layer.editing) return;
        layer.editing.enable(); // Enable editing for each layer in the FeatureGroup
      });
      editMode = true; // Set edit mode state
    }
  });
}

// Expose the function to the global window object
window.loadClientMap = loadClientMap;
