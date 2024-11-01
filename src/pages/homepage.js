import User from '../User';
import Map from '../Map';

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
