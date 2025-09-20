// Main Application Module
// Mengkoordinasi modul-modul lainnya dan menangani inisialisasi aplikasi

import { initializeFirebase } from './firebase-client.js';
import { initMap } from './map.js';
import { initFormValidation, setupFormSubmission } from './form-validation.js';
import { initFileUpload } from './file-upload.js';
import { initComplaintsManager, displayComplaints, updateComplaintStatistics } from './complaints-manager.js';
import { initAdminPanel } from './admin-panel.js';

// Global state
let appInitialized = false;

/**
 * Inisialisasi komponen aplikasi
 */
async function initializeAppComponents() {
    try {
        // Inisialisasi Firebase
        const firebaseReady = await initializeFirebase();
        
        // Inisialisasi peta
        initMap();
        
        // Inisialisasi form
        initFormValidation();
        setupFormSubmission();
        
        // Inisialisasi file upload
        initFileUpload();
        
        // Inisialisasi manajer pengaduan
        initComplaintsManager();
        
        // Inisialisasi panel admin
        initAdminPanel();
        
        // Tampilkan statistik
        updateComplaintStatistics();
        
        // Tampilkan daftar pengaduan
        displayComplaints();
        
        // Inisialisasi social sharing
        initSocialSharing();
        
        // Inisialisasi navigasi
        initNavigation();
        
        appInitialized = true;
        console.log("Aplikasi berhasil diinisialisasi");
    } catch (error) {
        console.error("Error inisialisasi aplikasi:", error);
        showToast("Terjadi masalah dalam menginisialisasi aplikasi. Beberapa fitur mungkin tidak tersedia.", "error");
    }
}

/**
 * Inisialisasi social sharing buttons
 */
function initSocialSharing() {
    try {
        const currentUrl = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('AduanMasyarakat - Layanan Pengaduan Real-Time');
        
        document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
        document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?text=${title}&url=${currentUrl}`;
        document.getElementById('share-whatsapp').href = `https://wa.me/?text=${title}%20${currentUrl}`;
    } catch (error) {
        console.error("Error inisialisasi social sharing:", error);
    }
}

/**
 * Inisialisasi navigasi
 */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navClose = document.getElementById('nav-close');
    const navOverlay = document.getElementById('nav-overlay');
    const viewComplaintsLink = document.getElementById('view-complaints-link');
    
    // Fungsi untuk membuka menu navigasi
    function openNavMenu() {
        navMenu.classList.add('active');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        navToggle.setAttribute('aria-expanded', 'true');
    }
    
    // Fungsi untuk menutup menu navigasi
    function closeNavMenu() {
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        navToggle.setAttribute('aria-expanded', 'false');
    }
    
    // Event listeners
    if (navToggle) navToggle.addEventListener('click', openNavMenu);
    if (navClose) navClose.addEventListener('click', closeNavMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeNavMenu);
    
    // View complaints link
    if (viewComplaintsLink) {
        viewComplaintsLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeNavMenu();
            showComplaintsModal();
        });
    }
    
    // New complaint button in phone mockup
    const newComplaintBtn = document.getElementById('new-complaint-btn');
    if (newComplaintBtn) {
        newComplaintBtn.addEventListener('click', function() {
            document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

/**
 * Menampilkan modal daftar pengaduan
 */
function showComplaintsModal() {
    const complaintsList = document.getElementById('complaints-list');
    const complaintsModal = document.getElementById('complaints-modal');
    
    if (!complaintsList || !complaintsModal) return;
    
    showSkeletonLoading(complaintsList);
    
    // Simulasi loading
    setTimeout(() => {
        complaintsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        filterComplaints();
    }, 800);
}

/**
 * Menampilkan skeleton loading
 * @param {HTMLElement} container - Container element
 * @param {number} count - Jumlah skeleton items
 */
function showSkeletonLoading(container, count = 3) {
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="skeleton-card">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line" style="width: 40%"></div>
            </div>
        `;
    }
    container.innerHTML = skeletonHTML;
}

/**
 * Menampilkan toast notification
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe toast ('success', 'error', 'info')
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    if (!toast || !toastIcon || !toastMessage) return;
    
    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'toast-icon fas fa-check-circle';
    } else if (type === 'error') {
        toastIcon.className = 'toast-icon fas fa-exclamation-circle';
    } else {
        toastIcon.className = 'toast-icon fas fa-info-circle';
    }
    
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

/**
 * Escape HTML untuk mencegah XSS
 * @param {string} unsafe - String yang tidak aman
 * @returns {string} String yang sudah di-escape
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Inisialisasi aplikasi ketika DOM sudah siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppComponents);
} else {
    initializeAppComponents();
}

// Export functions untuk penggunaan di modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initializeAppComponents, 
        showToast, 
        escapeHtml,
        appInitialized: () => appInitialized
    };
}