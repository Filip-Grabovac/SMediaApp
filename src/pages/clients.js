import Client from '../Client';
import User from '../User';

const client = new Client();
const user = new User();

let page = 1;
let per_page = 5;
let offset = 0;
let search = '';
let step = 1;
let addressCount = 1;
const logoutBtn = document.querySelector('.logout-btn');
const nextStepButton = document.querySelector('.main-button.next-step');
const form = document.querySelector('.client-modal-form');
const newAddressBtn = document.querySelector('.new-address__btn');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('fileElem');
const preview = document.getElementById('preview');

let clientData = {
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

// Load initial clients
client.loadClients(true, page, per_page, offset, search);

user.authenticate();

logoutBtn.addEventListener('click', function (event) {
  event.preventDefault();

  user.logOut();
});

document
  .querySelector('.pagination-arrow.right')
  .addEventListener('click', function () {
    page += 1;
    offset = 0;
    client.loadClients(false, page, per_page, offset, search);
  });

document
  .querySelector('.pagination-arrow.left')
  .addEventListener('click', function () {
    page -= 1;
    offset = 0;
    client.loadClients(false, page, per_page, offset, search);
  });

document
  .querySelector('.clients-perpage__input')
  .addEventListener('change', function (event) {
    per_page = parseInt(event.target.value);
    page = 1;
    client.loadClients(false, page, per_page, offset, search);
  });

document
  .querySelector('#client-search')
  .addEventListener('input', function (event) {
    search = event.target.value;
    page = 1;
    client.loadClients(false, page, per_page, offset, search);
  });

/**
 * MODAL LOGIC
 */
nextStepButton.addEventListener('click', (e) => {
  e.preventDefault();
  if (step === 1) {
    client.gatherClientData(clientData);
    step++;
  } else {
    step = null;
    client.addNewClient(clientData);
  }
  client.modalNextStep(step);
  client.updateModalContent(e);
});

form.addEventListener('input', () => {
  client.validateForm(form, nextStepButton);
});

newAddressBtn.addEventListener('click', (e) => {
  e.preventDefault();
  addressCount = client.addNewAddressField(addressCount, form);
});

document.querySelectorAll('.form-input__scnd').forEach((input) => {
  input.addEventListener('input', () => {
    client.validateSecondStepInput();

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
  client.uploadClientImage(e.dataTransfer.files, preview, clientData);
});

fileInput.addEventListener('change', (e) => {
  client.uploadClientImage(e.target.files, preview, clientData);
});