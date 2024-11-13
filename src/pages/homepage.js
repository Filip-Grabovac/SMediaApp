// import User from '../User';
// import Map from '../Map';
// import Place from '../Place';

const user = new User();
const map = new Map();
const place = new Place();

const logoutBtn = document.querySelector('.logout-btn');
const townInput = document.getElementById('town-input');
const townDropdown = document.getElementById('town-dropdown');
const searchArrow = document.querySelector('.search-input__arrow');

const stateInput = document.getElementById('state-input');
const stateDropdown = document.getElementById('state-dropdown');

const zipInput = document.getElementById('zip-input');
const zipDropdown = document.getElementById('zip-dropdown');

const selectionDoneButton = document.querySelector(
  '.main-button.submit-selection'
);

window.drawnCities = [];

user.authenticate();

logoutBtn.addEventListener('click', function (event) {
  event.preventDefault();

  user.logOut();
});

/**
 * TOWN/CITY
 */

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

/**
 * STATE
 */

stateInput.addEventListener('focus', () => {
  disableTools();
  document.querySelector('.town-radius__dropdown').classList.add('hidden');
});

function filterStates(query) {
  return statesData.features.filter((state) =>
    state.properties.name.toLowerCase().includes(query.toLowerCase())
  );
}

// Event listener for state input
stateInput.addEventListener('input', (event) => {
  const query = event.target.value;
  if (query === '') {
    dropdown.innerHTML = '';
    return;
  }

  const filteredStates = filterStates(query);
  const dropdownItems = filteredStates.map((state) => ({
    name: state.properties.name,
    onSelect: () => map.drawState(state), // Define the action on selection
  }));
  createDropdown(
    dropdownItems,
    stateDropdown,
    stateInput,
    false,
    'state-dropdown__link'
  ); // Use the reusable function

  disableTools();
});

/**
 * ZIP
 */

zipInput.addEventListener('focus', () => {
  disableTools();
  document.querySelector('.town-radius__dropdown').classList.add('hidden');
});

zipInput.addEventListener(
  'input',
  debounce(async function () {
    await map.searchZip(zipInput, zipDropdown);
  }, 300)
);

/**
 * SELECTION DONE
 */

selectionDoneButton.addEventListener('click', (e) => {
  place.fetchPlacesFromAllShapes(e);
});

document.querySelector('.close-modal').addEventListener('click', () => {
  toggleModal();
});
document.querySelector('.overlay.homepage').addEventListener('click', () => {
  toggleModal();
});
