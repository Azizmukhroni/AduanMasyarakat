// Firebase Client Module
// Menangani inisialisasi dan komunikasi dengan Firebase

import { firebaseConfig } from './config.js';

// ==================== CONSTANTS ====================
const DEFAULT_STATS = {
    total: 0,
    processed: 0,
    resolved: 0,
    lastUpdated: new Date().toISOString()
};

const CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    STATUS_DISPLAY_TIMEOUT_MS: 3000,
    MAX_FILE_SIZE_MB: 50,
    OFFLINE_QUEUE_KEY: 'firebaseOfflineQueue'
};

// ==================== GLOBAL STATE ====================
let firebaseInitialized = false;
let firebaseInitError = null;
let db = null;
let storage = null;
let initPromise = null;
let statusTimeoutId = null;
let offlineQueue = [];

// ==================== LOGGING ====================
const Logger = {
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    
    debug(message, data = null) {
        if (this.LOG_LEVEL === 'debug') {
            console.log(`[Firebase Debug] ${message}`, data);
        }
    },
    
    info(message, data = null) {
        if (['debug', 'info'].includes(this.LOG_LEVEL)) {
            console.log(`[Firebase Info] ${message}`, data);
        }
    },
    
    warn(message, data = null) {
        if (['debug', 'info', 'warn'].includes(this.LOG_LEVEL)) {
            console.warn(`[Firebase Warn] ${message}`, data);
        }
    },
    
    error(message, error = null) {
        console.error(`[Firebase Error] ${message}`, error);
    }
};

// ==================== INITIALIZATION ====================
/**
 * Memastikan Firebase sudah diinisialisasi
 * Menggunakan Promise-based queue untuk menghindari race condition
 * @returns {Promise<boolean>} Status inisialisasi
 */
async function ensureFirebaseInitialized() {
    if (firebaseInitialized) {
        return true;
    }
    
    if (!initPromise) {
        initPromise = initializeFirebase();
    }
    
    return initPromise;
}

/**
 * Inisialisasi Firebase dengan retry logic
 * @returns {Promise<boolean>} Status inisialisasi
 */
async function initializeFirebase() {
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            Logger.info(`Inisialisasi Firebase (attempt ${attempt}/${CONFIG.MAX_RETRIES})`);
            
            // Cek jika Firebase SDK sudah di-load
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK tidak ditemukan. Pastikan Firebase sudah di-load di HTML.');
            }
            
            // Cek apakah app sudah diinisialisasi sebelumnya
            if (firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            
            // Inisialisasi services
            db = firebase.firestore();
            storage = firebase.storage();
            firebaseInitialized = true;
            firebaseInitError = null;
            
            Logger.info('Firebase berhasil diinisialisasi');
            updateFirebaseStatus('connected');
            
            // Sync offline queue setelah connected
            await syncOfflineQueue();
            
            return true;
        } catch (error) {
            firebaseInitError = error;
            Logger.error(`Firebase initialization failed (attempt ${attempt})`, error);
            
            if (attempt < CONFIG.MAX_RETRIES) {
                await delay(CONFIG.RETRY_DELAY_MS * attempt);
            }
        }
    }
    
    // Semua retry gagal
    firebaseInitialized = false;
    Logger.error('Semua retry inisialisasi Firebase gagal');
    updateFirebaseStatus('disconnected');
    initLocalStorageFallback();
    
    return false;
}

/**
 * Delay helper untuk retry logic
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== UI STATUS ====================
/**
 * Update status koneksi Firebase di UI
 * @param {string} status - Status koneksi ('connected' atau 'disconnected')
 */
function updateFirebaseStatus(status) {
    const firebaseStatusEl = document.getElementById('firebase-status');
    if (!firebaseStatusEl) {
        Logger.debug('Element #firebase-status tidak ditemukan');
        return;
    }
    
    // Clear previous timeout
    if (statusTimeoutId) {
        clearTimeout(statusTimeoutId);
        statusTimeoutId = null;
    }
    
    if (status === 'connected') {
        firebaseStatusEl.textContent = 'Firebase: Connected';
        firebaseStatusEl.className = 'firebase-status firebase-connected';
        firebaseStatusEl.style.display = 'block';
        
        // Auto-hide after timeout
        statusTimeoutId = setTimeout(() => {
            if (firebaseStatusEl.style.display === 'block') {
                firebaseStatusEl.style.display = 'none';
            }
            statusTimeoutId = null;
        }, CONFIG.STATUS_DISPLAY_TIMEOUT_MS);
    } else {
        firebaseStatusEl.textContent = 'Firebase: Disconnected - Using offline mode';
        firebaseStatusEl.className = 'firebase-status firebase-disconnected';
        firebaseStatusEl.style.display = 'block';
    }
}

// ==================== OFFLINE STORAGE ====================
/**
 * Inisialisasi fallback ke localStorage ketika Firebase tidak tersedia
 */
function initLocalStorageFallback() {
    try {
        Logger.info('Menggunakan fallback localStorage');
        
        if (!localStorage.getItem('complaintStats')) {
            localStorage.setItem('complaintStats', JSON.stringify(DEFAULT_STATS));
        }
        
        if (!localStorage.getItem('complaints')) {
            localStorage.setItem('complaints', JSON.stringify([]));
        }
        
        if (!localStorage.getItem(CONFIG.OFFLINE_QUEUE_KEY)) {
            localStorage.setItem(CONFIG.OFFLINE_QUEUE_KEY, JSON.stringify([]));
        }
        
        loadOfflineQueue();
    } catch (error) {
        Logger.error('Error initializing localStorage fallback', error);
    }
}

/**
 * Load offline queue dari localStorage
 */
function loadOfflineQueue() {
    try {
        const queueStr = localStorage.getItem(CONFIG.OFFLINE_QUEUE_KEY);
        offlineQueue = queueStr ? JSON.parse(queueStr) : [];
        Logger.debug(`Offline queue loaded: ${offlineQueue.length} items`);
    } catch (error) {
        Logger.error('Error loading offline queue', error);
        offlineQueue = [];
    }
}

/**
 * Simpan offline queue ke localStorage
 */
function saveOfflineQueue() {
    try {
        localStorage.setItem(CONFIG.OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch (error) {
        Logger.error('Error saving offline queue', error);
    }
}

/**
 * Queue write operation untuk dieksekusi nanti
 * @param {string} operation - Nama operasi ('saveStats', 'uploadFiles', dll)
 * @param {Object} data - Data untuk operasi
 */
function queueOfflineWrite(operation, data) {
    const queueItem = {
        id: `${operation}_${Date.now()}`,
        operation,
        data,
        timestamp: new Date().toISOString()
    };
    
    offlineQueue.push(queueItem);
    saveOfflineQueue();
    Logger.info(`Operasi queued: ${operation}`, queueItem);
}

/**
 * Sync offline queue ke Firebase
 */
async function syncOfflineQueue() {
    if (offlineQueue.length === 0) {
        Logger.debug('Offline queue kosong, skip sync');
        return;
    }
    
    Logger.info(`Syncing offline queue: ${offlineQueue.length} items`);
    const failedItems = [];
    
    for (const item of offlineQueue) {
        try {
            switch (item.operation) {
                case 'saveStats':
                    const { total, processed, resolved } = item.data;
                    await saveStatsToFirebase(total, processed, resolved);
                    break;
                    
                default:
                    Logger.warn(`Unknown offline operation: ${item.operation}`);
                    failedItems.push(item);
            }
        } catch (error) {
            Logger.error(`Error syncing offline item ${item.id}`, error);
            failedItems.push(item);
        }
    }
    
    // Update queue dengan failed items saja
    offlineQueue = failedItems;
    saveOfflineQueue();
    Logger.info(`Offline queue sync completed. Failed: ${failedItems.length}`);
}

// ==================== STATISTICS ====================
/**
 * Validasi stats
 * @param {number} total
 * @param {number} processed
 * @param {number} resolved
 * @returns {boolean}
 */
function validateStats(total, processed, resolved) {
    if (typeof total !== 'number' || total < 0 ||
        typeof processed !== 'number' || processed < 0 ||
        typeof resolved !== 'number' || resolved < 0) {
        return false;
    }
    
    if (processed > total || resolved > processed) {
        return false;
    }
    
    return true;
}

/**
 * Menyimpan statistik ke Firebase
 * @param {number} total - Total pengaduan
 * @param {number} processed - Pengaduan yang sedang diproses
 * @param {number} resolved - Pengaduan yang terselesaikan
 * @returns {Promise<boolean>} Status penyimpanan
 */
async function saveStatsToFirebase(total, processed, resolved) {
    try {
        // Validasi input
        if (!validateStats(total, processed, resolved)) {
            throw new Error('Invalid stats: harus angka non-negatif dan processed ≤ total, resolved ≤ processed');
        }
        
        // Ensure Firebase initialized
        if (!await ensureFirebaseInitialized()) {
            Logger.warn('Firebase belum terhubung, queue untuk sync nanti');
            queueOfflineWrite('saveStats', { total, processed, resolved });
            return false;
        }
        
        await db.collection('stats').doc('complaintStats').set({
            total,
            processed,
            resolved,
            lastUpdated: new Date()
        });
        
        Logger.info('Statistik berhasil disimpan ke Firebase');
        return true;
    } catch (error) {
        Logger.error('Error menyimpan statistik', error);
        // Fallback ke localStorage
        try {
            localStorage.setItem('complaintStats', JSON.stringify({
                total, processed, resolved,
                lastUpdated: new Date().toISOString()
            }));
            Logger.info('Statistik disimpan ke localStorage (fallback)');
        } catch (localError) {
            Logger.error('Error menyimpan statistik ke localStorage', localError);
        }
        return false;
    }
}

/**
 * Mendapatkan statistik dari Firebase
 * @returns {Promise<Object>} Data statistik
 */
async function getStatsFromFirebase() {
    try {
        if (!await ensureFirebaseInitialized()) {
            Logger.warn('Firebase belum terhubung, menggunakan localStorage');
            return getStatsFromLocalStorage();
        }
        
        const doc = await db.collection('stats').doc('complaintStats').get();
        
        if (doc.exists) {
            const data = doc.data();
            Logger.debug('Statistik dari Firebase:', data);
            return data;
        } else {
            Logger.info('Dokumen statistik tidak ada, membuat default');
            await db.collection('stats').doc('complaintStats').set(DEFAULT_STATS);
            return DEFAULT_STATS;
        }
    } catch (error) {
        Logger.error('Error getting stats from Firebase', error);
        return getStatsFromLocalStorage();
    }
}

/**
 * Get stats dari localStorage
 * @returns {Object} Data statistik
 */
function getStatsFromLocalStorage() {
    try {
        const data = localStorage.getItem('complaintStats');
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        Logger.error('Error getting stats from localStorage', error);
    }
    return DEFAULT_STATS;
}

// ==================== FILE UPLOAD ====================
/**
 * Validasi file
 * @param {File} file
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateFile(file) {
    if (!file || !(file instanceof File)) {
        return { valid: false, error: 'File tidak valid' };
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > CONFIG.MAX_FILE_SIZE_MB) {
        return { 
            valid: false, 
            error: `File terlalu besar (max ${CONFIG.MAX_FILE_SIZE_MB}MB, got ${fileSizeMB.toFixed(2)}MB)` 
        };
    }
    
    return { valid: true, error: null };
}

/**
 * Validasi complaint ID
 * @param {string} complaintId
 * @returns {boolean}
 */
function validateComplaintId(complaintId) {
    return typeof complaintId === 'string' && complaintId.trim().length > 0;
}

/**
 * Mengupload file ke Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} complaintId - ID pengaduan
 * @returns {Promise<Array>} Array of uploaded file URLs
 * @throws {Error} Jika upload gagal
 */
async function uploadFilesToFirebase(files, complaintId) {
    try {
        // Validasi input
        if (!validateComplaintId(complaintId)) {
            throw new Error('Complaint ID tidak valid');
        }
        
        if (!Array.isArray(files) || files.length === 0) {
            Logger.warn('Tidak ada file untuk diupload');
            return [];
        }
        
        // Validate each file
        const fileValidations = files.map((file, idx) => {
            const validation = validateFile(file);
            if (!validation.valid) {
                Logger.error(`File #${idx} validation failed`, validation.error);
            }
            return validation;
        });
        
        if (fileValidations.some(v => !v.valid)) {
            throw new Error('Beberapa file tidak valid: ' + fileValidations.find(v => !v.valid)?.error);
        }
        
        // Ensure Firebase initialized
        if (!await ensureFirebaseInitialized()) {
            throw new Error('Firebase belum terhubung');
        }
        
        Logger.info(`Uploading ${files.length} files for complaint ${complaintId}`);
        
        const uploadPromises = files.map((file, index) => 
            uploadSingleFile(file, complaintId, index)
        );
        
        const uploadedUrls = await Promise.all(uploadPromises);
        
        Logger.info(`Successfully uploaded ${uploadedUrls.length} files`);
        return uploadedUrls;
    } catch (error) {
        Logger.error('Error uploading files', error);
        throw error;
    }
}

/**
 * Upload single file to Firebase Storage
 * @param {File} file
 * @param {string} complaintId
 * @param {number} index
 * @returns {Promise<Object>}
 */
async function uploadSingleFile(file, complaintId, index) {
    try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${complaintId}_${Date.now()}_${index}.${fileExtension}`;
        const storagePath = `complaints/${complaintId}/${fileName}`;
        
        Logger.debug(`Uploading: ${storagePath}`);
        
        const storageRef = storage.ref(storagePath);
        const snapshot = await storageRef.put(file);
        const url = await snapshot.ref.getDownloadURL();
        
        const result = {
            name: file.name,
            url,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
        };
        
        Logger.debug(`File uploaded successfully`, result);
        return result;
    } catch (error) {
        Logger.error(`Error uploading file ${file.name}`, error);
        throw error;
    }
}

// ==================== EXPORTS ====================
export {
    // Initialization
    ensureFirebaseInitialized,
    initializeFirebase,
    
    // Statistics
    saveStatsToFirebase,
    getStatsFromFirebase,
    
    // File Upload
    uploadFilesToFirebase,
    
    // Getters
    getDb: () => db,
    getStorage: () => storage,
    isFirebaseInitialized: () => firebaseInitialized,
    getFirebaseError: () => firebaseInitError,
    
    // Offline Queue
    getOfflineQueue: () => [...offlineQueue],
    syncOfflineQueue,
    
    // Logger (for config)
    Logger,
    
    // Config (for testing/override)
    CONFIG,
    DEFAULT_STATS
};

// Compatibility: CommonJS export if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ensureFirebaseInitialized,
        initializeFirebase,
        saveStatsToFirebase,
        getStatsFromFirebase,
        uploadFilesToFirebase,
        getDb: () => db,
        getStorage: () => storage,
        isFirebaseInitialized: () => firebaseInitialized,
        getFirebaseError: () => firebaseInitError,
        getOfflineQueue: () => [...offlineQueue],
        syncOfflineQueue,
        Logger,
        CONFIG,
        DEFAULT_STATS
    };
}
