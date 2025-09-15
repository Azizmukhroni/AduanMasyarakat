import { showToast, escapeHtml, showSkeletonLoading } from './utils.js';
import { firebaseInitialized, db } from './config.js';

// Global state
let currentPage = 1;
let filteredComplaints = [];

/**
 * Inisialisasi manajer pengaduan
 */
function initComplaintsManager() {
    // Setup event listeners untuk pencarian dan filter
    const searchInput = document.getElementById('search-complaints');
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    const dateFilter = document.getElementById('filter-date');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    
    if (searchInput) searchInput.addEventListener('input', filterComplaints);
    if (categoryFilter) categoryFilter.addEventListener('change', filterComplaints);
    if (statusFilter) statusFilter.addEventListener('change', filterComplaints);
    if (dateFilter) dateFilter.addEventListener('change', filterComplaints);
    if (prevPageBtn) prevPageBtn.addEventListener('click', goToPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
}

/**
 * Memfilter pengaduan berdasarkan kriteria
 */
function filterComplaints() {
    const searchTerm = document.getElementById('search-complaints').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const statusFilter = document.getElementById('filter-status').value;
    const dateFilter = document.getElementById('filter-date').value;
    
    const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    const complaintsList = document.getElementById('complaints-list');
    
    if (complaints.length === 0) {
        complaintsList.innerHTML = `
            <div class="no-complaints">
                <i class="fas fa-inbox"></i>
                <h3>Belum ada pengaduan</h3>
                <p>Anda belum membuat pengaduan apapun. Klik tombol di bawah untuk membuat pengaduan pertama Anda.</p>
                <a href="#form-section" class="btn" style="margin-top: 20px;">Buat Pengaduan</a>
            </div>
        `;
        return;
    }
    
    // Filter logic
    filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.description.toLowerCase().includes(searchTerm) ||
                             complaint.category.toLowerCase().includes(searchTerm) ||
                             complaint.location.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || complaint.category === categoryFilter;
        const matchesStatus = !statusFilter || complaint.status === statusFilter;
        
        let matchesDate = true;
        if (dateFilter) {
            const complaintDate = new Date(complaint.timestamp).toISOString().split('T')[0];
            matchesDate = complaintDate === dateFilter;
        }
        
        return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
    
    currentPage = 1;
    renderComplaintsList();
}

/**
 * Merender daftar pengaduan
 */
function renderComplaintsList() {
    const complaintsList = document.getElementById('complaints-list');
    const paginationInfo = document.getElementById('pagination-info');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    
    if (filteredComplaints.length === 0) {
        complaintsList.innerHTML = `
            <div class="no-complaints">
                <i class="fas fa-search"></i>
                <h3>Tidak ada hasil pencarian</h3>
                <p>Tidak ada pengaduan yang sesuai dengan pencarian Anda.</p>
            </div>
        `;
        return;
    }
    
    // Pagination
    const totalPages = Math.ceil(filteredComplaints.length / 10);
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const currentComplaints = filteredComplaints.slice(startIndex, endIndex);
    
    // Update pagination controls
    if (paginationInfo) {
        paginationInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages;
    }
    
    // Render complaints
    complaintsList.innerHTML = '';
    currentComplaints.forEach(complaint => {
        const date = new Date(complaint.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const complaintCard = document.createElement('div');
        complaintCard.className = `complaint-card ${complaint.status === 'done' ? 'done' : ''}`;
        
        // Generate HTML untuk gambar jika ada
        let imagesHTML = '';
        if (complaint.images && complaint.images.length > 0) {
            imagesHTML = '<div class="complaint-images">';
            complaint.images.forEach(img => {
                imagesHTML += `
                    <div class="complaint-image" onclick="openImageModal('${img.url}')">
                        <img src="${img.url}" alt="Bukti pengaduan">
                    </div>
                `;
            });
            imagesHTML += '</div>';
        }
        
        complaintCard.innerHTML = `
            <div class="complaint-header">
                <span class="complaint-category">${escapeHtml(getCategoryLabel(complaint.category))}</span>
                <span class="complaint-date">${date}</span>
            </div>
            <div class="complaint-description">
                ${escapeHtml(complaint.description)}
            </div>
            ${imagesHTML}
            <div class="complaint-footer">
                <span class="complaint-id">ID: ${complaint.id}</span>
                <span class="status ${complaint.status === 'done' ? 'done' : 'process'}">
                    ${complaint.status === 'done' ? 'Selesai' : 'Diproses'}
                </span>
            </div>
        `;
        
        complaintsList.appendChild(complaintCard);
    });
}

/**
 * Pergi ke halaman sebelumnya
 */
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderComplaintsList();
    }
}

/**
 * Pergi ke halaman berikutnya
 */
function goToNextPage() {
    const totalPages = Math.ceil(filteredComplaints.length / 10);
    if (currentPage < totalPages) {
        currentPage++;
        renderComplaintsList();
    }
}

/**
 * Mendapatkan label kategori
 * @param {string} categoryValue - Nilai kategori
 * @returns {string} Label kategori
 */
function getCategoryLabel(categoryValue) {
    const categories = {
        'infrastruktur': 'Infrastruktur',
        'kebersihan': 'Kebersihan',
        'keamanan': 'Keamanan',
        'lainnya': 'Lainnya'
    };
    
    return categories[categoryValue] || 'Lainnya';
}

/**
 * Menampilkan daftar pengaduan di homepage
 */
function displayComplaints() {
    const complaintsContainer = document.getElementById('complaints-container');
    const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    
    if (complaints.length === 0) {
        complaintsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <i class="fas fa-inbox" style="font-size: 40px; margin-bottom: 15px;"></i>
                <p>Belum ada pengaduan</p>
                <p>Jadilah yang pertama melaporkan</p>
            </div>
        `;
        return;
    }
    
    // Urutkan berdasarkan timestamp (terbaru pertama)
    complaints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Tampilkan maksimal 3 pengaduan terbaru
    const recentComplaints = complaints.slice(0, 3);
    
    let complaintsHTML = '';
    recentComplaints.forEach(complaint => {
        const date = new Date(complaint.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const statusClass = complaint.status === 'done' ? 'done' : 'process';
        const statusText = complaint.status === 'done' ? 'Selesai' : 'Diproses';
        
        complaintsHTML += `
            <div class="complaint-item">
                <h4>${escapeHtml(getCategoryLabel(complaint.category))}</h4>
                <p>${escapeHtml(complaint.description.substring(0, 60))}${complaint.description.length > 60 ? '...' : ''}</p>
                <p><small>${date}</small></p>
                <span class="status ${statusClass}">${statusText}</span>
            </div>
        `;
    });
    
    complaintsContainer.innerHTML = complaintsHTML;
}

/**
 * Memperbarui statistik pengaduan
 */
function updateComplaintStatistics() {
    // Coba gunakan Firebase terlebih dahulu
    if (firebaseInitialized) {
        db.collection("stats").doc("complaintStats").get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                animateValue('total-complaints', parseInt(document.getElementById('total-complaints').innerText) || 0, data.total, 1000);
                animateValue('processed-complaints', parseInt(document.getElementById('processed-complaints').innerText) || 0, data.processed, 1000);
                animateValue('resolved-complaints', parseInt(document.getElementById('resolved-complaints').innerText) || 0, data.resolved, 1000);
            }
        })
        .catch((error) => {
            console.error("Error getting document:", error);
            useLocalStorageStats();
        });
    } else {
        // Fallback ke localStorage jika Firebase tidak tersedia
        useLocalStorageStats();
    }
}

/**
 * Menggunakan statistik dari localStorage
 */
function useLocalStorageStats() {
    const stats = JSON.parse(localStorage.getItem('complaintStats')) || {
        total: 1256,
        processed: 843,
        resolved: 672
    };
    
    animateValue('total-complaints', parseInt(document.getElementById('total-complaints').innerText) || 0, stats.total, 1000);
    animateValue('processed-complaints', parseInt(document.getElementById('processed-complaints').innerText) || 0, stats.processed, 1000);
    animateValue('resolved-complaints', parseInt(document.getElementById('resolved-complaints').innerText) || 0, stats.resolved, 1000);
}

/**
 * Menyimpan data pengaduan ke localStorage
 * @param {Object} complaintData - Data pengaduan
 * @returns {Object} Data pengaduan dengan ID dan timestamp
 */
function saveComplaintToLocal(complaintData) {
    // Ambil data yang sudah ada dari localStorage
    const existingComplaints = JSON.parse(localStorage.getItem('complaints')) || [];
    
    // Tambahkan ID dan timestamp ke data pengaduan
    complaintData.id = 'ADU-' + Date.now();
    complaintData.timestamp = new Date().toISOString();
    complaintData.status = 'process'; // Status default
    
    // Tambahkan pengaduan baru ke array
    existingComplaints.push(complaintData);
    
    // Simpan kembali ke localStorage
    localStorage.setItem('complaints', JSON.stringify(existingComplaints));
    
    return complaintData;
}

/**
 * Menghitung dan menampilkan statistik pengaduan
 */
function updateComplaintStats() {
    const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    
    // Hitung total pengaduan
    const totalComplaints = complaints.length;
    
    // Hitung pengaduan yang sedang diproses
    const processedComplaints = complaints.filter(complaint => complaint.status === 'process').length;
    
    // Hitung pengaduan yang selesai
    const resolvedComplaints = complaints.filter(complaint => complaint.status === 'done').length;
    
    // Update elemen HTML dengan animasi
    animateValue('total-complaints', 0, totalComplaints, 1000);
    animateValue('processed-complaints', 0, processedComplaints, 1000);
    animateValue('resolved-complaints', 0, resolvedComplaints, 1000);
}

// Export functions
export { 
    initComplaintsManager, 
    displayComplaints, 
    updateComplaintStatistics,
    saveComplaintToLocal,
    updateComplaintStats,
    filterComplaints
};