// ============================================
// STATE
// ============================================
let currentUser = null;
let generatedOTP = null;
let otpTimer = null;
let resendTimer = null;

// ============================================
// VIEW NAVIGATION
// ============================================
function toggleView(viewName) {
    ['signup', 'login', 'otp', 'dashboard'].forEach(v => {
        const el = document.getElementById(`${v}-view`);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(`${viewName}-view`);
    if (target) target.classList.remove('hidden');
}

// ============================================
// PASSWORD SHOW / HIDE
// ============================================
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

// ============================================
// 🔐 PASSWORD HASHING (SHA-256)
// ============================================
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// 🌙 DARK MODE
// ============================================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// ============================================
// PAGE LOAD
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon();

    // Wire up index.html forms (only if on index.html)
    if (document.getElementById('signup-form')) {
        attachFormListeners();
    }

    // Populate sub-pages (profile.html, etc.)
    if (document.getElementById('profile-email')) {
        populateSubPage();
    }
});

// ============================================
// FORM LISTENERS (index.html only)
// ============================================
function attachFormListeners() {

    // --- SIGN UP ---
    document.getElementById('signup-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('su-email').value;
        const password = document.getElementById('su-password').value;
        const errorMsg = document.getElementById('pw-error');

        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongRegex.test(password)) {
            errorMsg.classList.remove('hidden');
            return;
        }
        errorMsg.classList.add('hidden');

        const hashedPassword = await hashPassword(password);
        const user = {
            id: 'USR-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            email: email,
            passwordHash: hashedPassword,
            registeredAt: new Date().toISOString(),
            lastLogin: null
        };
        localStorage.setItem('registeredUser', JSON.stringify(user));

        alert("Account Created Successfully! Please Log In.");
        toggleView('login');
    });

    // --- LOGIN ---
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('li-email').value;
        const password = document.getElementById('li-password').value;

        const storedUser = JSON.parse(localStorage.getItem('registeredUser'));
        if (!storedUser) {
            alert("No account found. Please sign up first.");
            return;
        }

        const hashedInput = await hashPassword(password);
        if (email === storedUser.email && hashedInput === storedUser.passwordHash) {
            currentUser = storedUser;
            currentUser.lastLogin = new Date().toISOString();
            localStorage.setItem('registeredUser', JSON.stringify(currentUser));
            generateOTP();
        } else {
            alert("Invalid Email or Password.");
        }
    });

    // --- OTP inputs auto-advance ---
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // --- VERIFY OTP ---
    document.getElementById('verify-btn').addEventListener('click', function () {
        if (!generatedOTP) {
            document.getElementById('otp-error').textContent = "OTP expired. Please click Resend.";
            document.getElementById('otp-error').classList.remove('hidden');
            return;
        }

        const otpInputs = document.querySelectorAll('.otp-input');
        let enteredOTP = "";
        otpInputs.forEach(input => enteredOTP += input.value);

        if (enteredOTP === generatedOTP) {
            clearInterval(otpTimer);
            clearInterval(resendTimer);
            showDashboard();
        } else {
            document.getElementById('otp-error').textContent = "Invalid OTP. Try again.";
            document.getElementById('otp-error').classList.remove('hidden');
            otpInputs.forEach(input => input.value = "");
            otpInputs[0].focus();
        }
    });

    // --- RESEND OTP ---
    document.getElementById('resend-btn').addEventListener('click', resendOTP);
}

// ============================================
// OTP GENERATION + TIMERS
// ============================================
function generateOTP() {
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    alert(`[ADMIN SYSTEM] OTP Generated:\n\nYour 4-digit code is: ${generatedOTP}\n\nExpires in 60 seconds.`);

    toggleView('otp');
    document.getElementById('otp-error').classList.add('hidden');

    // Re-enable verify button
    const verifyBtn = document.getElementById('verify-btn');
    verifyBtn.disabled = false;
    verifyBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    // Clear OTP input boxes
    document.querySelectorAll('.otp-input').forEach(input => input.value = "");
    document.querySelectorAll('.otp-input')[0].focus();

    startOTPTimer();
    startResendTimer();
}

// ⏱️ 60-second OTP expiry countdown
function startOTPTimer() {
    clearInterval(otpTimer);
    let otpExpiry = 60;
    const