// STEWARD — Firebase config (compat SDK v8.10.1)
// Load order required on every page:
//   firebase-app.js → firebase-auth.js → firebase-firestore.js → this file

const firebaseConfig = {
  apiKey: "AIzaSyAZwp_UMu1CPtnHPaCJ79MsIxAeuDbXQyA",
  authDomain: "driver-65656.firebaseapp.com",
  projectId: "driver-65656",
  storageBucket: "driver-65656.appspot.com",
  messagingSenderId: "386249458737",
  appId: "1:386249458737:web:d85640fef97665970cc110"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

// Auth guard — wraps onAuthStateChanged, unsubscribes after first emission.
// Redirects to login.html if no authenticated user; resolves with user if authenticated.
// Call at the top of every protected page before any DOM manipulation.
function requireAuth(redirectTo) {
  redirectTo = redirectTo || 'login.html';
  return new Promise(function(resolve) {
    var unsubscribe = auth.onAuthStateChanged(function(user) {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        window.location.replace(redirectTo);
      }
    });
  });
}

// Friendly Firebase Auth error messages
function friendlyAuthError(code) {
  var map = {
    'auth/user-not-found':    'No account found for that email.',
    'auth/wrong-password':    'Incorrect password.',
    'auth/invalid-email':     'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };
  return map[code] || 'Sign-in failed. Please try again.';
}
