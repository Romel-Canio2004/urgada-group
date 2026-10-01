// --- State Management ---
let currentUser = null;
let generatedOTP = null;

// --- View Navigation ---
function toggleView(viewName) {
    // Hide all views
    document.getElementById('signup-view').classList.add('hidden');
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('otp-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');

    // Show the requested view
    document.getElementById(`${viewName}-view`).classList.remove('hidden');
}

// --- Password Show / Hide Toggle ---
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
    } else {
        input.type = 'password';
        btn.textContent = 'Show';
    }
}

// --- 1. Sign Up Logic (Strong Password Validation) ---
document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('su-email').value;
    const password = document.getElementById('su-password').value;
    const errorMsg = document.getElementById('pw-error');

    // Strong Password Regex: Min 8 chars, 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongRegex.test(password)) {
        errorMsg.classList.remove('hidden');
        return;
    }
    errorMsg.classList.add('hidden');

    // Save user to LocalStorage (Simulating Database)
    const user = { email: email, password: password };
    localStorage.setItem('registeredUser', JSON.stringify(user));

    alert("Account Created Successfully! Please Log In.");
    toggleView('login');
});

// --- 2. Login Logic (Admin Controlled Simulation) ---
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('li-email').value;
    const password = document.getElementById('li-password').value;

    const storedUser = JSON.parse(localStorage.getItem('registeredUser'));

    if (!storedUser) {
        alert("No account found. Please sign up first.");
        return;
    }

    if (email === storedUser.email && password === storedUser.password) {
        currentUser = email;
        generateOTP(); // Trigger Admin Side Logic
    } else {
        alert("Invalid Email or Password.");
    }
});

// --- 3. Admin Side: Generate OTP ---
function generateOTP() {
    // Generate a random 4-digit number
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Simulate sending email (Alert the user)
    alert(`[ADMIN SYSTEM] OTP Generated:\n\nYour 4-digit code is: ${generatedOTP}`);

    // Switch to OTP View
    toggleView('otp');

    // Auto-focus first input and clear any previous value
    const otpInputs = document.querySelectorAll('.otp-input');
    if (otpInputs.length > 0) {
        otpInputs.forEach(input => input.value = "");
        otpInputs[0].focus();
    }
}

// --- 4. OTP Input Handling (Auto-focus next box) ---
const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, index) => {
    // Move forward when typing
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    // Move backward on backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

// --- 5. Verify OTP → Go to Dashboard ---
document.getElementById('verify-btn').addEventListener('click', function () {
    let enteredOTP = "";
    otpInputs.forEach(input => enteredOTP += input.value);

    if (enteredOTP === generatedOTP) {
        // Show the logged-in email on the dashboard
        document.getElementById('user-email-display').textContent = currentUser;

        // Go to Dashboard
        toggleView('dashboard');
    } else {
        document.getElementById('otp-error').classList.remove('hidden');
        // Clear inputs
        otpInputs.forEach(input => input.value = "");
        otpInputs[0].focus();
    }
});

// --- 6. Logout ---
function logout() {
    currentUser = null;
    generatedOTP = null;

    // Reset forms
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();

    // Clear OTP inputs
    otpInputs.forEach(input => input.value = "");

    // Reset password fields back to hidden state
    document.getElementById('su-password').type = 'password';
    document.getElementById('li-password').type = 'password';

    toggleView('login');
}
// --- 7. Dashboard Card Click Handler ---
function handleCardClick(cardName) {
    // For now, we simulate navigation with an alert and a console log.
    // In the future, you can replace this with actual page navigation:
    // window.location.href = 'profile.html';
    
    console.log(`User clicked on: ${cardName}`);
    alert(`Navigating to ${cardName}...\n\n(You can replace this alert with actual page navigation later!)`);
}