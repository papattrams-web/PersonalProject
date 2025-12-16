document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');
    const submitBtn = document.querySelector('button[type="submit"]');
    const passwordInput = document.querySelector('input[name="pasword"]'); // Note: matches your 'pasword' typo in HTML

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // 1. Disable button to prevent double-submit attacks
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Authenticating...';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'not-allowed';

            // 2. Client-side sanitization (Trim whitespace)
            const inputs = loginForm.querySelectorAll('input[type="text"], input[type="password"]');
            inputs.forEach(input => {
                input.value = input.value.trim();
            });
        });
    }

    // 3. Security: Clear password on page unload (prevents Back-Button viewing)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) { // If page is loaded from cache (back button)
            if(passwordInput) passwordInput.value = "";
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    });
});