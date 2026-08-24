// ============================================
// admin-panel.js - Statistik Real-time dari Firestore
// ============================================

import { db } from './firebase-client.js';
import { showToast } from './utils.js';

/**
 * INISIALISASI PANEL ADMIN
 * - Menampilkan statistik real-time dari Firestore
 * - Update otomatis saat ada perubahan data
 */
export function initAdminPanel() {
    // Ambil elemen DOM
    const statsElements = {
        total: document.getElementById('stats-total') || document.getElementById('total-complaints'),
        diproses: document.getElementById('stats-diproses') || document.getElementById('processed-complaints'),
        selesai: document.getElementById('stats-selesai') || document.getElementById('resolved-complaints')
    };

    // Cek apakah elemen tersedia
    if (!statsElements.total) {
        console.warn('⚠️ Elemen statistik tidak ditemukan di DOM');
        return;
    }

    // Mulai listen ke perubahan data
    let unsubscribe = null;

    /**
     * LISTEN REAL-TIME - Update otomatis dari Firestore
     */
    function startListening() {
        // Hentikan listener sebelumnya
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        // Cek apakah db tersedia
        if (!db) {
            console.error('❌ Firebase db tidak tersedia');
            showToast('Gagal terhubung ke database', 'error');
            return;
        }

        // Gunakan onSnapshot untuk real-time
        unsubscribe = db.collection('pengaduan')
            .onSnapshot(
                (snapshot) => {
                    updateStats(snapshot, statsElements);
                },
                (error) => {
                    console.error('❌ Error listening to stats:', error);
                    showToast('Gagal memuat statistik dari server', 'error');
                    
                    // Fallback: coba ambil dari localStorage
                    loadStatsFromLocalStorage(statsElements);
                }
            );
    }

    /**
     * UPDATE STATISTIK - Hitung dari data Firestore
     */
    function updateStats(snapshot, elements) {
        const docs = snapshot.docs;
        const total = docs.length;

        // Hitung status
        let diproses = 0;
        let selesai = 0;
        let ditolak = 0;

        docs.forEach(doc => {
            const data = doc.data();
            const status = (data.status || 'diproses').toLowerCase();
            
            if (status === 'selesai' || status === 'solved' || status === 'resolved') {
                selesai++;
            } else if (status === 'ditolak' || status === 'rejected') {
                ditolak++;
            } else {
                diproses++; // pending, diproses, etc
            }
        });

        // Update UI dengan animasi
        animateNumber(elements.total, total);
        animateNumber(elements.diproses, diproses);
        animateNumber(elements.selesai, selesai);

        // Simpan ke localStorage sebagai cadangan
        saveStatsToLocalStorage(total, diproses, selesai);

        console.log(`📊 Stats updated: Total=${total}, Diproses=${diproses}, Selesai=${selesai}`);
    }

    /**
     * ANIMASI ANGKA
     */
    function animateNumber(element, targetValue) {
        if (!element) return;

        const currentValue = parseInt(element.textContent.replace(/\D/g, '')) || 0;
        if (currentValue === targetValue) return;

        const duration = 500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(currentValue + (targetValue - currentValue) * eased);
            
            element.textContent = current.toLocaleString('id-ID');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue.toLocaleString('id-ID');
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * SAVE TO LOCALSTORAGE - Sebagai fallback
     */
    function saveStatsToLocalStorage(total, diproses, selesai) {
        try {
            localStorage.setItem('admin-stats', JSON.stringify({
                total,
                diproses,
                selesai,
                lastUpdate: new Date().toISOString()
            }));
        } catch (e) {
            // Ignore
        }
    }

    /**
     * LOAD FROM LOCALSTORAGE - Fallback saat offline
     */
    function loadStatsFromLocalStorage(elements) {
        try {
            const data = JSON.parse(localStorage.getItem('admin-stats'));
            if (data) {
                elements.total.textContent = data.total.toLocaleString('id-ID');
                elements.diproses.textContent = data.diproses.toLocaleString('id-ID');
                elements.selesai.textContent = data.selesai.toLocaleString('id-ID');
                console.log('📊 Stats loaded from localStorage (fallback)');
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * AMBIL STATISTIK SEKALI (tanpa real-time)
     */
    async function fetchStatsOnce() {
        try {
            if (!db) {
                throw new Error('Firebase db tidak tersedia');
            }
            const snapshot = await db.collection('pengaduan').get();
            updateStats(snapshot, statsElements);
            return true;
        } catch (error) {
            console.error('Error fetching stats:', error);
            loadStatsFromLocalStorage(statsElements);
            return false;
        }
    }

    /**
     * HENTIKAN LISTENER
     */
    function stopListening() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
            console.log('🛑 Stats listener stopped');
        }
    }

    // ============================================
    // INIT - Mulai listening
    // ============================================
    
    // Tunggu koneksi Firebase siap
    const checkFirebase = setInterval(() => {
        if (typeof db !== 'undefined' && db) {
            clearInterval(checkFirebase);
            startListening();
        }
    }, 500);

    // Timeout jika Firebase tidak kunjung siap
    setTimeout(() => {
        clearInterval(checkFirebase);
        if (!unsubscribe) {
            console.warn('⚠️ Firebase tidak siap, pakai localStorage');
            loadStatsFromLocalStorage(statsElements);
        }
    }, 5000);

    // ============================================
    // TOMBOL ADMIN (Opsional untuk debugging)
    // ============================================
    setupAdminControls();

    // Return functions untuk digunakan di luar
    return {
        startListening,
        stopListening,
        fetchStatsOnce,
        refresh: fetchStatsOnce
    };
}

/**
 * SETUP TOMBOL ADMIN (untuk debugging/testing)
 */
function setupAdminControls() {
    const refreshBtn = document.getElementById('refresh-stats-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            try {
                const snapshot = await db.collection('pengaduan').get();
                const elements = {
                    total: document.getElementById('stats-total'),
                    diproses: document.getElementById('stats-diproses'),
                    selesai: document.getElementById('stats-selesai')
                };
                // Fungsi updateStats ada di scope initAdminPanel
                // Kita trigger ulang
                location.reload();
            } catch (e) {
                showToast('Gagal refresh statistik', 'error');
            }
        });
    }
}
