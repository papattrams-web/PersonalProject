document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.querySelector('form');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Password fields
    const pass1 = document.querySelector('input[name="pasword"]');
    const pass2 = document.querySelector('input[name="cPasword"]');

    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            
            // 1. Basic Client-Side Match Check
            if (pass1.value !== pass2.value) {
                e.preventDefault();
                alert("Passwords do not match!");
                return;
            }

            // 2. Disable button to prevent double-submit
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Creating Account...';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'not-allowed';

            // 3. Sanitize (Trim whitespace from text inputs)
            const textInputs = signupForm.querySelectorAll('input[type="text"], input[type="email"]');
            textInputs.forEach(input => {
                input.value = input.value.trim();
            });
        });
    }

    // 4. Restore button if page is loaded from cache (Back button)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign Up';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    });
});