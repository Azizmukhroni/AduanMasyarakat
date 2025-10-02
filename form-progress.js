// js/form-progress.js
const FormProgressManager = {
    currentStep: 1,
    totalSteps: 4,
    
    init: function() {
        this.setupStepNavigation();
        this.updateProgress();
    },
    
    setupStepNavigation: function() {
        // Validasi setiap field ketika user mengisi
        const formFields = document.querySelectorAll('#complaint-form input, #complaint-form select, #complaint-form textarea');
        
        formFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateCurrentStep();
            });
            
            field.addEventListener('input', () => {
                this.validateCurrentStep();
            });
        });
    },
    
    validateCurrentStep: function() {
        let isValid = true;
        
        switch(this.currentStep) {
            case 1: // Informasi dasar
                isValid = this.validateStep1();
                break;
            case 2: // Detail pengaduan
                isValid = this.validateStep2();
                break;
            case 3: // Lampiran (opsional)
                isValid = true; // Lampiran tidak wajib
                break;
        }
        
        this.updateProgress();
        return isValid;
    },
    
    validateStep1: function() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        return name !== '' && email !== '' && emailRegex.test(email);
    },
    
    validateStep2: function() {
        const location = document.getElementById('location').value.trim();
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        
        return location !== '' && category !== '' && description !== '';
    },
    
    updateProgress: function() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    },
    
    nextStep: function() {
        if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
            this.currentStep++;
            this.updateProgress();
            this.scrollToForm();
        }
    },
    
    prevStep: function() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
            this.scrollToForm();
        }
    },
    
    scrollToForm: function() {
        document.getElementById('form-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
};