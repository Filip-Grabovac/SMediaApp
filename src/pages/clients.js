import Client from '../Client';
import User from '../User';

const client = new Client();
const user = new User();

let page = 1;
let per_page = 5;
let offset = 0;
let search = '';

// Load initial clients
client.loadClients(true, page, per_page, offset, search);

user.authenticate();

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
