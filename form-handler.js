import { uploadFilesToFirebase } from './firebase-client.js';
import { saveComplaintToLocal, updateComplaintStats } from './complaints-manager.js';
import { getUploadedFiles, clearFiles } from './file-upload.js';
import { showToast } from './utils.js';
import { formspreeConfig } from './config.js';

/**
 * Menangani pengiriman form
 * @param {HTMLFormElement} form - Form element
 */
export async function handleFormSubmission(form) {
    const submitButton = document.getElementById('submit-button');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Tampilkan loading state
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline';
    submitButton.disabled = true;
    loadingOverlay.classList.add('active');
    
    // Ambil data dari form
    const formData = new FormData(form);
    const complaintData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        location: formData.get('location'),
        category: formData.get('category'),
        description: formData.get('description'),
        images: []
    };
    
    // Generate complaint ID
    const complaintId = 'ADU-' + Date.now();
    
    try {
        // Upload files jika ada
        const uploadedFiles = getUploadedFiles();
        if (uploadedFiles.length > 0 && firebaseInitialized) {
            const uploadedUrls = await uploadFilesToFirebase(uploadedFiles, complaintId);
            complaintData.images = uploadedUrls;
        }
        
        // Simpan ke localStorage
        saveComplaintToLocal(complaintData);
        
        // Perbarui tampilan daftar pengaduan
        displayComplaints();
        
        // Perbarui statistik
        updateComplaintStats();
        
        // Kirim data ke Formspree
        await sendToFormspree(complaintData, complaintId);
        
        // Reset form
        form.reset();
        clearFiles();
        showToast('Pengaduan berhasil dikirim!', 'success');
        
    } catch (error) {
        console.error('Error processing complaint:', error);
        showToast('Terjadi kesalahan saat memproses pengaduan. Silakan coba lagi.', 'error');
    } finally {
        // Sembunyikan loading state
        submitText.style.display = 'inline';
        submitLoading.style.display = 'none';
        submitButton.disabled = false;
        loadingOverlay.classList.remove('active');
    }
}

/**
 * Mengirim data ke Formspree
 * @param {Object} complaintData - Data pengaduan
 * @param {string} complaintId - ID pengaduan
 */
async function sendToFormspree(complaintData, complaintId) {
    const formspreeFormData = new FormData();
    formspreeFormData.append('name', complaintData.name);
    formspreeFormData.append('email', complaintData.email);
    formspreeFormData.append('phone', complaintData.phone);
    formspreeFormData.append('location', complaintData.location);
    formspreeFormData.append('category', complaintData.category);
    formspreeFormData.append('description', complaintData.description);
    formspreeFormData.append('complaintId', complaintId);
    
    // Tambahkan info tentang file yang diupload
    if (complaintData.images.length > 0) {
        formspreeFormData.append('attachments', `${complaintData.images.length} file terlampir`);
        complaintData.images.forEach((img, index) => {
            formspreeFormData.append(`attachment_${index + 1}`, img.url);
        });
    }
    
    const response = await fetch(formspreeConfig.endpoint, {
        method: 'POST',
        body: formspreeFormData,
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Formspree submission failed');
    }
    
    return response;
}