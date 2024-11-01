export default class User {
  authenticate(successRedirect = '/', failureRedirect = '/login') {
    const authToken = localStorage.getItem('authToken');

    // If there's no auth token, redirect to the failure page if not already there
    if (!authToken) {
      if (window.location.pathname !== failureRedirect) {
        window.location.href = failureRedirect;
      }
      return;
    }

    // If there is a token, verify it with the API
    fetch('https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.code === 'ERROR_CODE_UNAUTHORIZED') {
          // If the token is invalid, remove it and redirect to the failure page if not there already
          localStorage.removeItem('authToken');
          if (window.location.pathname !== failureRedirect) {
            window.location.href = failureRedirect;
          }
        } else {
          // If the token is valid and on the `/clients` page, stay on `/clients`
          if (window.location.pathname === '/clients') {
            return; // Do nothing, remain on `/clients`
          }

          // Otherwise, redirect to the success page if not already there
          if (window.location.pathname !== successRedirect) {
            window.location.href = successRedirect;
          }
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        // Optionally handle errors, such as displaying a message to the user
      });
  }

  logIn(data) {
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
  }

  logOut() {
    // Remove the authToken from local storage
    localStorage.removeItem('authToken');

    // Redirect to the login page
    window.location.href = '/login';
  }

  toggleUserPassVisibility(passwordInput, eyeShow, eyeHide) {
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
}
