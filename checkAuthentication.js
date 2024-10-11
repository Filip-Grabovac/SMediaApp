/**
    CHECK AUTH TOKEN AND REDIRECT IF NEEDED
    **/
// Check if the authToken exists and validate it
function checkAuth() {
  const authToken = localStorage.getItem('authToken');

  if (!authToken) {
    // If no token exists, redirect to login
    window.location.href = '/login';
  } else {
    // Verify the token with the API
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
          // Token is invalid or expired
          localStorage.removeItem('authToken'); // Remove invalid token
          window.location.href = '/login'; // Redirect to login page
        }
        // If token is valid, proceed to the protected page
      })
      .catch((error) => {
        console.error('Error:', error);
        // Handle any network errors
      });
  }
}
