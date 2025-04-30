import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login form submission
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        loginMessage.textContent = 'Login successful! Redirecting...';
        loginMessage.style.color = 'green';
        loginMessage.style.display = 'block';

        // Redirect to the main app after successful login
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      })
      .catch((error) => {
        // Handle errors
        loginMessage.textContent = error.message;
        loginMessage.style.color = 'red';
        loginMessage.style.display = 'block';
      });
  });
}

// Logout functionality
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful
        window.location.href = 'login.html'; // Redirect to login page
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  });
}

// Protect routes
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // User is not logged in, redirect to login page
    if (window.location.pathname !== '/login.html') {
      window.location.href = 'login.html';
    }
  } else {
    // User is logged in, allow access to the app
    console.log('User is logged in:', user.email);
  }
});