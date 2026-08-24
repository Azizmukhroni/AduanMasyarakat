// firebase-config.js
// Perbaikan konfigurasi Firebase untuk proyek: 
// - Mengutamakan konfigurasi dari window.FIREBASE_CONFIG (supaya tidak menyimpan kunci di repo)
// - Melindungi dari inisialisasi ganda
// - Menangani kegagalan inisialisasi layanan secara aman
// - Mengekspor namespace tunggal (__APP_FIREBASE__) untuk menghindari polusi global
// Penggunaan:
// 1) Sertakan Firebase JS SDK (namespaced) sebelum file ini, misal CDN:
//    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
//    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
//    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
//    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
//    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js"></script>
// 2) Jangan letakkan kunci langsung di repo; set window.FIREBASE_CONFIG dari server/template atau CI.

(function (global) {
  'use strict';

  // Prioritaskan konfigurasi yang diberikan oleh host (direkomendasikan untuk keamanan)
  var firebaseConfig = (global.FIREBASE_CONFIG && typeof global.FIREBASE_CONFIG === 'object') ? global.FIREBASE_CONFIG : {
    apiKey: "API_KEY_ANDA",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID",
    measurementId: "G-MEASUREMENT_ID"
  };

  // Pastikan SDK Firebase sudah dimuat
  if (typeof global.firebase === 'undefined') {
    console.error('[firebase-config] Firebase SDK not found. Please include the Firebase JS SDK before this file.');
    // Ekspor placeholder agar kode lain tidak melempar jika mengharapkan namespace
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || { initialized: false };
    return;
  }

  try {
    // Hindari inisialisasi ganda (cara kerja untuk SDK namespaced v8 dan sebelumnya)
    var app;
    if (firebase.apps && firebase.apps.length) {
      app = firebase.app();
    } else {
      app = firebase.initializeApp(firebaseConfig);
    }

    var db = null;
    var storage = null;
    var auth = null;
    var analytics = null;

    if (firebase.firestore) {
      try {
        db = firebase.firestore();
        // Opsi: aktifkan persistence jika tersedia (catch untuk kasus yang tidak didukung)
        if (db && db.enablePersistence) {
          db.enablePersistence().catch(function (err) {
            if (err && err.code) {
              if (err.code === 'failed-precondition') {
                console.warn('[firebase-config] Firestore persistence failed: multiple tabs open.');
              } else if (err.code === 'unimplemented') {
                console.warn('[firebase-config] Firestore persistence is not available in this browser.');
              } else {
                console.warn('[firebase-config] Firestore persistence error:', err);
              }
            } else {
              console.warn('[firebase-config] Firestore persistence error:', err);
            }
          });
        }
      } catch (e) {
        console.warn('[firebase-config] Could not initialize Firestore:', e);
      }
    }

    if (firebase.storage) {
      try {
        storage = firebase.storage();
      } catch (e) {
        console.warn('[firebase-config] Could not initialize Storage:', e);
      }
    }

    if (firebase.auth) {
      try { auth = firebase.auth(); } catch (e) { console.warn('[firebase-config] Could not initialize Auth:', e); }
    }

    if (firebase.analytics && firebaseConfig.measurementId) {
      try { analytics = firebase.analytics(); } catch (e) { console.warn('[firebase-config] Could not initialize Analytics:', e); }
    }

    // Ekspor namespace tunggal ke global supaya mudah diakses tanpa polusi banyak nama
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || {};
    global.__APP_FIREBASE__.app = app;
    global.__APP_FIREBASE__.db = db;
    global.__APP_FIREBASE__.storage = storage;
    global.__APP_FIREBASE__.auth = auth;
    global.__APP_FIREBASE__.analytics = analytics;
    global.__APP_FIREBASE__.initialized = true;

    // Alias kompatibilitas: jika proyek lain mencari __FIREBASE__, beri referensi sama
    if (!global.__FIREBASE__) global.__FIREBASE__ = global.__APP_FIREBASE__;

  } catch (err) {
    console.error('[firebase-config] Unexpected error during Firebase initialization:', err);
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || { initialized: false, error: err };
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
