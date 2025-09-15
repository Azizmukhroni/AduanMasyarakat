import { showSkeletonLoading, filterComplaints } from './complaints-manager.js';
import { showToast } from './utils.js';

/**
 * Membuka modal gambar
 * @param {string} imageUrl - URL gambar
 */
export function openImageModal(imageUrl) {
    const imageModal = document.getElementById('image-modal');
    const imageModalContent = document.getElementById('image-modal-content');
    
    if (!imageModal || !imageModalContent) return;
    
    // Hapus konten sebelumnya
    while (imageModalContent.firstChild) {
        imageModalContent.removeChild(imageModalContent.firstChild);
    }
    
    // Tambahkan gambar baru
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = "Bukti pengaduan";
    
    // Tambahkan tombol close
    const closeBtn = document.createElement('span');
    closeBtn.className = 'image-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeImageModal;
    
    imageModalContent.appendChild(img);
    imageModalContent.appendChild(closeBtn);
    
    // Tampilkan modal
    imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Menutup modal gambar
 */
export function closeImageModal() {
    const imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Menampilkan modal daftar pengaduan
 */
export function showComplaintsModal() {
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
 * Menutup modal daftar pengaduan
 */
export function closeComplaintsModal() {
    const complaintsModal = document.getElementById('complaints-modal');
    if (complaintsModal) {
        complaintsModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Global functions untuk event handlers
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;