// firebase-config.js
/**
 * Konfigurasi Firebase yang aman dan terstruktur untuk proyek AduanMasyarakat
 * 
 * FITUR KEAMANAN:
 * ✓ Konfigurasi dari window.FIREBASE_CONFIG (tidak ada kunci di repo)
 * ✓ Validasi konfigurasi yang ketat
 * ✓ Perlindungan dari inisialisasi ganda
 * ✓ Penanganan error yang komprehensif
 * ✓ Namespace tunggal untuk menghindari polusi global
 * ✓ Firestore persistence dengan dukungan multi-tab
 * ✓ Ready state dan promise API
 * 
 * SETUP:
 * 1. Sertakan Firebase SDK sebelum file ini:
 *    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
 *    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
 *    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
 *    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"></script>
 *    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics-compat.js"></script>
 * 
 * 2. Set konfigurasi dari server SEBELUM loading script ini:
 *    <script>
 *      window.FIREBASE_CONFIG = {
 *        apiKey: "...",
 *        authDomain: "...",
 *        projectId: "...",
 *        storageBucket: "...",
 *        messagingSenderId: "...",
 *        appId: "...",
 *        measurementId: "..."
 *      };
 *    </script>
 *    <script src="firebase-config.js"></script>
 * 
 * PENGGUNAAN:
 * - await __APP_FIREBASE__.ready();  // Tunggu sampai siap
 * - __APP_FIREBASE__.db              // Firestore instance
 * - __APP_FIREBASE__.auth            // Auth instance
 * - __APP_FIREBASE__.storage         // Storage instance
 * - __APP_FIREBASE__.analytics       // Analytics instance
 * - __APP_FIREBASE__.initialized     // Status boolean
 */

(function (global) {
  'use strict';

  // ========== STEP 1: LOAD & VALIDATE CONFIG ==========
  var firebaseConfig = global.FIREBASE_CONFIG;

  if (!firebaseConfig || typeof firebaseConfig !== 'object') {
    console.error(
      '[firebase-config] FIREBASE_CONFIG not found on window.\n' +
      'Set it from your server/template BEFORE loading this script:\n' +
      'window.FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", ... };'
    );
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || { 
      initialized: false, 
      error: 'FIREBASE_CONFIG not provided' 
    };
    return;
  }

  // Validasi kunci konfigurasi yang wajib ada
  var requiredKeys = ['apiKey', 'authDomain', 'projectId'];
  var missingKeys = requiredKeys.filter(function(key) {
    return !firebaseConfig[key];
  });

  if (missingKeys.length > 0) {
    console.error(
      '[firebase-config] Missing required config keys: ' + missingKeys.join(', ')
    );
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || { 
      initialized: false, 
      error: 'Missing config: ' + missingKeys.join(', ') 
    };
    return;
  }

  // ========== STEP 2: CHECK FIREBASE SDK ==========
  if (typeof global.firebase === 'undefined') {
    console.error(
      '[firebase-config] Firebase SDK not found.\n' +
      'Include Firebase JS SDK BEFORE this script using CDN or npm.'
    );
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || { 
      initialized: false, 
      error: 'Firebase SDK not loaded' 
    };
    return;
  }

  // ========== STEP 3: INITIALIZE FIREBASE ==========
  try {
    // Hindari inisialisasi ganda
    var app;
    if (firebase.apps && firebase.apps.length > 0) {
      app = firebase.app();
      console.log('[firebase-config] Menggunakan Firebase app yang sudah ada.');
    } else {
      app = firebase.initializeApp(firebaseConfig);
      console.log('[firebase-config] Firebase app diinisialisasi.');
    }

    // ========== STEP 4: INITIALIZE SERVICES ==========
    var db = null;
    var storage = null;
    var auth = null;
    var analytics = null;

    // Firestore dengan persistence
    if (firebase.firestore) {
      try {
        db = firebase.firestore();
        console.log('[firebase-config] Firestore initialized.');

        if (db && typeof db.enablePersistence === 'function') {
          db.enablePersistence({ synchronizeTabs: true })
            .then(function() {
              console.log('[firebase-config] Firestore persistence enabled (multi-tab sync active).');
            })
            .catch(function(err) {
              var code = err.code || 'unknown';
              var message = err.message || String(err);

              if (code === 'failed-precondition') {
                console.warn('[firebase-config] Firestore persistence disabled (multiple tabs detected).');
              } else if (code === 'unimplemented') {
                console.warn('[firebase-config] Firestore persistence not supported in this browser.');
              } else {
                console.warn('[firebase-config] Firestore persistence error (' + code + '):', message);
              }
            });
        }
      } catch (e) {
        console.error('[firebase-config] Firestore initialization failed:', e);
      }
    }

    // Cloud Storage
    if (firebase.storage) {
      try {
        storage = firebase.storage();
        console.log('[firebase-config] Storage initialized.');
      } catch (e) {
        console.error('[firebase-config] Storage initialization failed:', e);
      }
    }

    // Authentication
    if (firebase.auth) {
      try {
        auth = firebase.auth();
        console.log('[firebase-config] Auth initialized.');
      } catch (e) {
        console.error('[firebase-config] Auth initialization failed:', e);
      }
    }

    // Analytics (opsional, memerlukan measurementId)
    if (firebase.analytics && firebaseConfig.measurementId) {
      try {
        analytics = firebase.analytics();
        console.log('[firebase-config] Analytics initialized.');
      } catch (e) {
        console.warn('[firebase-config] Analytics initialization failed:', e);
      }
    }

    // ========== STEP 5: EXPORT NAMESPACE ==========
    global.__APP_FIREBASE__ = {
      app: app,
      db: db,
      storage: storage,
      auth: auth,
      analytics: analytics,
      initialized: true,
      error: null,

      /**
       * Promise yang resolve saat Firebase siap digunakan
       * @param {number} timeout - Timeout dalam ms (default: 5000)
       * @returns {Promise<void>}
       */
      ready: function(timeout) {
        var self = this;
        timeout = timeout || 5000;

        return new Promise(function(resolve, reject) {
          if (self.initialized) {
            resolve();
          } else {
            var startTime = Date.now();
            var checkInterval = setInterval(function() {
              if (self.initialized) {
                clearInterval(checkInterval);
                resolve();
              } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error('[firebase-config] Initialization timeout after ' + timeout + 'ms'));
              }
            }, 100);
          }
        });
      },

      /**
       * Cek apakah service tertentu tersedia
       * @param {string} service - 'db', 'auth', 'storage', 'analytics'
       * @returns {boolean}
       */
      isAvailable: function(service) {
        return this[service] !== null && this[service] !== undefined;
      }
    };

    // Backward compatibility alias
    if (!global.__FIREBASE__) {
      global.__FIREBASE__ = global.__APP_FIREBASE__;
    }

    console.log('[firebase-config] ✓ Firebase initialization completed successfully.');

  } catch (err) {
    console.error('[firebase-config] ✗ Unexpected error during Firebase initialization:', err);
    global.__APP_FIREBASE__ = global.__APP_FIREBASE__ || {
      initialized: false,
      error: err.message || String(err)
    };
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

// Export untuk ES modules (jika digunakan dalam konteks module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : global).__APP_FIREBASE__;
}
