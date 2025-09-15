import { APP_CONFIG } from './config.js';
import { showToast } from './utils.js';

// Global state
let uploadedFiles = [];

/**
 * Inisialisasi file upload
 */
function initFileUpload() {
    const fileInput = document.getElementById('file-input');
    const fileDropArea = document.getElementById('file-drop-area');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    if (!fileInput || !fileDropArea) return;
    
    // Event listener untuk area drop
    fileDropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.style.borderColor = '#2980b9';
        fileDropArea.style.backgroundColor = '#e8f4fc';
    });
    
    fileDropArea.addEventListener('dragleave', () => {
        fileDropArea.style.borderColor = '#3498db';
        fileDropArea.style.backgroundColor = '#f8f9fa';
    });
    
    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.style.borderColor = '#3498db';
        fileDropArea.style.backgroundColor = '#f8f9fa';
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });
    
    // Fungsi untuk menangani file
    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            if (uploadedFiles.length >= APP_CONFIG.MAX_FILES) {
                showToast(`Maksimal ${APP_CONFIG.MAX_FILES} file yang diizinkan`, 'error');
                break;
            }
            
            const file = files[i];
            
            // Validasi tipe file
            if (!APP_CONFIG.ACCEPTED_FILE_TYPES.includes(file.type)) {
                showToast('Hanya file JPG, PNG, dan PDF yang diizinkan', 'error');
                continue;
            }
            
            // Validasi ukuran file
            if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
                showToast('Ukuran file maksimal 5MB', 'error');
                continue;
            }
            
            // Tambahkan file ke daftar
            uploadedFiles.push(file);
            
            // Tampilkan preview
            displayFilePreview(file);
        }
        
        // Update input file
        updateFileInput();
    }
    
    function displayFilePreview(file) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        
        if (file.type.includes('image')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                previewDiv.appendChild(img);
                
                const removeBtn = document.createElement('div');
                removeBtn.className = 'image-preview-remove';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.onclick = () => removeFile(file);
                previewDiv.appendChild(removeBtn);
            };
            reader.readAsDataURL(file);
        } else {
            // Untuk file PDF
            previewDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <i class="fas fa-file-pdf" style="font-size: 30px; color: #e74c3c;"></i>
                    <p style="font-size: 10px; margin-top: 5px; text-align: center;">${file.name}</p>
                </div>
                <div class="image-preview-remove" onclick="removeFileFromPreview(this.parentNode, '${file.name}')">
                    <i class="fas fa-times"></i>
                </div>
            `;
        }
        
        imagePreviewContainer.appendChild(previewDiv);
    }
    
    function removeFile(fileToRemove) {
        uploadedFiles = uploadedFiles.filter(file => file !== fileToRemove);
        updateFileInput();
        updatePreviews();
    }
    
    function removeFileFromPreview(previewElement, fileName) {
        uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
        previewElement.remove();
        updateFileInput();
    }
    
    function updatePreviews() {
        imagePreviewContainer.innerHTML = '';
        uploadedFiles.forEach(file => {
            displayFilePreview(file);
        });
    }
    
    function updateFileInput() {
        // Buat DataTransfer object baru
        const dataTransfer = new DataTransfer();
        
        // Tambahkan semua file yang diupload
        uploadedFiles.forEach(file => {
            dataTransfer.items.add(file);
        });
        
        // Update file input
        fileInput.files = dataTransfer.files;
        
        // Update teks di area drop
        if (uploadedFiles.length > 0) {
            fileDropArea.querySelector('p').textContent = `${uploadedFiles.length} file dipilih. Klik untuk menambah atau ubah`;
        } else {
            fileDropArea.querySelector('p').textContent = 'Seret dan lepas file di sini atau klik untuk memilih';
        }
    }
    
    // Fungsi global untuk menghapus file dari preview
    window.removeFileFromPreview = removeFileFromPreview;
}

/**
 * Mendapatkan file yang diupload
 * @returns {File[]} Array of uploaded files
 */
function getUploadedFiles() {
    return uploadedFiles;
}

/**
 * Menghapus semua file
 */
function clearFiles() {
    uploadedFiles = [];
    const fileInput = document.getElementById('file-input');
    const fileDropArea = document.getElementById('file-drop-area');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    if (fileInput) fileInput.value = '';
    if (fileDropArea) fileDropArea.querySelector('p').textContent = 'Seret dan lepas file di sini atau klik untuk memilih';
    if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
}

// Export functions
export { initFileUpload, getUploadedFiles, clearFiles };