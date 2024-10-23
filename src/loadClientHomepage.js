/**
 * THIS FILE LOADS CLIENTS INTO NAVBAR, HANDLES DROPDOWN LOGIC WITH OVERLAY
 */

// Fetch the bearer token from local storage
const authToken = localStorage.getItem('authToken');
const apiEndpoint =
  'https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients_homepage';

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

        // DRAW AND LOAD MAP
        loadClientMap(JSON.parse(data.geojson_map.map));

        // Populate the client data dynamically
        const firstClient = data.homepage_clients[0]; // Assuming you are using the first client
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
        data.homepage_clients.slice(1).forEach((client) => {
          // Create a new client link element
          const clientLink = document.createElement('div');
          clientLink.classList.add('client-link', 'not-selected');
          clientLink.setAttribute('client-id', client.id);

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

// Show/hide clients dropdown with overlay transition
const clientDropdown = document.querySelector('.clients-dropdown');
const closeIcon = document.querySelector('.close-clients');
const overlay = document.querySelector('.overlay');
let isTransitioning = false;

clientDropdown.addEventListener('click', (e) => toggleModal(e));
closeIcon.addEventListener('click', (e) => toggleModal(e));
overlay.addEventListener('click', (e) => toggleModal(e));

function toggleModal(event) {
  event.stopPropagation();
  if (isTransitioning) return;

  const menu = document.querySelector('.clients-dropdown__menu');
  isTransitioning = true;
  menu.classList.toggle('open');

  if (menu.classList.contains('open')) {
    overlay.style.display = 'block';
    overlay.style.transition = 'opacity 200ms ease';
    setTimeout(() => {
      overlay.style.opacity = '0.5';
    }, 10);

    overlay.addEventListener(
      'transitionend',
      () => {
        isTransitioning = false;
      },
      { once: true }
    );
  } else {
    overlay.style.transition = 'opacity 500ms ease';
    overlay.style.opacity = '0';

    overlay.addEventListener(
      'transitionend',
      () => {
        overlay.style.display = 'none';
        isTransitioning = false;
      },
      { once: true }
    );
  }
}
