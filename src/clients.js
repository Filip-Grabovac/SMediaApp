/**
 * THIS FILE LOADS ALL THE CLIENTS INTO TABLE
 */

let page = 1;
let per_page = 5;
let offset = 0;
let search = '';

/**
FETCH CLIENTS
  **/
// Universal function to fetch and display clients
async function loadClients(isInitialLoad, page, per_page, offset, search) {
  const tableBody = document.querySelector('#clients-table tbody');
  const rangeElement = document.querySelector('.clients-table__range'); // Range element
  tableBody.style = 'opacity: 40%;';

  document.querySelectorAll('.pagination-arrow').forEach((btn) => {
    btn.classList.add('disabled');
  });

  // Retrieve authToken from local storage
  const authToken = localStorage.getItem('authToken');

  // Construct the API endpoint URL with search parameter (if provided)
  let apiUrl = `https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients?page=${page}&per_page=${per_page}&offset=${offset}`;
  if (search) {
    apiUrl += `&search=${encodeURIComponent(search)}`; // Append the search query to the URL
  }

  // Fetch clients data
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`, // Set the Bearer token
        'Content-Type': 'application/json', // Optional: set content type
      },
    });

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (isInitialLoad) {
      if (data.clients.itemsTotal === 0) {
        document.querySelector('.add-new-client').click();
      }
      document.querySelectorAll('.clients-number').forEach((num) => {
        num.textContent = data.clients.itemsTotal;
      });
      document.querySelector('.clients-table__loader').remove();
    }

    // Disable/enable pagination arrows based on nextPage/prevPage if last or first page
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

    // Initialize a string to hold the rows
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
            ? `<img class="client-image" src="${client.image.url}" alt="Client image"></img>`
            : `<div style="background-color: ${colorRandomizer()};" class="fullname-capital">${client.full_name
                .slice(0, 1)
                .toUpperCase()}</div>`
        }${client.full_name}</div></td>
<td class="light">${client.company_name}</td>
<td><a href="${client.website}" target="_blank" class="website-link">${
          client.website
        }</a></td>
<td><a href="mailto:${client.email}" class="email-link">${client.email}</a></td>
<td class="light">${client.phone_number}</td>
<td class="light">${new Date(client.created_at).toLocaleDateString()}</td>
<td><img class="edit-client__btn" src="https://cdn.prod.website-files.com/66eab8d4420be36698ed221a/6706654e169e0a1ab9a12e73_pencil-icon.svg"></td>
</tr>`;
      });
    }

    // Set the innerHTML of the tbody to the constructed rows string
    tableBody.innerHTML = rows;

    tableBody.style = 'opacity: 100%;';
    document.querySelector('.clients-section').style = 'opacity: 1;';

    // Calculate and display the current range of items
    const startItem = (page - 1) * per_page + 1;
    const endItem = Math.min(
      startItem + data.clients.items.length - 1,
      data.clients.itemsTotal
    );
    rangeElement.textContent = `${startItem}-${endItem}`; // Update range display
  } catch (error) {
    console.error('Error fetching clients:', error);
    // Optionally handle error display in the UI
  }
}

// Load initial clients
loadClients(true, page, per_page, offset, search);

/**
PAGINATION LOGIC
**/
// Event listener for the right arrow to go to the next page
document
  .querySelector('.pagination-arrow.right')
  .addEventListener('click', function () {
    page += 1; // Increment the page
    offset = 0; // Update the offset based on the page
    loadClients(false, page, per_page, offset, search); // Load the next set of clients with the current search term
  });

// Event listener for the left arrow to go to the previous page
document
  .querySelector('.pagination-arrow.left')
  .addEventListener('click', function () {
    page -= 1; // Decrement the page
    offset = 0; // Update the offset based on the page
    loadClients(false, page, per_page, offset, search); // Load the previous set of clients with the current search term
  });

/**
PER PAGE SELECTION
**/
// Event listener for changing the per_page value
document
  .querySelector('.clients-perpage__input')
  .addEventListener('change', function (event) {
    per_page = parseInt(event.target.value); // Get the selected per_page value
    page = 1; // Reset to page 1
    loadClients(false, page, per_page, 0, search); // Reload the clients with new per_page value and search term
  });

/**
SEARCH FUNCTIONALITY
**/
// Event listener for search input field
document
  .querySelector('#client-search')
  .addEventListener('input', function (event) {
    search = event.target.value; // Get the search query from the input field
    page = 1; // Reset to page 1
    loadClients(false, page, per_page, 0, search); // Reload clients with the search term and reset pagination
  });
