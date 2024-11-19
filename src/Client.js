import Map from './Map';
import Place from './Place';

export default class Client {
  constructor() {
    this.authToken = localStorage.getItem('authToken');
    this.colorRandomizer = this.colorRandomizer.bind(this);
    this.map = new Map();
    this.place = new Place();
  }

  loadClients(isInitialLoad, page, per_page, offset, search) {
    const tableBody = document.querySelector('#clients-table tbody');
    const rangeElement = document.querySelector('.clients-table__range');
    tableBody.style.opacity = '40%';

    document.querySelectorAll('.pagination-arrow').forEach((btn) => {
      btn.classList.add('disabled');
    });

    // Construct the API endpoint URL with search parameter (if provided)
    let apiUrl = `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients?page=${page}&per_page=${per_page}&offset=${offset}`;
    if (search) {
      apiUrl += `&search=${encodeURIComponent(search)}`;
    }

    // Fetch clients data
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (isInitialLoad) {
          if (data.clients.itemsTotal === 0) {
            document.querySelector('.add-new-client').click();
          }
          document.querySelectorAll('.clients-number').forEach((num) => {
            num.textContent = data.clients.itemsTotal;
          });
          document.querySelector('.clients-table__loader').remove();
        }

        // Disable/enable pagination arrows based on nextPage/prevPage
        if (data.clients.nextPage === null) {
          document
            .querySelector('.pagination-arrow.right')
            .classList.add('disabled');
        } else {
          document
            .querySelector('.pagination-arrow.right')
            .classList.remove('disabled');
        }

        if (data.clients.prevPage === null) {
          document
            .querySelector('.pagination-arrow.left')
            .classList.add('disabled');
        } else {
          document
            .querySelector('.pagination-arrow.left')
            .classList.remove('disabled');
        }

        let rows = '';

        // Check if there are clients to display
        if (data.clients.items.length === 0) {
          rows = `
            <tr>
              <td colspan="8" class="no-data-message">No data</td>
            </tr>`;
        } else {
          // Populate the rows with fetched data
          data.clients.items.forEach((client) => {
            console.log(client);
            rows += `
              <tr>
                <td class="dark"><a href="/client?client_id=${
                  client.id
                }" class="client-table__link">${
              client.image
                ? `<img class="client-image" src="${client.image.url}" alt="Client image">`
                : `<div style="background-color: ${this.colorRandomizer()};" class="fullname-capital">${client.full_name
                    .slice(0, 1)
                    .toUpperCase()}</div>`
            }${client.full_name}</a></td>
                <td class="light">${client.company_name}</td>
                <td><a href="${
                  client.website
                }" target="_blank" class="website-link">${
              client.website
            }</a></td>
                <td><a href="mailto:${client.email}" class="email-link">${
              client.email
            }</a></td>
                <td class="light">${client.phone_number}</td>
                <td class="light">${new Date(
                  client.created_at
                ).toLocaleDateString()}</td>
                <td><img class="edit-client__btn" src="https://cdn.prod.website-files.com/66eab8d4420be36698ed221a/6706654e169e0a1ab9a12e73_pencil-icon.svg"></td>
              </tr>`;
          });
        }

        // Set the innerHTML of the tbody to the constructed rows string
        tableBody.innerHTML = rows;

        tableBody.style.opacity = '100%';
        document.querySelector('.clients-section').style.opacity = '1';

        // Calculate and display the current range of items
        const startItem = (page - 1) * per_page + 1;
        const endItem = Math.min(
          startItem + data.clients.items.length - 1,
          data.clients.itemsTotal
        );
        rangeElement.textContent = `${startItem}-${endItem}`; // Update range display
      })
      .catch((error) => {
        console.error('Error fetching clients:', error);
        // Optionally handle error display in the UI
      });
  }

  searchNavClients(clientLinks, searchValue) {
    clientLinks.forEach((client) => {
      const clientName = client
        .querySelector('.client-link__info')
        .innerText.toLowerCase();

      if (searchValue === '' || clientName.includes(searchValue)) {
        client.style.display = 'flex';
      } else {
        client.style.display = 'none';
      }
    });
  }

  colorRandomizer() {
    let userColors = [
      '#CBE4F9',
      '#CDF5F6',
      '#EFF9DA',
      '#F9EBDF',
      '#F9D8D6',
      '#D6CDEA',
    ];

    return userColors[Math.floor(Math.random() * userColors.length)];
  }

  loadClientHomepage(clientId, apiEndpoint) {
    if (this.authToken) {
      fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const navNoClients = document.querySelector(
            '.nav-clients.no-clients'
          );
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

            this.map.drawMap(JSON.parse(firstClient.geojson_map.map), this.place);

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
          : `<div class="client-avatar" style="background-color: ${client.colorRandomizer()} ;">${client.full_name
              .charAt(0)
              .toUpperCase()}</div>`
      }
      <p class="client-link__info">
        ${client.full_name}<br>
        <span class="client-link__company inactive">${
          client.company_name
        }</span>
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
  }

  modalNextStep(step) {
    document.querySelectorAll('.modal-dropdown').forEach((dropdown) => {
      dropdown
        .querySelector('.modal-dropdown__text')
        .classList.remove('active');
      dropdown
        .querySelector('.modal-dropdown__arrow')
        .classList.remove('active');
    });

    const factorsDropdown = document.querySelector('.modal-dropdown.factors');
    if (factorsDropdown) {
      factorsDropdown
        .querySelector('.modal-dropdown__text')
        .classList.add('active');
      factorsDropdown
        .querySelector('.modal-dropdown__arrow')
        .classList.add('active');
    }

    if (step === 2) document.querySelector('.new-client__modal').scrollTop = 0;
  }

  gatherClientData(client) {
    client.full_name = document.getElementById('full-name').value;
    client.company_name = document.getElementById('company').value;
    client.email = document.getElementById('email').value;
    client.website = document.getElementById('website').value;
    client.phone_number = document.getElementById('phone-number').value;

    // Gather multiple addresses
    client.company_office_adr = Array.from(
      document.querySelectorAll('.company-office-address')
    )
      .map((input) => input.value)
      .filter(Boolean);
  }

  addNewClient(client) {
    const authToken = localStorage.getItem('authToken');

    const clientData = {
      full_name: client.full_name,
      company_name: client.company_name,
      email: client.email,
      website: client.website,
      phone_number: client.phone_number,
      population_factor:
        parseFloat(document.getElementById('population').value) || 0,
      avg_household_income_factor:
        parseFloat(document.getElementById('avg-income').value) || 0,
      single_family_homes_factor:
        parseFloat(document.getElementById('num-homes').value) || 0,
      avg_home_value_factor:
        parseFloat(document.getElementById('avg-home-value').value) || 0,
      distance_from_hq_factor:
        parseFloat(document.getElementById('distance-hq').value) || 0,
      client_img: client.client_img || null,
    };

    fetch('https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    })
      .then((response) => response.json())
      .then((data) => {
        location.reload();
      })
      .catch((error) => {
        console.error('Error adding client:', error);
      });
  }

  updateModalContent(e) {
    document
      .querySelector('.modal-form__wrapper.first-step')
      .classList.add('hidden');
    document
      .querySelector('.modal-form__wrapper.second-step')
      .classList.remove('hidden');

    e.target.classList.remove('second-step', 'active');
    e.target.classList.add('add-client');
    e.target.textContent = 'Add new Client';
  }

  validateForm(form, nextStepButton) {
    const isValid = Array.from(
      form.querySelectorAll('.form-input[required]')
    ).every((input) => {
      return (
        input.value &&
        (input.type !== 'email' || this.validateEmail(input.value))
      );
    });
    nextStepButton.classList.toggle('active', isValid);
  }

  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  addNewAddressField(addressCount, form) {
    addressCount++;
    // Clone the last address input field
    const lastInput = form.querySelectorAll('.form-input__wrapper');
    const lastAddressField = lastInput[lastInput.length - 1];
    const newAddressField = lastAddressField.cloneNode(true);

    // Reset the cloned input field values and properties
    const newInput = newAddressField.querySelector('input');
    newInput.value = '';
    newInput.placeholder = `Company Office Address ${addressCount}`;
    newInput.id = `field-address-${addressCount}`;
    newInput.name = `address-${addressCount}`;
    newInput.removeAttribute('required');

    // Remove the red star
    const redStar = newAddressField.querySelector('.red-star');
    if (redStar) redStar.remove();

    form.appendChild(newAddressField);

    return addressCount;
  }

  validateSecondStepInput() {
    const inputs = [
      document.getElementById('population'),
      document.getElementById('avg-income'),
      document.getElementById('num-homes'),
      document.getElementById('avg-home-value'),
      document.getElementById('distance-hq'),
    ];
  
    const allValid = inputs.every((input) => {
      const value = parseFloat(input.value);
      return !isNaN(value) && value >= 0 && value <= 1;
    });
  
    document.querySelector('.add-client').classList.toggle('active', allValid);
  }

  uploadClientImage(files, preview, client) {
    preview.innerHTML = '';
  
    // Update the file type check to include SVG
    if (
      files.length > 0 &&
      (files[0].type.startsWith('image/') || files[0].type === 'image/svg+xml')
    ) {
      const reader = new FileReader();
  
      reader.onloadend = () => {
        client.client_img = reader.result;
  
        const img = document.createElement('img');
        img.src = client.client_img;
        preview.appendChild(img);
      };
  
      reader.readAsDataURL(files[0]);
    }
  }
}
