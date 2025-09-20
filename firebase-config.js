// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "API_KEY_ANDA",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  measurementId: "G-MEASUREMENT_ID"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi Firestore
const db = firebase.firestore();

// Inisialisasi Storage
const storage = firebase.storage();

// Export untuk digunakan di file lain
window.firebaseApp = firebase;
window.db = db;
window.storage = storage;