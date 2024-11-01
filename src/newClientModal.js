const form = document.querySelector('.client-modal-form');
const nextStepButton = document.querySelector('.main-button.next-step');
const newAddressBtn = document.querySelector('.new-address__btn');
let addressCount = 1;
let step = 1;
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('fileElem');
const preview = document.getElementById('preview');

let client = {
  full_name: '',
  company_name: '',
  email: '',
  website: '',
  phone_number: '',
  company_office_adr: [],
  client_img: '',
  population_f: 0,
  avg_household_income_f: 0,
  single_family_homes_f: 0,
  avg_home_value_f: 0,
  distance_from_hq_f: 0,
};

/**
 * NEXT STEP BUTTON LOGIC
 */
function activateFactorsDropdown() {
  // Remove active class from all dropdowns and activate factors dropdown
  document.querySelectorAll('.modal-dropdown').forEach((dropdown) => {
    dropdown.querySelector('.modal-dropdown__text').classList.remove('active');
    dropdown.querySelector('.modal-dropdown__arrow').classList.remove('active');
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

function updateModalContent(e) {
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

nextStepButton.addEventListener('click', (e) => {
  e.preventDefault();
  if (step === 1) {
    gatherClientData();
    step++;
  } else {
    step = null;
    addNewClient();
  }
  activateFactorsDropdown();
  updateModalContent(e);
});

/**
 * FORM VALIDATION LOGIC
 */
function validateForm() {
  const isValid = Array.from(
    form.querySelectorAll('.form-input[required]')
  ).every((input) => {
    return (
      input.value && (input.type !== 'email' || validateEmail(input.value))
    );
  });
  nextStepButton.classList.toggle('active', isValid);
}

// Email validation function
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

form.addEventListener('input', validateForm);

/**
 * ADD NEW OFFICE LOCATION LOGIC
 */
newAddressBtn.addEventListener('click', (e) => {
  e.preventDefault();
  addNewAddressField();
});

function addNewAddressField() {
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
}

/**
 * VALIDATE SECOND STEP
 */
function validateInputs() {
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

document.querySelectorAll('.form-input__scnd').forEach((input) => {
  input.addEventListener('input', () => {
    validateInputs();

    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0 || value > 1) {
      input.value = '';
    }
  });
});

/**
 * IMAGE DRAG AND DROP LOGIC
 */
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

// Handle file uploads and convert to base64
function handleFiles(files) {
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
  } else {
    // Optionally handle unsupported file types
    alert('Please upload an image file (PNG, JPG, JPEG, or SVG).');
  }
}

/**
 * GATHER NEW CLIENT DATA
 */
function gatherClientData() {
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

/**
 * ADD NEW CLIENT
 */
function addNewClient() {
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
