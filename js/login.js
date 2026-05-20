// MrGardenr CMS Login Controller

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const toggleEyeIcon = document.getElementById('toggleEyeIcon');
  
  const submitBtn = document.getElementById('submitBtn');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const btnText = submitBtn.querySelector('.btn-text');
  
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  // Toggle Password Visibility
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    // Toggle Eye Icons
    if (isPassword) {
      toggleEyeIcon.classList.remove('fa-eye');
      toggleEyeIcon.classList.add('fa-eye-slash');
    } else {
      toggleEyeIcon.classList.remove('fa-eye-slash');
      toggleEyeIcon.classList.add('fa-eye');
    }
  });

  // Handle Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear alerts
    errorAlert.classList.add('hidden');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
      showAlert('Please enter both administrative credentials.');
      return;
    }

    // Set Loading state
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success: Redirect to dashboard
        window.location.href = '/admin.html';
      } else {
        // Failure
        showAlert(data.error || 'Authentication failed. Please verify credentials.');
        passwordInput.value = '';
        passwordInput.focus();
        setLoading(false);
      }
    } catch (err) {
      showAlert('Could not communicate with secure login services. Please verify the server is running.');
      setLoading(false);
    }
  });

  // Helpers
  function setLoading(isLoading) {
    if (isLoading) {
      usernameInput.disabled = true;
      passwordInput.disabled = true;
      togglePasswordBtn.disabled = true;
      submitBtn.disabled = true;
      btnSpinner.classList.remove('hidden');
      btnText.textContent = 'Verifying Authenticity...';
    } else {
      usernameInput.disabled = false;
      passwordInput.disabled = false;
      togglePasswordBtn.disabled = false;
      submitBtn.disabled = false;
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Authenticate Portal';
    }
  }

  function showAlert(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('hidden');
    
    // Trigger vibration/shake animation
    errorAlert.style.animation = 'none';
    errorAlert.offsetHeight; /* trigger reflow */
    errorAlert.style.animation = null;
  }
});
