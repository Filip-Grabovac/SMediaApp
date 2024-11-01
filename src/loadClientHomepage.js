/**
 * THIS FILE LOADS CLIENTS INTO NAVBAR, HANDLES DROPDOWN LOGIC
 */
// import Map from './Map';
import Map from 'https://cdn.jsdelivr.net/gh/Filip-Grabovac/SMediaApp@56dff5fda28e80921ff40eb28e5a7c9e58d4811b/src/Map.js';

// Fetch the bearer token from local storage
const authToken = localStorage.getItem('authToken');
const apiEndpoint =
  'https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients_homepage';
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('client-id');
const map = new Map();

// Check if the token is available
if (authToken) {
  fetch(apiEndpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const navNoClients = document.querySelector('.nav-clients.no-clients');
      const navClients = document.querySelector('.nav-clients.existing');

      // CHECK IF THERE ARE ANY CLIENTS
      if (
        data.geojson_map === null &&
        Array.isArray(data.homepage_clients) &&
        data.homepage_clients.length === 0
      ) {
        navNoClients.style.display = 'flex';
        navClients.style.display = 'none';
      } else {
        navNoClients.style.display = 'none';
        navClients.style.display = 'flex';

        // Populate the client data dynamically
        const firstClient = clientId
          ? data.homepage_clients.find(
              (client) => client.id === parseInt(clientId)
            )
          : data.homepage_clients[0];

        map.drawMap(JSON.parse(firstClient.geojson_map.map));

        const clientName = document.querySelector('.client-nav__name');
        const clientImage = document.querySelector('.client-nav__image');
        const clientNum = document.querySelector('.clients-number');

        clientNum.textContent = data.homepage_clients.length;

        // Select elements inside the 'client-link active' section
        const activeClientImage = document.querySelector(
          '.client-link.active .client-nav__image'
        );
        const activeClientName = document.querySelector(
          '.client-link.active .client-link__info'
        );
        const activeClientCompany = document.querySelector(
          '.client-link.active .client-link__company'
        );

        clientName.textContent = firstClient.full_name;
        clientImage.src = firstClient.image.url;

        activeClientImage.src = firstClient.image.url;
        activeClientName.innerHTML = `${firstClient.full_name}<br>`;
        activeClientCompany.textContent = firstClient.company_name;

        navClients.classList.remove('hidden');

        // POPULATE CLIENTS INTO NAVBAR DROPDOWN
        const clientsWrapper = document.querySelector('.clients-wrapper');

        clientsWrapper.innerHTML = '';

        // Iterate through the homepage_clients array
        data.homepage_clients.forEach((client) => {
          if (
            (clientId && client.id == clientId) ||
            (!clientId && client.id == data.homepage_clients[0].id)
          ) {
            return;
          }
          // Create a new client link element
          const clientLink = document.createElement('a');
          clientLink.classList.add('client-link', 'not-selected');
          clientLink.setAttribute('client-id', client.id);
          clientLink.href = '?client-id=' + client.id;

          clientLink.innerHTML = `
  ${
    client.image
      ? `<img src="${client.image.url}" loading="lazy" alt="" class="client-nav__image">`
      : `<div class="client-avatar" style="background-color: ${colorRandomizer()} ;">${client.full_name
          .charAt(0)
          .toUpperCase()}</div>`
  }
  <p class="client-link__info">
    ${client.full_name}<br>
    <span class="client-link__company inactive">${client.company_name}</span>
  </p>
`;

          // Append the new client link to the clients wrapper
          clientsWrapper.appendChild(clientLink);
        });
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
    });
} else {
  console.error('authToken not found in local storage');
}

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
