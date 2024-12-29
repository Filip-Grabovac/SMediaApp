// import Map from './Map';
// import Place from './Place';

import Map from 'https://smediaapp.pages.dev/src/Map.js';
import Place from 'https://smediaapp.pages.dev/src/Place.js';

export default class Client {
  constructor(tool) {
    this.authToken = localStorage.getItem('authToken');
    this.colorRandomizer = this.colorRandomizer.bind(this);
    this.removeOffice = this.removeOffice.bind(this);
    this.map = new Map();
    this.place = new Place();
    this.tool = tool;
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
            rows += `
          <tr>
            <td class="dark"><a href="/?client_id=${
              client.id
            }" class="client-table__link">${
              client.image
                ? `<img class="client-image" src="${client.image.url}" alt="Client image">`
                : `<div style="background-color: ${this.colorRandomizer()};" class="fullname-capital">${client.company_name
                    .slice(0, 1)
                    .toUpperCase()}</div>`
            }${client.company_name}</a></td>
            <td><a href="${
              client.website
            }" target="_blank" class="website-link">${client.website}</a></td>
            <td><a href="mailto:${client.email}" class="email-link">${
              client.email
            }</a></td>
            <td class="light">${client.phone_number}</td>
            <td class="light">${new Date(
              client.created_at
            ).toLocaleDateString()}</td>
            <td><a href="/client?client_id=${
              client.id
            }"><img class="edit-client__btn" src="https://cdn.prod.website-files.com/66eab8d4420be36698ed221a/6706654e169e0a1ab9a12e73_pencil-icon.svg"></a></td>
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

            // Hide "Select other client" heading since there are no other clients
            if (data.homepage_clients.length < 2) {
              const otherClientsHeading = document.querySelector(
                '.other-client-heading'
              );
              otherClientsHeading.style = 'display: none';
            }

            // Populate the client data dynamically
            const firstClient = clientId
              ? data.homepage_clients.find(
                  (client) => client.id === parseInt(clientId)
                )
              : data.homepage_clients[0];

            window.currentClientId = firstClient.id;

            // Save factors into global variable
            const userFactors = {
              avg_home_value_factor: firstClient.avg_home_value_factor,
              avg_household_income_factor:
                firstClient.avg_household_income_factor,
              distance_from_hq_factor: firstClient.distance_from_hq_factor,
              population_factor: firstClient.population_factor,
              single_family_homes_factor:
                firstClient.single_family_homes_factor,
              client_offices: firstClient.client_offices,
            };

            window.userFactors = userFactors;

            this.map.drawMap(
              JSON.parse(firstClient.geojson_map.map),
              this.place,
              firstClient.client_offices,
              this.place
            );

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

            clientName.textContent = firstClient.company_name;
            clientImage.src = firstClient.image.url;

            activeClientImage.src = firstClient.image.url;
            activeClientName.innerHTML = `${firstClient.company_name}<br>`;

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
              clientLink.href = '?client_id=' + client.id;

              clientLink.innerHTML = `
  ${
    client.image
      ? `<img src="${client.image.url}" loading="lazy" alt="" class="client-nav__image">`
      : `<div class="client-avatar" style="background-color: ${client.colorRandomizer()} ;">${client.company_name
          .charAt(0)
          .toUpperCase()}</div>`
  }
  <p class="client-link__info">
    ${client.company_name}
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
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to add client');
        }
        return response.json();
      })
      .then((data) => {
        // Extract the client ID from the response
        const clientId = data.id;

        // Get all office address inputs
        const addressInputs = document.querySelectorAll(
          '.form-input.company-office-address'
        );

        // Prepare the payload for the new_offices API
        const locations = Array.from(addressInputs)
          .map((input) => {
            const officeAddress = input.value
              .trim()
              .replaceAll(', United States', '');
            const latitude = input.getAttribute('data-latitude');
            const longitude = input.getAttribute('data-longitude');

            if (officeAddress && latitude && longitude) {
              // Convert to the required string format
              return `{'office_address': '${officeAddress}', 'lan': '${latitude}', 'lon': '${longitude}'}`;
            }
            return null; // Skip inputs with missing data
          })
          .filter((location) => location); // Filter out null values

        const officeData = {
          client_id: clientId,
          location: '', // Leave location empty as per your requirement
          locations: locations,
        };

        // Call the new_offices API
        return fetch(
          'https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/new_offices',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(officeData),
          }
        );
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to add office addresses');
        }
        return response.json();
      })
      .then((officeResponse) => {
        location.reload();
        localStorage.setItem('notification', 'Client created successfully');
      })
      .catch((error) => {
        console.error('Error:', error);
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
    newInput.id = `field-address-${addressCount}`;
    newInput.name = `address-${addressCount}`;
    newInput.removeAttribute('required');

    // Update the label text
    const label = newAddressField.querySelector('label');
    if (label) {
      label.textContent = `Company Office Address ${addressCount}`;
      label.setAttribute('for', `field-address-${addressCount}`); // Update the label's `for` attribute
    }

    // Remove the red star
    const redStar = newAddressField.querySelector('.red-star');
    if (redStar) redStar.remove();

    form.appendChild(newAddressField);

    // Add input event listener to the new input field
    newInput.addEventListener(
      'input',
      this.tool.debounce((event) => {
        this.getAddressSuggestion(event.target); // Trigger address suggestion for the new input
      }, 300)
    );

    return addressCount;
  }

  validateSecondStepInput() {
    let hasIntermediate = false; // To track values between 0.1 and 0.9
    let hasOne = false;
    let hasZero = false;

    let zeroCount = 0;
    let oneCount = 0;

    const inputs = [
      document.getElementById('population'),
      document.getElementById('avg-income'),
      document.getElementById('num-homes'),
      document.getElementById('avg-home-value'),
      document.getElementById('distance-hq'),
    ];

    inputs.forEach((input) => {
      const value = parseFloat(input.value);

      if (value === 1) {
        oneCount++; // Count how many 1's
        hasOne = true;
      } else if (value === 0) {
        zeroCount++; // Count how many 0's
        hasZero = true;
      } else if (value > 0 && value < 1) {
        hasIntermediate = true; // Found an intermediate value
      }
    });

    // Ensure there is at least one 1 and one 0, and no more than two 1's or 0's
    const hasTooManyOnesOrZeros = oneCount > 2 || zeroCount > 2;

    // Check if all conditions are met
    if (hasOne && hasZero && !hasTooManyOnesOrZeros && hasIntermediate) {
      document.querySelector('.add-client').classList.add('active');
    } else {
      document.querySelector('.add-client').classList.remove('active');
    }
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

  loadSingleClient(clientId, authToken) {
    fetch(
      `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients/${clientId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch client data');
        }
        return response.json();
      })
      .then((data) => {
        const company = document.getElementById('profile-company');
        const email = document.getElementById('profile-email');
        const website = document.getElementById('profile-website');
        const phone = document.getElementById('profile-phone');
        const companyTitle = document.querySelector('.client_name_text');
        const { client_offices } = data;

        const img = document.getElementById('client-img');

        // Populate text fields
        company.value = data.company_name;
        email.value = data.email;
        website.value = data.website;
        phone.value = data.phone_number;
        companyTitle.textContent = data.company_name;

        // Populate client offices
        this.populateClientOffices(client_offices);

        // Set up the image loading behavior
        img.onload = () => {
          // Image is fully loaded, reveal content
          document.getElementById('single-client-section').style.opacity = '1';
          document.querySelector('.clients-table__loader').remove();
        };

        // Set the image source to start loading
        img.src = data.image.url;
      });
  }

  populateClientOffices(offices) {
    const officeWrapper = document.querySelector('.office-address-wrap'); // Select the base element to clone
    const addOfficeWrapper = document.querySelector('.add-office_wrapper'); // Reference to insert cloned nodes before

    document.querySelectorAll('.office-address-wrap')[0].remove();

    // Parse and loop through each office
    offices.forEach((office) => {
      const parsedLocation = JSON.parse(office.location.replace(/'/g, '"')); // Correct JSON format
      const officeAddress = parsedLocation.office_address;

      // Clone the base element
      const clonedOffice = officeWrapper.cloneNode(true);

      // Find and set the value of the input inside the cloned element
      const inputField = clonedOffice.querySelector('input');
      inputField.value = officeAddress;

      // Add the office ID to the remove icon
      const removeIcon = clonedOffice.querySelector('.remove-office');
      removeIcon.setAttribute('data-office-id', office.id);

      removeIcon.addEventListener('click', (event) => {
        const officeId = removeIcon.getAttribute('data-office-id');
        this.removeOffice(officeId, clonedOffice); // Call the function to remove the office by its ID
      });

      // Append the cloned element before the "Add new office address" link
      addOfficeWrapper.parentNode.insertBefore(clonedOffice, addOfficeWrapper);
    });
  }

  removeOffice(officeId, officeElement) {
    // Get the auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('No auth token found in localStorage');
      return;
    }

    // Make the DELETE request to the API
    fetch(
      `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/offices/${officeId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete office');
        }
        return response.json();
      })
      .then((data) => {
        officeElement.remove();
      })
      .catch((error) => {
        console.error('Error deleting office:', error);
      });
  }

  addNewOfficeField(tool) {
    // Select the reference point to insert new offices before it
    const addOfficeWrapper = document.querySelector('.add-office_wrapper');

    // Create a new div element for the new office input
    const newOfficeDiv = document.createElement('div');
    newOfficeDiv.classList.add('form-input__wrapper');

    // Create the label for the new office input
    const label = document.createElement('label');
    label.classList.add('client-input-label');
    label.textContent = 'Company Office Address';
    newOfficeDiv.appendChild(label);

    // Create the new input field for the office address
    const input = document.createElement('input');
    input.classList.add('full_name_input', 'w-input', 'new-office-input');
    input.setAttribute('type', 'text');
    input.setAttribute('maxlength', '256');
    input.setAttribute('name', 'field-2');
    input.setAttribute('data-name', 'Field 2');
    input.setAttribute('placeholder', '');
    input.required = true;

    input.addEventListener(
      'input',
      tool.debounce((event) => {
        this.getAddressSuggestion(event.target); // Trigger address suggestion for the new input
      }, 300)
    );

    newOfficeDiv.appendChild(input);

    // Create the dropdown suggestion container (empty for now)
    const dropdown = document.createElement('div');
    dropdown.classList.add('client-address__dropdown-suggestion');
    newOfficeDiv.appendChild(dropdown);

    // Insert the new office div before the "Add new office address" link
    addOfficeWrapper.parentNode.insertBefore(newOfficeDiv, addOfficeWrapper);
  }

  getAddressSuggestion(inputElement) {
    let query = inputElement.value;
    const modifiedQuery = `${query}, United States`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      modifiedQuery
    )}&format=json&addressdetails=1&limit=3`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const dropdown = inputElement
          .closest('.form-input__wrapper')
          .querySelector('.client-address__dropdown-suggestion');
        dropdown.innerHTML = ''; // Clear previous suggestions

        if (data && data.length > 0) {
          data.forEach((item) => {
            const dropdownItem = document.createElement('div');
            dropdownItem.classList.add('dropdown-item', 'client-address__item');
            dropdownItem.innerHTML = `<span>${item.display_name}</span>`;

            // When a suggestion is clicked, add it to the corresponding input
            dropdownItem.addEventListener('click', () => {
              inputElement.value = item.display_name; // Set input value to the selected address
              dropdown.innerHTML = ''; // Clear the dropdown after selection

              // Add custom properties to the input element (latitude and longitude)
              inputElement.dataset.latitude = item.lat;
              inputElement.dataset.longitude = item.lon;

              // If you want to directly add them as properties, you can do:
              inputElement.lat = item.lat;
              inputElement.lon = item.lon;

              // UPDATING CLIENT OFFICE LOCATIONS LIVE
              // Check if the URL includes the parameter "client_id"
              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.has('client_id')) {
                // Extract the value of client_id if needed
                const singleClientId = urlParams.get('client_id');

                // Prepare the payload for the new_offices API
                const locations = Array.from(
                  document.querySelectorAll('.new-office-input')
                )
                  .map((input) => {
                    const officeAddress = input.value
                      .trim()
                      .replaceAll(', United States', '');
                    const latitude = input.getAttribute('data-latitude');
                    const longitude = input.getAttribute('data-longitude');

                    if (officeAddress && latitude && longitude) {
                      // Convert to the required string format
                      return `{'office_address': '${officeAddress}', 'lan': '${latitude}', 'lon': '${longitude}'}`;
                    }
                    return null; // Skip inputs with missing data
                  })
                  .filter((location) => location); // Filter out null values

                const officeData = {
                  client_id: singleClientId,
                  location: '', // Leave location empty as per your requirement
                  locations: locations,
                };

                const authToken = localStorage.getItem('authToken');

                // Find the closest `.form-input__wrapper` and add the loader
                const closestOfficeWrapp = document
                  .querySelector('.new-office-input')
                  ?.closest('.form-input__wrapper');

                if (closestOfficeWrapp) {
                  // Add the loader to the closest `.form-input__wrapper`
                  const loader = document.createElement('span');
                  loader.className = 'loader';
                  closestOfficeWrapp.appendChild(loader);
                }

                fetch(
                  'https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/new_offices',
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(officeData),
                  }
                )
                  .then((response) => {
                    if (!response.ok) {
                      throw new Error('Failed to add new office');
                    }
                    return response.json(); // Assuming the API returns a JSON response
                  })
                  .then((data) => {
                    // Assuming the response contains an office ID
                    const officeId = data.result1.id; // Adjust this to match the API response structure

                    // Remove the loader
                    const loader = closestOfficeWrapp.querySelector('.loader');
                    if (loader) {
                      closestOfficeWrapp.removeChild(loader);
                    }

                    // Create the new image element
                    const imgElement = document.createElement('img');
                    imgElement.src =
                      'https://cdn.prod.website-files.com/66eab8d4420be36698ed221a/675687c8f834451b18594f1c_red-x.svg';
                    imgElement.alt = '';
                    imgElement.loading = 'lazy';
                    imgElement.className = 'remove-office';
                    imgElement.setAttribute('data-office-id', officeId);

                    imgElement.addEventListener('click', (event) => {
                      const officeId =
                        imgElement.getAttribute('data-office-id');
                      this.removeOffice(officeId, closestOfficeWrapp); // Call the function to remove the office by its ID
                    });

                    // Append the image to the closest `.office-wrapp`
                    closestOfficeWrapp.appendChild(imgElement);

                    // Update classes on the input element
                    const inputElement =
                      document.querySelector('.new-office-input');
                    if (inputElement) {
                      inputElement.classList.add('profile-office-input');
                      inputElement.classList.remove('new-office-input');
                    }
                  })
                  .catch((error) => {
                    console.error('Error:', error);

                    // Remove the loader even in case of an error
                    const loader = closestOfficeWrapp.querySelector('.loader');
                    if (loader) {
                      closestOfficeWrapp.removeChild(loader);
                    }
                  });
              }
            });

            dropdown.appendChild(dropdownItem);
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching address data:', error);
      });
  }

  deleteClient() {
    // Confirm with the user before proceeding
    if (confirm('Are you sure you want to delete this client?')) {
      // Get the client_id from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('client_id'); // Extracts client_id from the query parameter

      // Get the authToken from local storage
      const authToken = localStorage.getItem('authToken');

      if (clientId && authToken) {
        // Make the DELETE request
        fetch(
          `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients/${clientId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error('Failed to delete client');
            }
            return response.json();
          })
          .then(() => {
            // Set the notification in local storage
            localStorage.setItem('notification', 'Client deleted successfully');

            // Redirect to the /clients page
            window.location.href = '/clients';
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      } else {
        console.error('Missing client_id or authToken');
      }
    }
  }

  updateClient() {
    // Get the inputs
    const clientId = new URLSearchParams(window.location.search).get(
      'client_id'
    );
    const email = document.querySelector('#profile-email').value;
    const website = document.querySelector('#profile-website').value;
    const phoneNumber = document.querySelector('#profile-phone').value;
    const companyName = document.querySelector('#profile-company').value;

    // Get the bearer token from localStorage
    const authToken = localStorage.getItem('authToken');

    // Construct the request body
    const requestBody = {
      clients_id: clientId,
      email: email,
      website: website,
      phone_number: phoneNumber,
      company_name: companyName,
    };

    // Make the PATCH request
    fetch(
      `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/update_client/${clientId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update client');
        }
        return response.json();
      })
      .then((data) => {
        localStorage.setItem('notification', 'Client updated successfully');
        // Reset the page
        window.location.reload();
      })
      .catch((error) => {
        console.error('Error updating client:', error);
      });
  }
}
