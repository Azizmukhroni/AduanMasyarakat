/**
 * Menampilkan toast notification
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe toast ('success', 'error', 'info')
 */
export function showToast(message, type = 'success') {
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
export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Animasi angka
 * @param {string} id - ID element
 * @param {number} start - Nilai awal
 * @param {number} end - Nilai akhir
 * @param {number} duration - Durasi animasi (ms)
 */
export function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerHTML = value.toLocaleString('id-ID');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Menampilkan skeleton loading
 * @param {HTMLElement} container - Container element
 * @param {number} count - Jumlah skeleton items
 */
export function showSkeletonLoading(container, count = 3) {
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