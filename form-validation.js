import { APP_CONFIG } from './config.js';

/**
 * Update lokasi input berdasarkan marker
 * @param {L.Marker} marker - Marker peta
 */
function updateLocationInput(marker) {
    const latLng = marker.getLatLng();
    document.getElementById('location').value = `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
}

/**
 * Validasi form
 * @returns {boolean} Status validasi
 */
function validateForm() {
    let isValid = true;
    
    // Validasi nama
    const name = document.getElementById('name').value.trim();
    if (!name) {
        document.getElementById('name').parentElement.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('name').parentElement.classList.remove('error');
    }
    
    // Validasi email
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.getElementById('email').parentElement.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('email').parentElement.classList.remove('error');
    }
    
    // Validasi telepon (opsional)
    const phone = document.getElementById('phone').value.trim();
    if (phone) {
        const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
        if (!phoneRegex.test(phone)) {
            document.getElementById('phone').parentElement.classList.add('error');
            isValid = false;
        } else {
            document.getElementById('phone').parentElement.classList.remove('error');
        }
    }
    
    // Validasi lokasi
    const location = document.getElementById('location').value.trim();
    if (!location) {
        document.getElementById('location').parentElement.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('location').parentElement.classList.remove('error');
    }
    
    // Validasi kategori
    const category = document.getElementById('category').value;
    if (!category) {
        document.getElementById('category').parentElement.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('category').parentElement.classList.remove('error');
    }
    
    // Validasi deskripsi
    const description = document.getElementById('description').value.trim();
    if (!description) {
        document.getElementById('description').parentElement.classList.add('error');
        isValid = false;
    } else {
        document.getElementById('description').parentElement.classList.remove('error');
    }
    
    return isValid;
}

/**
 * Setup form submission
 */
function setupFormSubmission() {
    const form = document.getElementById('complaint-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Harap perbaiki kesalahan pada form sebelum mengirim.', 'error');
            return;
        }
        
        // Handle form submission
        handleFormSubmission(form);
    });
}

/**
 * Handle form submission
 * @param {HTMLFormElement} form - Form element
 */
async function handleFormSubmission(form) {
    // Implementasi form submission
    console.log('Form submitted', form);
}

/**
 * Inisialisasi validasi form
 */
function initFormValidation() {
    // Setup event listeners untuk validasi real-time
    const inputs = document.querySelectorAll('#complaint-form input, #complaint-form textarea, #complaint-form select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateForm);
    });
}

// Export functions
export { 
    initFormValidation, 
    setupFormSubmission, 
    validateForm, 
    updateLocationInput 
};