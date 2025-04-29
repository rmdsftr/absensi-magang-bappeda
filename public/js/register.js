
        const showPasswordCheckbox = document.getElementById("showPassword");
        const password_Input = document.getElementById("password");
        const passwordInput2 = document.getElementById("password2");

        showPasswordCheckbox.addEventListener("change", function() {
            if (this.checked) {
                password_Input.type = "text";
                passwordInput2.type = "text";
            } else {
                password_Input.type = "password";
                passwordInput2.type = "password";
            }
        });
    

    
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('password2');
        const errorMessage = document.getElementById('error-message');

        function checkPasswordMatch() {
            if (passwordInput.value !== confirmPasswordInput.value) {
                errorMessage.style.display = 'flex';
            } else {
                errorMessage.style.display = 'none';
            }
        }

        passwordInput.addEventListener('input', checkPasswordMatch);
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);

        if (errorMessage) {
            passwordInput.addEventListener('input', function () {
                errorMessage.style.display = 'none';  
            });

            confirmPasswordInput.addEventListener('input', function () {
                errorMessage.style.display = 'none'; 
            });
        }
    