const zipInput = document.getElementById('zip-input');
const zipDropdown = document.getElementById('zip-dropdown');

zipInput.addEventListener('focus', () => {
  disableTools();
  document.querySelector('.town-radius__dropdown').classList.add('hidden');
});

zipInput.addEventListener(
  'input',
  debounce(async function () {
    const query = zipInput.value.trim();

    if (query.length < 3) {
      zipDropdown.innerHTML = ''; // Clear dropdown if query is too short
      zipDropdown.style.display = 'none'; // Hide dropdown
      return;
    }

    try {
      // Fetch matching locations based on the ZIP code
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${query}&countrycodes=us&format=json&addressdetails=1`
      );
      const results = await response.json();

      // Map results to format compatible with createDropdown
      const suggestions = results.map((location) => ({
        name: location.display_name,
        onSelect: () => {
          zipInput.value = location.display_name;
        },
      }));

      // Use createDropdown to populate the dropdown with fetched results
      createDropdown(
        suggestions,
        zipDropdown,
        zipInput,
        false,
        'zip-dropdown__link'
      );
    } catch (error) {
      console.error('Error fetching location data:', error);
      zipDropdown.style.display = 'none'; // Hide dropdown on error
    }
  }, 300) // 300 ms delay
);
