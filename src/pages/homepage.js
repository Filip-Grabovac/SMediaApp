// import User from '../User';
// import Map from '../Map';
// import Place from '../Place';
// import Client from '../Client';
// import Tool from '../Tool';

import User from 'https://smediaapp.pages.dev/src/User.js';
import Map from 'https://smediaapp.pages.dev/src/Map.js';
import Place from 'https://smediaapp.pages.dev/src/Place.js';
import Client from 'https://smediaapp.pages.dev/src/Client.js';
import Tool from 'https://smediaapp.pages.dev/src/Tool.js';

const user = new User();
const place = new Place();
const map = new Map();
const client = new Client();
const tool = new Tool(map, place);

const logoutBtn = document.querySelector('.logout-btn');
const townInput = document.getElementById('town-input');
const townDropdown = document.getElementById('town-dropdown');
const closeTownDropdown = document.querySelector('.close-town__dropdown');

const stateInput = document.getElementById('state-input');
const stateDropdown = document.getElementById('state-dropdown');
const exportBtn = document.getElementById('tableExportBtn');

const zipInput = document.getElementById('zip-input');
const zipDropdown = document.getElementById('zip-dropdown');

const uploadZipBtn = document.querySelector('.zip-bulk-button');

const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('client_id');
const clientApiEndpoint =
  'https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients_homepage';

const selectionDoneButton = document.querySelector(
  '.main-button.submit-selection'
);
const icons = document.querySelectorAll(
  '.tool-wrapper .map-manipulation__icon'
);

window.drawnCities = [];

user.authenticate();

logoutBtn.addEventListener('click', function (event) {
  event.preventDefault();

  user.logOut();
});

/**
 * MAP TOOLS ACTIVE STATE
 */

icons.forEach(function (icon) {
  icon.addEventListener('click', function () {
    const toolWrapper = this.closest('.tool-wrapper');

    if (toolWrapper.classList.contains('active')) {
      toolWrapper.classList.remove('active');
      
      const activeChildren = wrapper.querySelectorAll('[data-active="true"]');
      activeChildren.forEach(child => child.setAttribute('data-active', 'false'));
      
      return;
    }

    document.querySelectorAll('.tool-wrapper').forEach(wrapper => {
      wrapper.classList.remove('active');
      
      const activeChildren = wrapper.querySelectorAll('[data-active="true"]');
      activeChildren.forEach(child => child.setAttribute('data-active', 'false'));
    });

    // Add 'active' to the clicked one
    toolWrapper.classList.add('active');
  });


  icon.addEventListener('mouseenter', function () {
      this.previousElementSibling.classList.add('active');
  });

  icon.addEventListener('mouseleave', function () {
    this.previousElementSibling.classList.remove('active');
  });
});

/**
 * TOWN/CITY
 */

townInput.addEventListener('focus', () => {
  map.disableTools();
});

townInput.addEventListener(
  'input',
  tool.debounce((event) => {
    const query = event.target.value;
    if (query === '') {
      townDropdown.innerHTML = ''; // Clear the dropdown if the query is empty
      townDropdown.style.display = 'none'; // Hide dropdown
      return;
    }

    map.fetchCitySuggestions(query, townInput, townDropdown, place);
  }, 300)
);

map.hideDropdownOnClick(townDropdown, townInput);

closeTownDropdown &&
  closeTownDropdown.addEventListener('click', function () {
    // document.querySelector('.town-radius__dropdown').classList.add('hidden');
  });

/**
 * STATE
 */

stateInput.addEventListener('focus', () => {
  map.disableTools();
  // document.querySelector('.town-radius__dropdown').classList.add('hidden');
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
    onSelect: () => tool.drawState(state, map), // Define the action on selection
  }));
  tool.createDropdown(
    dropdownItems,
    stateDropdown,
    stateInput,
    false,
    'state-dropdown__link'
  ); // Use the reusable function

  map.disableTools();
});

/**
 * ZIP
 */

zipInput.addEventListener('focus', () => {
  map.disableTools();
  // document.querySelector('.town-radius__dropdown').classList.add('hidden');
});

zipInput.addEventListener(
  'input',
  tool.debounce(async function () {
    await map.searchZip(zipInput, zipDropdown, place);
  }, 300)
);

/**
 * NAVBAR SEARCH FUNCTIONALITY
 */
document.getElementById('Search').addEventListener('input', function (e) {
  const searchValue = this.value.toLowerCase().trim();
  const clientLinks = document.querySelectorAll('.client-link');

  client.searchNavClients(clientLinks, searchValue);
});

/**
 * LOAD CLIENTS INTO HOMEPAGE
 */
client.loadClientHomepage(clientId, clientApiEndpoint);

// Show/hide clients dropdown
const clientDropdown = document.querySelector('.clients-dropdown');
const closeIcon = document.querySelector('.close-clients');

clientDropdown.addEventListener('click', (e) => toggleDropdown(e));
closeIcon.addEventListener('click', (e) => toggleDropdown(e));

function toggleDropdown(event) {
  event.stopPropagation();

  const menu = document.querySelector('.clients-dropdown__menu');
  menu.classList.toggle('open');
}

/**
 * EXCLUDE/INCLUDE
 */

document.querySelectorAll('.option_button').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const activeBtn = document.querySelector('.option_button.active');
    if (activeBtn) {
      activeBtn.classList.remove('active');
    }

    e.currentTarget.classList.add('active');
  });
});

place.searchIncludedExcludedPlaces(
  '.input-search.included-search',
  '.states_wrap.included'
);
place.searchIncludedExcludedPlaces(
  '.input-search.excluded-search',
  '.states_wrap.excluded'
);

map.toggleStateRow();

// ZIP BULK UPLOAD
uploadZipBtn.addEventListener('click', async () => {
  let zipTextArea = document.querySelector('.zip-modal-textarea');
  let zipText = zipTextArea.value.trim();

  if (zipText.length === 0) {
    return;
  }

  let zipCodes = zipText.split(',').map((zip) => zip.trim());

  for (let zip of zipCodes) {
    if (zip) {
      try {
        await tool.zipDraw({ name: zip }, place); // ✅ Now correctly waits!
      } catch (error) {
        console.error(`⚠️ Error processing ZIP: ${zip}`, error);
      }
    }
  }

  document.querySelector('.zip-bulk-modal__overlay').style = "opacity: 0; display: none;"
});

// EXPORT TO CSV
exportBtn.addEventListener('click', () => {
  place.exportTable();
});
