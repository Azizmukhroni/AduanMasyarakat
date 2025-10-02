// js/main.js
// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('AduanMasyarakat App Initializing...');
    
    // Initialize all modules
    initializeApp();
});

function initializeApp() {
    // 1. Initialize Firebase
    initializeFirebase();
    
    // 2. Initialize Map
    initMap();
    
    // 3. Initialize Form Progress
    FormProgressManager.init();
    
    // 4. Initialize Form Validation
    FormValidator.init();
    
    // 5. Initialize Autosave
    AutoSaveManager.init();
    
    // 6. Initialize Social Sharing
    initSocialSharing();
    
    // 7. Initialize Statistics
    updateComplaintStatistics();
    
    // 8. Initialize Complaints Display
    displayComplaints();
    
    // 9. Setup event listeners
    setupEventListeners();
    
    // 10. Register Service Worker
    registerServiceWorker();
    
    console.log('AduanMasyarakat App Initialized Successfully');
}

function setupEventListeners() {
    // Navigation
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (navToggle) navToggle.addEventListener('click', openNavMenu);
    if (navClose) navClose.addEventListener('click', closeNavMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeNavMenu);
    
    // Complaints Modal
    const viewComplaintsLink = document.getElementById('view-complaints-link');
    const complaintsClose = document.getElementById('complaints-close');
    
    if (viewComplaintsLink) {
        viewComplaintsLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeNavMenu();
            showComplaintsModal();
        });
    }
    
    if (complaintsClose) {
        complaintsClose.addEventListener('click', function() {
            complaintsModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Form submission
    const form = document.getElementById('complaint-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Search and filter
    const searchInput = document.getElementById('search-complaints');
    const filterCategory = document.getElementById('filter-category');
    const filterStatus = document.getElementById('filter-status');
    const filterDate = document.getElementById('filter-date');
    
    if (searchInput) searchInput.addEventListener('input', filterComplaints);
    if (filterCategory) filterCategory.addEventListener('change', filterComplaints);
    if (filterStatus) filterStatus.addEventListener('change', filterComplaints);
    if (filterDate) filterDate.addEventListener('change', filterComplaints);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/js/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    // Report error to analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: e.error.message,
            fatal: false
        });
    }
});