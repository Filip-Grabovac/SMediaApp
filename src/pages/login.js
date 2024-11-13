// import User from '../User';
import User from 'https://cdn.jsdelivr.net/gh/Filip-Grabovac/SMediaApp@56dff5fda28e80921ff40eb28e5a7c9e58d4811b/src/User.js';

const user = new User();

const logInBtn = document.getElementById('login-btn');
let passwordInput = document.querySelector('.password-login-input');
const emailInput = document.getElementById('email');
let eyeShow = document.querySelector('.password-eye-icon.show');
let eyeHide = document.querySelector('.password-eye-icon.hide');
const errorMessage = document.querySelector('.error-message');
const inputs = document.querySelectorAll('.login-input');

user.authenticate();

logInBtn.addEventListener('click', function (event) {
  event.preventDefault(); // Prevent form from submitting

  // Get the email and password values
  const email = document.getElementById('email').value;
  const password = document.getElementById('Password').value;

  // Prepare the data for the API request
  const data = {
    email: email,
    password: password,
  };

  user.logIn(data);
});

eyeShow.addEventListener('click', () => {
  user.toggleUserPassVisibility(passwordInput, eyeShow, eyeHide);
});
eyeHide.addEventListener('click', () => {
  user.toggleUserPassVisibility(passwordInput, eyeShow, eyeHide);
});

// Check if email is valid
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// Check and update the button's active state
function checkFormValidity() {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (isValidEmail(email) && password.length > 0) {
    logInBtn.classList.add('active');
  } else {
    logInBtn.classList.remove('active');
  }
}

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
