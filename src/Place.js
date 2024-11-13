export default class Place {
    constructor() {
        this.displayedCities = new Set();
        this.pendingRequests = 0;
    }

    processLayer(layer) {
        let query;

        // Process polygons and rectangles
        if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            const latlngs = layer.getLatLngs()[0];
            const bbox = `${Math.min(...latlngs.map(c => c.lat))},${Math.min(...latlngs.map(c => c.lng))},${Math.max(...latlngs.map(c => c.lat))},${Math.max(...latlngs.map(c => c.lng))}`;
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
            console.warn('Unsupported layer type. Only polygon, rectangle, circle, and geoJSON are supported.');
            return;
        }

        this.pendingRequests++;
        this.sendOverpassQuery(query);
    }

    sendOverpassQuery(query) {
        fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
        })
            .then(response => response.json())
            .then(data => {
                const cities = data.elements.filter(el => el.tags && el.tags.name);
                const citiesWrapper = document.querySelector('.selected-cities__wrapper');

                if (citiesWrapper && cities.length > 0) {
                    cities.forEach(city => {
                        const cityName = city.tags.name;
                        if (!this.displayedCities.has(cityName)) {
                            this.displayedCities.add(cityName);

                            const cityContainer = document.createElement('div');
                            cityContainer.classList.add('selected-city');

                            const cityText = document.createElement('div');
                            cityText.classList.add('selected-city__text');
                            cityText.textContent = cityName;

                            const cityCheckbox = document.createElement('input');
                            cityCheckbox.type = 'checkbox';
                            cityCheckbox.classList.add('selected-city__checkbox');
                            cityCheckbox.checked = true;

                            cityContainer.appendChild(cityText);
                            cityContainer.appendChild(cityCheckbox);
                            citiesWrapper.appendChild(cityContainer);
                        }
                    });
                } else {
                    console.log('No cities found in this area.');
                }
            })
            .catch(err => {
                console.error('Error querying Overpass API:', err);
            })
            .finally(() => {
                this.pendingRequests--;
                if (this.pendingRequests === 0) {
                    document.querySelector('.blue-loader').classList.add('hidden');
                    toggleModal();
                }
            });
    }

    fetchPlacesFromAllShapes(e) {
        e.target.classList.remove('active');
        document.querySelector('.blue-loader').classList.remove('hidden');
        document.querySelector('.selected-cities__wrapper').innerHTML = '';

        this.pendingRequests = 0;
        this.displayedCities = new Set();

        window.drawnItems.eachLayer(this.processLayer.bind(this));
        window.nonEditableItems.eachLayer(this.processLayer.bind(this));
    }
}
