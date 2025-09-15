import { saveStatsToFirebase, saveStatsToLocalStorage } from './firebase-client.js';
import { showToast, animateValue } from './utils.js';
import { firebaseInitialized } from './config.js';

/**
 * Inisialisasi panel admin
 */
function initAdminPanel() {
    const adminToggle = document.getElementById('admin-toggle');
    const adminPanel = document.getElementById('admin-panel');
    const updateStatsBtn = document.getElementById('update-stats-btn');
    const autoIncreaseBtn = document.getElementById('auto-increase-btn');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    
    if (!adminToggle || !adminPanel) return;
    
    // Toggle panel admin
    adminToggle.addEventListener('click', function() {
        adminPanel.classList.toggle('active');
    });
    
    // Update statistik dari input admin
    if (updateStatsBtn) {
        updateStatsBtn.addEventListener('click', function() {
            const total = parseInt(document.getElementById('total-input').value) || 0;
            const processed = parseInt(document.getElementById('processed-input').value) || 0;
            const resolved = parseInt(document.getElementById('resolved-input').value) || 0;
            
            // Coba simpan ke Firebase, jika gagal gunakan localStorage
            const firebaseSuccess = saveStatsToFirebase(total, processed, resolved);
            if (!firebaseSuccess) {
                saveStatsToLocalStorage(total, processed, resolved);
            }
            
            // Update tampilan
            animateValue('total-complaints', parseInt(document.getElementById('total-complaints').innerText) || 0, total, 1000);
            animateValue('processed-complaints', parseInt(document.getElementById('processed-complaints').innerText) || 0, processed, 1000);
            animateValue('resolved-complaints', parseInt(document.getElementById('resolved-complaints').innerText) || 0, resolved, 1000);
            
            // Reset form
            document.getElementById('total-input').value = '';
            document.getElementById('processed-input').value = '';
            document.getElementById('resolved-input').value = '';
        });
    }
    
    // Auto increase statistik
    if (autoIncreaseBtn) {
        autoIncreaseBtn.addEventListener('click', function() {
            const currentTotal = parseInt(document.getElementById('total-complaints').innerText.replace(/,/g, '')) || 0;
            const currentProcessed = parseInt(document.getElementById('processed-complaints').innerText.replace(/,/g, '')) || 0;
            const currentResolved = parseInt(document.getElementById('resolved-complaints').innerText.replace(/,/g, '')) || 0;
            
            const newTotal = currentTotal + Math.floor(Math.random() * 10) + 1;
            const newProcessed = currentProcessed + Math.floor(Math.random() * 8) + 1;
            const newResolved = currentResolved + Math.floor(Math.random() * 5) + 1;
            
            // Coba simpan ke Firebase, jika gagal gunakan localStorage
            const firebaseSuccess = saveStatsToFirebase(newTotal, newProcessed, newResolved);
            if (!firebaseSuccess) {
                saveStatsToLocalStorage(newTotal, newProcessed, newResolved);
            }
            
            // Update tampilan
            animateValue('total-complaints', currentTotal, newTotal, 1000);
            animateValue('processed-complaints', currentProcessed, newProcessed, 1000);
            animateValue('resolved-complaints', currentResolved, newResolved, 1000);
        });
    }
    
    // Reset statistik
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', function() {
            // Coba simpan ke Firebase, jika gagal gunakan localStorage
            const firebaseSuccess = saveStatsToFirebase(0, 0, 0);
            if (!firebaseSuccess) {
                saveStatsToLocalStorage(0, 0, 0);
            }
            
            // Update tampilan
            animateValue('total-complaints', parseInt(document.getElementById('total-complaints').innerText.replace(/,/g, '')) || 0, 0, 1000);
            animateValue('processed-complaints', parseInt(document.getElementById('processed-complaints').innerText.replace(/,/g, '')) || 0, 0, 1000);
            animateValue('resolved-complaints', parseInt(document.getElementById('resolved-complaints').innerText.replace(/,/g, '')) || 0, 0, 1000);
        });
    }
}

// Export functions
export { initAdminPanel };