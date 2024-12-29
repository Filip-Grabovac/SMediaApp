// import Client from '../Client';
// import User from '../User';
// import Tool from '../Tool';

import Client from 'https://smediaapp.pages.dev/src/Client.js';
import User from 'https://smediaapp.pages.dev/src/User.js';
import Tool from 'https://smediaapp.pages.dev/src/Tool.js';

let client = new Client();
let user = new User();
let tool = new Tool();

const logoutBtn = document.querySelector('.logout-btn');
const cancelBtn = document.querySelector('.cancel-client-btn');
const deleteBtn = document.querySelector('.delete_client_button');
const updateBtn = document.querySelector('#save-client');
const addNewOfficeButton = document.querySelector('.add_text-link');

/**
 * SHOW NOTIFICATION AFTER USER UPDATE
 */
tool.showNotification();

// Get client_id from the URL
const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get('client_id');

// Get authToken from localStorage
const authToken = localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', function () {
  client.loadSingleClient(clientId, authToken);
});

user.authenticate();

logoutBtn.addEventListener('click', function (event) {
  event.preventDefault();

  user.logOut();
});

cancelBtn.addEventListener('click', function (event) {
  event.preventDefault();

  location.reload();
});

deleteBtn.addEventListener('click', function (event) {
  event.preventDefault();

  client.deleteClient();
});

addNewOfficeButton.addEventListener('click', (e) => {
  e.preventDefault();
  client.addNewOfficeField(tool);
});

updateBtn.addEventListener('click', (e) => {
  e.preventDefault();
  client.updateClient();
});
