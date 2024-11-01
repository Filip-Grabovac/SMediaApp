import Client from "../Client";

const client = new Client();

document.getElementById('Search').addEventListener('input', function (e) {
    const searchValue = this.value.toLowerCase().trim();
    const clientLinks = document.querySelectorAll('.client-link');
  
    client.searchNavClients(clientLinks, searchValue);
  });
  