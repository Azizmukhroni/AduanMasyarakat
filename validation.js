// js/validation.js
const SecurityUtils = {
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return input;
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    validateEmail: function(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },
    
    validatePhone: function(phone) {
        if (!phone) return true; // Phone optional
        
        const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,3}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}$/;
        return re.test(String(phone).replace(/\s/g, ''));
    },
    
    validateLocation: function(location) {
        // Validasi format koordinat (contoh: -6.208763, 106.845599)
        const coordRegex = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
        return coordRegex.test(location);
    },
    
    preventXSS: function(obj) {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    sanitized[key] = this.sanitizeInput(obj[key]);
                } else {
                    sanitized[key] = obj[key];
                }
            }
        }
        return sanitized;
    },
    
    validateFile: function(file, maxSize = 5 * 1024 * 1024) {
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        if (!validTypes.includes(file.type)) {
            return { isValid: false, error: 'Hanya file JPG, PNG, dan PDF yang diizinkan' };
        }
        
        if (file.size > maxSize) {
            return { isValid: false, error: 'Ukuran file maksimal 5MB' };
        }
        
        return { isValid: true, error: null };
    }
};

const FormValidator = {
    init: function() {
        this.setupRealTimeValidation();
    },
    
    setupRealTimeValidation: function() {
        const fields = {
            'name': { required: true, validator: (value) => value.trim().length >= 2 },
            'email': { required: true, validator: SecurityUtils.validateEmail },
            'phone': { required: false, validator: SecurityUtils.validatePhone },
            'location': { required: true, validator: SecurityUtils.validateLocation },
            'category': { required: true, validator: (value) => value !== '' },
            'description': { required: true, validator: (value) => value.trim().length >= 10 }
        };
        
        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId, fields[fieldId]));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });
    },
    
    validateField: function(fieldId, rules) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        // Clear previous error
        this.clearFieldError(fieldId);
        
        // Check required field
        if (rules.required && !value) {
            this.showFieldError(fieldId, 'Field ini wajib diisi');
            return false;
        }
        
        // Skip validation if field is empty and not required
        if (!rules.required && !value) {
            return true;
        }
        
        // Custom validation
        if (!rules.validator(value)) {
            let errorMessage = 'Format tidak valid';
            
            // Custom error messages
            switch(fieldId) {
                case 'email':
                    errorMessage = 'Format email tidak valid';
                    break;
                case 'phone':
                    errorMessage = 'Format nomor telepon tidak valid';
                    break;
                case 'location':
                    errorMessage = 'Silakan pilih lokasi dari peta';
                    break;
                case 'description':
                    errorMessage = 'Deskripsi minimal 10 karakter';
                    break;
            }
            
            this.showFieldError(fieldId, errorMessage);
            return false;
        }
        
        // Valid
        field.parentElement.classList.add('valid');
        return true;
    },
    
    showFieldError: function(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        field.parentElement.classList.add('error');
        field.parentElement.classList.remove('valid');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },
    
    clearFieldError: function(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        field.parentElement.classList.remove('error');
        field.parentElement.classList.remove('valid');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },
    
    validateForm: function() {
        let isValid = true;
        
        const fields = ['name', 'email', 'location', 'category', 'description'];
        
        fields.forEach(fieldId => {
            if (!this.validateField(fieldId, { required: true, validator: () => true })) {
                isValid = false;
            }
        });
        
        // Validasi CAPTCHA
        const storedCaptcha = sessionStorage.getItem('form_captcha');
        const enteredCaptcha = document.getElementById('captcha').value;
        
        if (!enteredCaptcha || enteredCaptcha.toUpperCase() !== storedCaptcha) {
            document.getElementById('captcha').parentElement.parentElement.classList.add('error');
            document.getElementById('captcha-error').style.display = 'block';
            document.getElementById('captcha-error').textContent = 'Kode verifikasi tidak sesuai';
            isValid = false;
        }
        
        return isValid;
    }
};