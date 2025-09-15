// Firebase Client Module
// Menangani inisialisasi dan komunikasi dengan Firebase

import { firebaseConfig } from './config.js';

// Global state
let firebaseInitialized = false;
let db = null;
let storage = null;

/**
 * Inisialisasi Firebase
 * @returns {Promise<boolean>} Status inisialisasi
 */
async function initializeFirebase() {
    try {
        // Cek jika Firebase sudah di-load
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK tidak ditemukan");
            return false;
        }
        
        // Inisialisasi Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
        firebaseInitialized = true;
        
        console.log("Firebase berhasil diinisialisasi");
        updateFirebaseStatus('connected');
        
        return true;
    } catch (error) {
        console.error("Error inisialisasi Firebase:", error);
        firebaseInitialized = false;
        updateFirebaseStatus('disconnected');
        
        // Fallback ke localStorage
        initLocalStorageFallback();
        return false;
    }
}

/**
 * Update status koneksi Firebase di UI
 * @param {string} status - Status koneksi ('connected' atau 'disconnected')
 */
function updateFirebaseStatus(status) {
    const firebaseStatus = document.getElementById('firebase-status');
    if (!firebaseStatus) return;
    
    if (status === 'connected') {
        firebaseStatus.textContent = "Firebase: Connected";
        firebaseStatus.className = 'firebase-status firebase-connected';
        firebaseStatus.style.display = 'block';
        
        // Sembunyikan status setelah 3 detik
        setTimeout(() => {
            firebaseStatus.style.display = 'none';
        }, 3000);
    } else {
        firebaseStatus.textContent = "Firebase: Disconnected - Using offline mode";
        firebaseStatus.className = 'firebase-status firebase-disconnected';
        firebaseStatus.style.display = 'block';
    }
}

/**
 * Inisialisasi fallback ke localStorage ketika Firebase tidak tersedia
 */
function initLocalStorageFallback() {
    console.log("Menggunakan fallback localStorage");
    
    // Pastikan data statistik ada di localStorage
    if (!localStorage.getItem('complaintStats')) {
        const defaultStats = {
            total: 1256,
            processed: 843,
            resolved: 672,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('complaintStats', JSON.stringify(defaultStats));
    }
    
    // Pastikan data pengaduan ada di localStorage
    if (!localStorage.getItem('complaints')) {
        localStorage.setItem('complaints', JSON.stringify([]));
    }
}

/**
 * Menyimpan statistik ke Firebase
 * @param {number} total - Total pengaduan
 * @param {number} processed - Pengaduan yang sedang diproses
 * @param {number} resolved - Pengaduan yang terselesaikan
 * @returns {Promise<boolean>} Status penyimpanan
 */
async function saveStatsToFirebase(total, processed, resolved) {
    if (!firebaseInitialized) return false;
    
    try {
        await db.collection("stats").doc("complaintStats").set({
            total: total,
            processed: processed,
            resolved: resolved,
            lastUpdated: new Date()
        });
        
        console.log("Statistik berhasil disimpan ke Firebase");
        return true;
    } catch (error) {
        console.error("Error menyimpan statistik: ", error);
        return false;
    }
}

/**
 * Mengupload file ke Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} complaintId - ID pengaduan
 * @returns {Promise<Array>} Array of uploaded file URLs
 */
async function uploadFilesToFirebase(files, complaintId) {
    if (!firebaseInitialized || !files || files.length === 0) {
        return [];
    }
    
    const uploadPromises = [];
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop();
        const fileName = `${complaintId}_${Date.now()}_${i}.${fileExtension}`;
        const storageRef = storage.ref(`complaints/${complaintId}/${fileName}`);
        
        uploadPromises.push(
            storageRef.put(file).then(snapshot => {
                return snapshot.ref.getDownloadURL().then(url => {
                    uploadedUrls.push({
                        name: file.name,
                        url: url,
                        type: file.type
                    });
                    return url;
                });
            }).catch(error => {
                console.error("Error uploading file:", error);
                throw error;
            })
        );
    }
    
    try {
        await Promise.all(uploadPromises);
        return uploadedUrls;
    } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
    }
}

/**
 * Mendapatkan statistik dari Firebase
 * @returns {Promise<Object|null>} Data statistik atau null jika gagal
 */
async function getStatsFromFirebase() {
    if (!firebaseInitialized) return null;
    
    try {
        const doc = await db.collection("stats").doc("complaintStats").get();
        if (doc.exists) {
            return doc.data();
        } else {
            // Buat dokumen default jika tidak ada
            const defaultStats = {
                total: 1256,
                processed: 843,
                resolved: 672,
                lastUpdated: new Date()
            };
            
            await db.collection("stats").doc("complaintStats").set(defaultStats);
            return defaultStats;
        }
    } catch (error) {
        console.error("Error getting stats from Firebase:", error);
        return null;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initializeFirebase, 
        saveStatsToFirebase, 
        uploadFilesToFirebase, 
        getStatsFromFirebase,
        firebaseInitialized: () => firebaseInitialized,
        getDb: () => db,
        getStorage: () => storage
    };
}