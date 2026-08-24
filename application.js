// Main Application Module
// Mengkoordinasi modul-modul lainnya dan menangani inisialisasi aplikasi

// Lazily import heavier modules (firebase, map) inside initializeAppComponents
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
        // Lazy-load Firebase (to improve initial bundle/load)
        const { initializeFirebase } = await import('./firebase-client.js');
        await initializeFirebase();

        // Lazy-load Map (maps can be heavy)
        const { initMap } = await import('./map.js');
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

        // Tampilkan daftar pengaduan (may return a Promise; awaiting is safe)
        await displayComplaints();

        // Inisialisasi social sharing
        initSocialSharing();

        // Inisialisasi navigasi
        initNavigation();

        appInitialized = true;
        console.log("Aplikasi berhasil diinisialisasi");
    } catch (error) {
        console.error("Error inisialisasi aplikasi:", error);
        // Try to show a toast; if toast doesn't exist, still log the error
        try { showToast("Terjadi masalah dalam menginisialisasi aplikasi. Beberapa fitur mungkin tidak tersedia.", "error"); } catch (_) {}
    }
}

/**
 * Inisialisasi social sharing buttons
 */
function initSocialSharing() {
    try {
        const currentUrl = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('AduanMasyarakat - Layanan Pengaduan Real-Time');

        const fb = document.getElementById('share-facebook');
        const tw = document.getElementById('share-twitter');
        const wa = document.getElementById('share-whatsapp');

        if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
        if (tw) tw.href = `https://twitter.com/intent/tweet?text=${title}&url=${currentUrl}`;
        if (wa) wa.href = `https://wa.me/?text=${title}%20${currentUrl}`;
    } catch (error) {
        console.error("Error inisialisasi social sharing:", error);
    }
}

/**
 * Menemukan focusable element inside a container
 */
function findFirstFocusable(container) {
    if (!container) return null;
    return container.querySelector('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
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
        if (navMenu) navMenu.classList.add('active');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');

        // Set focus to first focusable element inside nav for accessibility
        const first = findFirstFocusable(navMenu);
        if (first) first.focus();
    }

    // Fungsi untuk menutup menu navigasi
    function closeNavMenu() {
        if (navMenu) navMenu.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        // return focus to toggle if present
        if (navToggle) navToggle.focus();
    }

    // Close on Escape key
    function handleKeydown(e) {
        if (e.key === 'Escape') {
            // If nav is active, close it. Also allow closing other overlays in future.
            if ((navMenu && navMenu.classList.contains('active')) || (navOverlay && navOverlay.classList.contains('active'))) {
                closeNavMenu();
            }
        }
    }

    // Event listeners (only attach handlers when elements exist)
    if (navToggle) navToggle.addEventListener('click', openNavMenu);
    if (navClose) navClose.addEventListener('click', closeNavMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeNavMenu);
    document.addEventListener('keydown', handleKeydown);

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
            const formSection = document.getElementById('form-section');
            if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

/**
 * Menampilkan modal daftar pengaduan
 */
async function showComplaintsModal() {
    const complaintsList = document.getElementById('complaints-list');
    const complaintsModal = document.getElementById('complaints-modal');

    if (!complaintsList || !complaintsModal) return;

    showSkeletonLoading(complaintsList);

    try {
        // Await displayComplaints in case it returns a Promise (safe for both sync/async)
        await displayComplaints();

        complaintsModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Call filterComplaints if defined globally (guarded)
        if (typeof filterComplaints === 'function') {
            filterComplaints();
        }
    } catch (err) {
        // Fallback to previous behavior (graceful)
        console.warn('Error loading complaints, showing modal after delay:', err);
        setTimeout(() => {
            complaintsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (typeof filterComplaints === 'function') filterComplaints();
        }, 800);
    }
}

/**
 * Menampilkan skeleton loading
 * @param {HTMLElement} container - Container element
 * @param {number} count - Jumlah skeleton items
 */
function showSkeletonLoading(container, count = 3) {
    if (!container) return;
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="skeleton-card" aria-hidden="true">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line" style="width: 40%"></div>
            </div>
        `;
    }
    // Setting innerHTML is acceptable for skeleton markup but avoid inserting untrusted content here
    container.innerHTML = skeletonHTML;
}

/**
 * Menampilkan toast notification
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe toast ('success', 'error', 'info')
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        // If there's no toast container, fallback to console and noop
        console[type === 'error' ? 'error' : 'log']('Toast:', message);
        return;
    }

    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');

    if (!toastIcon || !toastMessage) return;

    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'toast-icon fas fa-check-circle';
    } else if (type === 'error') {
        toastIcon.className = 'toast-icon fas fa-exclamation-circle';
    } else {
        toastIcon.className = 'toast-icon fas fa-info-circle';
    }

    toastMessage.textContent = String(message);
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        // Remove only the show class to preserve potential other classnames
        toast.classList.remove('show');
        // Reset type classes if present - simple approach
        toast.classList.remove('success', 'error', 'info');
    }, 3000);
}

/**
 * Escape HTML untuk mencegah XSS
 * @param {any} unsafe - String yang tidak aman
 * @returns {string} String yang sudah di-escape
 */
function escapeHtml(unsafe) {
    // Convert non-strings safely to string (null/undefined -> "null"/"undefined"; if you prefer empty, adjust)
    const str = String(unsafe === null || unsafe === undefined ? '' : unsafe);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Inisialisasi aplikasi ketika DOM sudah siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppComponents);
} else {
    // No await here; initializeAppComponents is async but we don't need to block
    initializeAppComponents();
}

// ES module exports (consistent with `import` above)
const isAppInitialized = () => appInitialized;
export { initializeAppComponents, showToast, escapeHtml, isAppInitialized };