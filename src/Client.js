export default class Client {
  constructor() {
    this.authToken = localStorage.getItem('authToken');
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
                <td class="dark"><div class="client-table__link">${
                  client.image
                    ? `<img class="client-image" src="${client.image.url}" alt="Client image">`
                    : `<div style="background-color: ${colorRandomizer()};" class="fullname-capital">${client.full_name
                        .slice(0, 1)
                        .toUpperCase()}</div>`
                }${client.full_name}</div></td>
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
}
