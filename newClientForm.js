// Select the form, next step button, and add new address button
const form = document.querySelector('.client-modal-form');
const nextStepButton = document.querySelector('.main-button.next-step');
const newAddressBtn = document.querySelector('.new-address__btn');
let addressCount = 1; // Initial count of addresses (start from 1 since one address exists by default)

/**
 * NEXT STEP BUTTON LOGIC
 */
function activateFactorsDropdown() {
  // Select all dropdown elements
  const dropdowns = document.querySelectorAll('.modal-dropdown');

  // Remove active class from all dropdowns
  dropdowns.forEach((dropdown) => {
    dropdown.querySelector('.modal-dropdown__text').classList.remove('active');
    dropdown.querySelector('.modal-dropdown__arrow').classList.remove('active');
  });

  // Select the specific dropdown with class 'factors' and make it active
  const factorsDropdown = document.querySelector('.modal-dropdown.factors');
  if (factorsDropdown) {
    factorsDropdown
      .querySelector('.modal-dropdown__text')
      .classList.add('active');
    factorsDropdown
      .querySelector('.modal-dropdown__arrow')
      .classList.add('active');
  }

  // Scroll to the top of modal window
  document.querySelector('.new-client__modal').scrollTop = 0;
}

function updateModalContent(e) {
  document
    .querySelector('.modal-form__wrapper.first-step')
    .classList.add('hidden');
  document
    .querySelector('.modal-form__wrapper.second-step')
    .classList.remove('hidden');

  e.target.classList.remove('second-step');
  e.target.classList.remove('active');
  e.target.classList.add('add-client');
  e.target.textContent = 'Add new Client';
}

// Add click event listener to the next step button
nextStepButton.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default behavior
  activateFactorsDropdown(); // Activate the dropdown when the button is clicked
  updateModalContent(e);
});

/**
 * FIELDS VALIDATION FOR FIRST SCREEN
 */
// Function to validate the original fields only
function validateForm() {
  // Select all the original input fields that need to be validated (excluding dynamically added fields)
  const originalInputs = form.querySelectorAll('.form-input[required]'); // Only original inputs marked as required
  let isValid = true;

  // Iterate over each input to check if they are valid
  originalInputs.forEach((input) => {
    if (
      input.value.trim() === '' ||
      (input.type === 'email' && !validateEmail(input.value))
    ) {
      isValid = false; // Set isValid to false if any original input is invalid
    }
  });

  // Toggle the active class on the next step button based on validity
  if (isValid) {
    nextStepButton.classList.add('active');
  } else {
    nextStepButton.classList.remove('active');
  }
}

// Email validation function
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format regex
  return regex.test(email);
}

// Add input event listeners to validate fields on input change for original fields only
form.addEventListener('input', validateForm);

/**
 * ADD NEW OFFICE LOCATION LOGIC
 */
newAddressBtn.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent default behavior
  addNewAddressField(); // Call the function to add a new office location
});

// Function to add a new address field
function addNewAddressField() {
  addressCount++; // Increment the address count

  // Clone the last address input field
  const lastAddressField = form.querySelector(
    '.form-input__wrapper:last-child'
  );
  const newAddressField = lastAddressField.cloneNode(true); // Clone the last wrapper with the input field

  // Get the input field within the cloned wrapper and reset its value
  const newInput = newAddressField.querySelector('input');
  newInput.value = ''; // Clear the value of the input
  newInput.placeholder = `Company Office Address ${addressCount}`; // Update the placeholder
  newInput.id = `field-address-${addressCount}`; // Assign a unique ID for the new input
  newInput.name = `address-${addressCount}`; // Assign a unique name for the new input

  // Remove 'required' attribute and the red star (*) for new address fields
  newInput.removeAttribute('required');
  const redStar = newAddressField.querySelector('.red-star');
  if (redStar) {
    redStar.remove(); // Remove the red star from the cloned field
  }

  // Append the new input field to the form
  form.appendChild(newAddressField);
}

/**
 * VALIDATE SECOND STEP
 */
// Function to validate inputs
function validateInputs() {
  // Get all input elements
  const inputs = [
    document.getElementById('population'),
    document.getElementById('avg-income'),
    document.getElementById('num-homes'),
    document.getElementById('avg-home-value'),
    document.getElementById('distance-hq'),
  ];

  let allValid = true;

  // Validate each input
  inputs.forEach((input) => {
    const value = parseFloat(input.value);

    if (isNaN(value) || value < 0 || value > 1) {
      allValid = false;
    }
  });

  // Update button class based on validity
  const button = document.querySelector('.add-client');
  if (allValid) {
    button.classList.add('active');
  } else {
    button.classList.remove('active');
  }
}

// Attach input event listeners to all input fields
const inputFields = document.querySelectorAll('.form-input__scnd');

inputFields.forEach((input) => {
  input.addEventListener('input', () => {
    validateInputs();

    const value = parseFloat(input.value);

    // Clamp value between 0 and 1
    if (value < 0 || value > 1 || isNaN(value)) {
      input.value = '';
    }
  });
});
