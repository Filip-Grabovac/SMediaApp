let passwordInput = document.querySelector('.password-login-input');
const emailInput = document.getElementById('email');
const loginButton = document.querySelector('.main-button');
let eyeShow = document.querySelector('.password-eye-icon.show');
let eyeHide = document.querySelector('.password-eye-icon.hide');
const errorMessage = document.querySelector('.error-message');
const inputs = document.querySelectorAll('.login-input');

console.log('asd');

/**
  SHOW/HIDE PASSWORD
  **/
// Adding the event listener to both icons to ensure toggle works
eyeShow.addEventListener('click', togglePasswordVisibility);
eyeHide.addEventListener('click', togglePasswordVisibility);

function togglePasswordVisibility() {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeShow.style.display = 'block';
    eyeHide.style.display = 'none';
  } else {
    passwordInput.type = 'password';
    eyeShow.style.display = 'none';
    eyeHide.style.display = 'block';
  }
}

/**
  SHOW/HIDE LOGIN BUTTON
  **/
// Function to check if email is valid
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Function to check and update the button's active state
function checkFormValidity() {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (isValidEmail(email) && password.length > 0) {
    loginButton.classList.add('active');
  } else {
    loginButton.classList.remove('active');
  }
}

// Attach event listeners to email and password fields
emailInput.addEventListener('input', () => {
  checkFormValidity();
  errorMessage.classList.add('hidden');
  // Remove .invalid to the input fields
  inputs.forEach((input) => {
    input.classList.remove('invalid');
  });
});

passwordInput.addEventListener('input', () => {
  checkFormValidity();
  errorMessage.classList.add('hidden');
  // Remove .invalid to the input fields
  inputs.forEach((input) => {
    input.classList.remove('invalid');
  });
});

/**
  LOGIN USER
  **/
document
  .getElementById('login-btn')
  .addEventListener('click', function (event) {
    event.preventDefault(); // Prevent form from submitting

    // Get the email and password values
    const email = document.getElementById('email').value;
    const password = document.getElementById('Password').value;

    // Prepare the data for the API request
    const data = {
      email: email,
      password: password,
    };

    // Call the Xano API
    fetch('https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.authToken) {
          // Save the token to localStorage
          localStorage.setItem('authToken', result.authToken);

          // Redirect to page
          if (result.clients_length === 0) {
            window.location.href = '/clients';
          } else {
            window.location.href = '/';
          }
        } else {
          // Error: show the error message and apply the invalid class
          const errorMessage = document.querySelector('.error-message');
          const inputs = document.querySelectorAll('.login-input');

          // Remove .hidden from .error-message
          errorMessage.classList.remove('hidden');

          // Add .invalid to the input fields
          inputs.forEach((input) => {
            input.classList.add('invalid');
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });

// Check authentication status on the login page
function checkLoginAuth() {
  const authToken = localStorage.getItem('authToken');

  if (authToken) {
    // If a token exists, verify it with the API
    fetch('https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.code !== 'ERROR_CODE_UNAUTHORIZED') {
          // If the token is valid, redirect to the home page
          window.location.href = '/';
        } else {
          // If the token is invalid, remove it and stay on the login page
          localStorage.removeItem('authToken');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        // Handle any network errors
      });
  }
}

// Call the function when the login page is loaded
checkLoginAuth();
