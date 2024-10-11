const logoutBtn = document.querySelector('.logout-btn');

/**
LOGOUT LOGIC
**/
logoutBtn.addEventListener('click', function (event) {
  event.preventDefault(); // Prevent the default anchor behavior

  // Remove the authToken from local storage
  localStorage.removeItem('authToken');

  // Redirect to the login page
  window.location.href = '/login';
});
