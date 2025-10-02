// js/autosave.js
const AutoSaveManager = {
    storageKey: 'complaint_draft',
    interval: null,
    isEnabled: true,
    
    init: function() {
        if (!this.isEnabled) return;
        
        // Load saved data jika ada
        this.loadDraft();
        
        // Setup autosave setiap 30 detik
        this.interval = setInterval(() => {
            this.saveDraft();
        }, 30000);
        
        // Save ketika user meninggalkan halaman
        window.addEventListener('beforeunload', () => {
            this.saveDraft();
        });
        
        // Save ketika form di-submit
        document.getElementById('complaint-form')?.addEventListener('submit', () => {
            this.clearDraft();
        });
        
        console.log('Autosave manager initialized');
    },
    
    saveDraft: function() {
        if (!this.isEnabled) return;
        
        const formData = {
            name: document.getElementById('name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            location: document.getElementById('location')?.value || '',
            category: document.getElementById('category')?.value || '',
            description: document.getElementById('description')?.value || '',
            timestamp: new Date().getTime(),
            step: FormProgressManager?.currentStep || 1
        };
        
        // Hanya save jika ada data yang diisi
        if (this.hasData(formData)) {
            localStorage.setItem(this.storageKey, JSON.stringify(formData));
            console.log('Draft saved automatically');
        }
    },
    
    hasData: function(formData) {
        return formData.name !== '' || 
               formData.email !== '' || 
               formData.phone !== '' || 
               formData.location !== '' || 
               formData.category !== '' || 
               formData.description !== '';
    },
    
    loadDraft: function() {
        if (!this.isEnabled) return;
        
        const draft = localStorage.getItem(this.storageKey);
        if (draft) {
            const formData = JSON.parse(draft);
            
            // Tampilkan notifikasi hanya jika draft kurang dari 24 jam
            const draftAge = Date.now() - formData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 jam
                
            if (draftAge < maxAge) {
                setTimeout(() => {
                    this.showDraftNotification(formData);
                }, 1000);
            } else {
                // Hapus draft yang sudah kedaluwarsa
                this.clearDraft();
            }
        }
    },
    
    showDraftNotification: function(formData) {
        // Cek jika sudah ada notifikasi
        if (document.querySelector('.draft-notification')) return;
        
        const notification = document.createElement('div');
        notification.className = 'draft-notification';
        notification.innerHTML = `
            <div class="draft-content">
                <p><strong>Draft Tersimpan</strong></p>
                <p>Anda memiliki draft pengaduan yang belum diselesaikan. Ingin melanjutkan?</p>
                <button id="load-draft-btn">Muat Draft</button>
                <button id="discard-draft-btn">Hapus Draft</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        document.getElementById('load-draft-btn').addEventListener('click', () => {
            this.populateForm(formData);
            notification.remove();
        });
        
        document.getElementById('discard-draft-btn').addEventListener('click', () => {
            this.clearDraft();
            notification.remove();
        });
        
        // Auto-hide setelah 10 detik
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    },
    
    populateForm: function(formData) {
        document.getElementById('name').value = formData.name || '';
        document.getElementById('email').value = formData.email || '';
        document.getElementById('phone').value = formData.phone || '';
        document.getElementById('location').value = formData.location || '';
        document.getElementById('category').value = formData.category || '';
        document.getElementById('description').value = formData.description || '';
        
        // Update progress step jika ada
        if (formData.step && FormProgressManager) {
            FormProgressManager.currentStep = formData.step;
            FormProgressManager.updateProgress();
        }
        
        showToast('Draft berhasil dimuat', 'success');
    },
    
    clearDraft: function() {
        localStorage.removeItem(this.storageKey);
        if (this.interval) {
            clearInterval(this.interval);
        }
        console.log('Draft cleared');
    },
    
    disable: function() {
        this.isEnabled = false;
        this.clearDraft();
    },
    
    enable: function() {
        this.isEnabled = true;
        this.init();
    }
};