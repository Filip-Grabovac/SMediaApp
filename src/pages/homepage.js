// import User from '../User';
// import Map from '../Map';

import User from 'https://cdn.jsdelivr.net/gh/Filip-Grabovac/SMediaApp@56dff5fda28e80921ff40eb28e5a7c9e58d4811b/src/User.js';
import Map from 'https://cdn.jsdelivr.net/gh/Filip-Grabovac/SMediaApp@56dff5fda28e80921ff40eb28e5a7c9e58d4811b/src/Map.js';

const user = new User();
const map = new Map();

const logoutBtn = document.querySelector('.logout-btn');
const townInput = document.getElementById('town-input');
const townDropdown = document.getElementById('town-dropdown');
const searchArrow = document.querySelector('.search-input__arrow');

window.drawnCities = [];

user.authenticate();

logoutBtn.addEventListener('click', function (event) {
  event.preventDefault();

  user.logOut();
});

townInput.addEventListener('focus', () => {
  disableTools();
  document.querySelector('.town-radius__dropdown').classList.add('hidden');
});

townInput.addEventListener(
  'input',
  debounce((event) => {
    const query = event.target.value;
    if (query === '') {
      townDropdown.innerHTML = ''; // Clear the dropdown if the query is empty
      townDropdown.style.display = 'none'; // Hide dropdown
      return;
    }

    map.fetchCitySuggestions(query, townInput, townDropdown);
  }, 300)
);

searchArrow.addEventListener('click', () => {
  map.showDrawnCities(townDropdown, townInput);
});

// Fix later
hideDropdownOnClick(townDropdown, townInput);
